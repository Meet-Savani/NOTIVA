const express = require('express');
const cors = require('cors');
require('dotenv').config();
const dns = require('dns');

// DNS fallback for Atlas SRV lookups
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { authenticateToken, authenticateAdmin } = require('./utilities');
const app = express();
const PORT = process.env.PORT || 3000;
const mongoose = require('mongoose');
const User = require('./models/user.model');
const Note = require('./models/note.model');
const helmet = require('helmet');
const path = require('path');

// Database Connection 
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("Database connected successfully!");
        await initAdmin();
    })
    .catch((err) => {
        console.error("Database connection failed:", err.message);
    });

// Initialize master admin in database
const initAdmin = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        const adminUsername = process.env.ADMIN_USERNAME || "Notiva";

        if (!adminEmail || !adminPassword) return;

        const normalizedEmail = adminEmail.trim().toLowerCase();

        let existingAdmin = await User.findOne({
            $or: [
                { email: normalizedEmail },
                { role: "admin" }
            ]
        });

        if (existingAdmin) {
            let needsUpdate = false;

            if (existingAdmin.role !== "admin") {
                existingAdmin.role = "admin";
                needsUpdate = true;
            }
            if (existingAdmin.email !== normalizedEmail) {
                existingAdmin.email = normalizedEmail;
                needsUpdate = true;
            }
            if (existingAdmin.fullName !== adminUsername) {
                existingAdmin.fullName = adminUsername;
                needsUpdate = true;
            }
            if (existingAdmin.isSuspended) {
                existingAdmin.isSuspended = false;
                needsUpdate = true;
            }

            let isSamePassword = false;
            try {
                isSamePassword = await bcrypt.compare(adminPassword, existingAdmin.password);
            } catch (e) {
                isSamePassword = false;
            }

            if (!isSamePassword && existingAdmin.password !== adminPassword) {
                existingAdmin.password = await bcrypt.hash(adminPassword, 10);
                needsUpdate = true;
            }

            if (needsUpdate) {
                await existingAdmin.save();
                console.log(`[Notiva] Master Admin synced: ${normalizedEmail}`);
            } else {
                console.log(`[Notiva] Master Admin verified: ${normalizedEmail}`);
            }
        } else {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            const newAdmin = new User({
                fullName: adminUsername,
                email: normalizedEmail,
                password: hashedPassword,
                role: "admin",
                isSuspended: false
            });
            await newAdmin.save();
            console.log(`[Notiva] Master Admin created: ${normalizedEmail}`);
        }
    } catch (error) {
        console.error("[Notiva] Master Admin sync:", error.message);
    }
};
app.use(cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
}));
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
});

// Create Account
app.post('/create-account', async (req, res) => {
    const { fullName, email, password } = req.body;

    if(!fullName) {
        return res.status(400).json({ error: true, message: "Full name is required" });
    }
    if(!email) {
        return res.status(400).json({ error: true, message: "Email is required" });
    }
    if(!password) {
        return res.status(400).json({ error: true, message: "Password is required" });
    }

    // Protect admin email from being registered as a user
    if (process.env.ADMIN_EMAIL && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()) {
        return res.status(400).json({ error: true, message: "This email address is reserved." });
    }

    const isUser = await User.findOne({ email });
    if(isUser) {
        return res.json({ error: true, message: "User already exists" });
    }

    // Hash the password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ 
        fullName, 
        email, 
        password: hashedPassword,
        isSuspended: false,
    });
    await user.save();

    const userPayload = { _id: user._id, fullName: user.fullName, email: user.email, avatar: user.avatar || "" };
    const accessToken = jwt.sign({ user: userPayload, role: "user" }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '36000m',
    });

    return res.status(201).json({
        error: false, 
        user: userPayload, 
        role: "user",
        accessToken, 
        message: "Account created successfully",
    });
});

// Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if(!email) {
        return res.status(400).json({ error: true, message: "Email is required" });
    }
    if(!password) {
        return res.status(400).json({ error: true, message: "Password is required" });
    }

    // Check if credentials match the single admin from .env
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (
        (email.toLowerCase() === (adminEmail || '').toLowerCase() || email === adminUsername) &&
        password === adminPassword
    ) {
        let adminUser = await User.findOne({ role: "admin" });
        const adminPayload = {
            _id: adminUser?._id ? adminUser._id.toString() : "admin_root",
            fullName: adminUser?.fullName || "Notiva Administrator",
            email: adminEmail,
            username: adminUsername,
            avatar: adminUser?.avatar || "",
        };
        const accessToken = jwt.sign({ user: adminPayload, role: "admin" }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "36000m",
        });

        return res.status(200).json({
            error: false,
            message: "Admin Login Successful",
            email: adminEmail,
            accessToken,
            user: adminPayload,
            role: "admin",
        });
    }

    const userInfo = await User.findOne({ email });
    if(!userInfo) {
        return res.status(400).json({ error: true, message: "User doesn't exist" });
    }

    // Check if user is suspended by admin
    if (userInfo.isSuspended) {
        return res.status(403).json({ 
            error: true, 
            message: "Your account has been suspended by an administrator. Please contact support." 
        });
    }

    // Compare with bcrypt
    let isPasswordValid = false;
    try {
        isPasswordValid = await bcrypt.compare(password, userInfo.password);
    } catch (err) {
        isPasswordValid = false;
    }

    // Fallback for legacy plain-text passwords
    const isMatch = isPasswordValid || (userInfo.password === password);

    if(isMatch) {
        // Upgrade legacy password to bcrypt
        if(!isPasswordValid && userInfo.password === password) {
            const salt = await bcrypt.genSalt(10);
            userInfo.password = await bcrypt.hash(password, salt);
            await userInfo.save();
        }

        const userPayload = { 
            _id: userInfo._id, 
            fullName: userInfo.fullName, 
            email: userInfo.email,
            avatar: userInfo.avatar || ""
        };
        const accessToken = jwt.sign({ user: userPayload, role: "user" }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "36000m",
        });

        return res.status(200).json({
            error: false,
            message: "Login Successful",
            email,
            accessToken,
            user: userPayload,
            role: "user",
        });
    } else {
        return res.status(400).json({ error: true, message: "Invalid Credentials" });
    }
});

// Admin Login
app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;

    if(!username || !password) {
        return res.status(400).json({ error: true, message: "Username/Email and Password are required" });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    const isUserMatch = (
        username.trim() === adminUsername || 
        username.trim().toLowerCase() === (adminEmail || '').toLowerCase()
    );
    const isPassMatch = (password === adminPassword);

    if (isUserMatch && isPassMatch) {
        let adminUser = await User.findOne({ role: "admin" });
        const adminPayload = {
            _id: adminUser?._id ? adminUser._id.toString() : "admin_root",
            fullName: adminUser?.fullName || "Notiva Administrator",
            email: adminEmail,
            username: adminUsername,
            avatar: adminUser?.avatar || "",
        };
        const accessToken = jwt.sign({ user: adminPayload, role: "admin" }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "36000m",
        });

        return res.status(200).json({
            error: false,
            message: "Admin Login Successful",
            accessToken,
            admin: adminPayload,
            user: adminPayload,
            role: "admin",
        });
    } else {
        return res.status(401).json({ error: true, message: "Invalid Admin Credentials" });
    }
});

// Get User (or Admin) Info
app.get('/get-user', authenticateToken, async (req, res) => {
    const { user, role } = req.user;

    if (role === "admin" || user?._id === "admin_root") {
        let adminDoc = null;
        if (user?._id && mongoose.Types.ObjectId.isValid(user._id)) {
            adminDoc = await User.findById(user._id);
        }
        if (!adminDoc) {
            adminDoc = await User.findOne({ role: "admin" });
        }

        return res.status(200).json({
            user: {
                _id: adminDoc?._id ? adminDoc._id.toString() : "admin_root",
                fullName: adminDoc?.fullName || "Notiva Administrator",
                email: adminDoc?.email || process.env.ADMIN_EMAIL,
                avatar: adminDoc?.avatar || "",
                createdAt: adminDoc?.createdAt || new Date(),
                updatedAt: adminDoc?.updatedAt || new Date(),
                role: "admin",
            },
            role: "admin",
            message: "Admin fetched successfully",
        });
    }

    if (!user || !user._id || !mongoose.Types.ObjectId.isValid(user._id)) {
        return res.status(400).json({ error: true, message: "Invalid user identifier" });
    }

    const isUser = await User.findById(user._id);
    if(!isUser) {
        return res.status(401).json({ error: true, message: "User doesn't exist" });
    }

    if (isUser.isSuspended) {
        return res.status(403).json({ error: true, message: "Account is suspended" });
    }

    return res.status(200).json({
        user: { 
            fullName: isUser.fullName, 
            email: isUser.email, 
            avatar: isUser.avatar || "",
            _id: isUser._id, 
            createdAt: isUser.createdAt, 
            updatedAt: isUser.updatedAt,
            isSuspended: isUser.isSuspended,
            role: isUser.role || "user",
        },
        role: isUser.role || "user",
        message: "User fetched successfully",
    });
});

// Helper to resolve user document and safe filter identifiers
const resolveTargetUser = async (req) => {
    if (!req.user) return null;
    const { user, role } = req.user;
    const isAdmin = role === "admin" || user?.role === "admin" || user?._id === "admin_root";

    if (isAdmin) {
        let adminDoc = null;
        if (user?._id && mongoose.Types.ObjectId.isValid(user._id)) {
            adminDoc = await User.findById(user._id);
        }
        if (!adminDoc) {
            adminDoc = await User.findOne({ role: "admin" });
        }
        const adminId = adminDoc?._id || user?._id || "admin_root";
        const filterIds = adminDoc 
            ? [adminDoc._id, adminDoc._id.toString(), "admin_root"] 
            : ["admin_root"];

        return {
            _id: adminId,
            userDoc: adminDoc,
            isAdmin: true,
            filterIds,
        };
    }

    let dbUser = null;
    if (user?._id && mongoose.Types.ObjectId.isValid(user._id)) {
        dbUser = await User.findById(user._id);
    }
    if (!dbUser && user?.email) {
        dbUser = await User.findOne({ email: user.email.toLowerCase() });
    }

    if (!dbUser || dbUser.isSuspended) {
        return null;
    }

    const userId = dbUser._id;
    return {
        _id: userId,
        userDoc: dbUser,
        isAdmin: false,
        filterIds: [userId, userId.toString()],
    };
};

// Update Profile (Full Name & Avatar)
app.put('/update-profile', authenticateToken, async (req, res) => {
    const { fullName, avatar } = req.body;

    if (!fullName || fullName.trim().length === 0) {
        return res.status(400).json({ error: true, message: "Full Name is required" });
    }

    try {
        const target = await resolveTargetUser(req);
        if (!target || !target.userDoc) {
            return res.status(404).json({ error: true, message: "User not found" });
        }

        const dbUser = target.userDoc;
        dbUser.fullName = fullName.trim();
        if (typeof avatar === 'string') {
            dbUser.avatar = avatar;
        }
        await dbUser.save();

        return res.json({
            error: false,
            user: { 
                _id: dbUser._id, 
                fullName: dbUser.fullName, 
                email: dbUser.email, 
                avatar: dbUser.avatar || "",
                createdAt: dbUser.createdAt,
                role: dbUser.role || (target.isAdmin ? "admin" : "user")
            },
            message: "Profile updated successfully",
        });
    } catch (error) {
        console.error("Update profile error:", error);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
});

// Change Password
app.put('/change-password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: true, message: "Current password and new password are required" });
    }

    try {
        const target = await resolveTargetUser(req);
        if (!target || !target.userDoc) return res.status(404).json({ error: true, message: "User not found" });

        const dbUser = target.userDoc;
        const isMatch = await bcrypt.compare(currentPassword, dbUser.password);
        if (!isMatch && dbUser.password !== currentPassword) {
            return res.status(400).json({ error: true, message: "Incorrect current password" });
        }

        const salt = await bcrypt.genSalt(10);
        dbUser.password = await bcrypt.hash(newPassword, salt);
        await dbUser.save();

        return res.json({ error: false, message: "Password changed successfully" });
    } catch (error) {
        console.error("Change password error:", error);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
});

// Add Note
app.post('/add-note', authenticateToken, async (req, res) => {
    const { title, content, tags, category } = req.body;
    
    if(!title) {
        return res.status(400).json({ error: true, message: "Title is required" });
    }
    if(!content) {
        return res.status(400).json({ error: true, message: "Content is required" });
    }

    try {
        const target = await resolveTargetUser(req);
        if (!target || !target._id) {
            return res.status(401).json({ error: true, message: "Unauthorized: User not found" });
        }

        const note = new Note({
            title, 
            content,
            tags: tags || [], 
            category: category || "General",
            userId: target._id,
        });
        await note.save();

        return res.status(201).json({
            error: false,
            note,
            message: "Note added successfully",
        });
    } catch (error) {
        console.error("Add note error:", error);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
});

// Edit Note
app.put('/edit-note/:noteId', authenticateToken, async (req, res) => {
    const noteId = req.params.noteId;
    const { title, content, tags, category, isPinned, isFavorite, isArchived } = req.body;

    try {
        const target = await resolveTargetUser(req);
        if (!target || !target._id) {
            return res.status(401).json({ error: true, message: "Unauthorized" });
        }

        const note = await Note.findOne({ _id: noteId, userId: { $in: target.filterIds } });

        if(!note) {
            return res.status(404).json({ error: true, message: "Note not found" });
        }

        if(title !== undefined) note.title = title;
        if(content !== undefined) note.content = content;
        if(tags !== undefined) note.tags = tags;
        if(category !== undefined) note.category = category;
        if(isPinned !== undefined) note.isPinned = isPinned;
        if(isFavorite !== undefined) note.isFavorite = isFavorite;
        if(isArchived !== undefined) note.isArchived = isArchived;

        await note.save();

        return res.status(200).json({
            error: false,
            note,
            message: "Note updated successfully",
        });
    } catch (error) {
        console.error("Edit note error:", error);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
});

// Get All Notes
app.get('/get-all-notes', authenticateToken, async (req, res) => {
    try {
        const target = await resolveTargetUser(req);
        if (!target || !target._id) {
            return res.status(401).json({ error: true, message: "Unauthorized" });
        }

        const notes = await Note.find({ userId: { $in: target.filterIds } }).sort({ isPinned: -1, createdAt: -1 });
        return res.json({ error: false, notes, message: "All Notes fetched successfully" });
    } catch (error) {
        console.error("Get all notes error:", error);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
});

// Delete Note
app.delete('/delete-note/:noteId', authenticateToken, async (req, res) => {
    const noteId = req.params.noteId;

    try {
        const target = await resolveTargetUser(req);
        if (!target || !target._id) {
            return res.status(401).json({ error: true, message: "Unauthorized" });
        }

        const note = await Note.findOne({ _id: noteId, userId: { $in: target.filterIds } });

        if(!note) {
            return res.status(404).json({ error: true, message: "Note not found" });
        }

        await note.deleteOne({ _id: noteId });

        return res.status(200).json({
            error: false,
            message: "Note deleted successfully",
        });
    } catch (error) {
        console.error("Delete note error:", error);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
});

// Toggle isPinned
app.put('/update-isPinned/:noteId', authenticateToken, async (req, res) => {
    const noteId = req.params.noteId;
    const { isPinned } = req.body;

    try { 
        const target = await resolveTargetUser(req);
        if (!target || !target._id) {
            return res.status(401).json({ error: true, message: "Unauthorized" });
        }

        const note = await Note.findOne({ _id: noteId, userId: { $in: target.filterIds } });
        if(!note) {
            return res.status(404).json({ error: true, message: "Note not found" });
        }

        note.isPinned = isPinned;
        await note.save();

        return res.status(200).json({
            error: false,
            note,
            message: "Pin status updated successfully",
        });
    } catch (error) {
        console.error("Update isPinned error:", error);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
});

// Toggle isFavorite
app.put('/update-isFavorite/:noteId', authenticateToken, async (req, res) => {
    const noteId = req.params.noteId;
    const { isFavorite } = req.body;

    try {
        const target = await resolveTargetUser(req);
        if (!target || !target._id) {
            return res.status(401).json({ error: true, message: "Unauthorized" });
        }

        const note = await Note.findOne({ _id: noteId, userId: { $in: target.filterIds } });
        if(!note) {
            return res.status(404).json({ error: true, message: "Note not found" });
        }

        note.isFavorite = isFavorite;
        await note.save();

        return res.status(200).json({
            error: false,
            note,
            message: "Favorite status updated successfully",
        });
    } catch (error) {
        console.error("Update isFavorite error:", error);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
});

// Toggle isArchived
app.put('/update-isArchived/:noteId', authenticateToken, async (req, res) => {
    const noteId = req.params.noteId;
    const { isArchived } = req.body;

    try {
        const target = await resolveTargetUser(req);
        if (!target || !target._id) {
            return res.status(401).json({ error: true, message: "Unauthorized" });
        }

        const note = await Note.findOne({ _id: noteId, userId: { $in: target.filterIds } });
        if(!note) {
            return res.status(404).json({ error: true, message: "Note not found" });
        }

        note.isArchived = isArchived;
        await note.save();

        return res.status(200).json({
            error: false,
            note,
            message: isArchived ? "Note archived" : "Note unarchived",
        });
    } catch (error) {
        console.error("Update isArchived error:", error);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
});

// Search Notes
app.get('/search-notes', authenticateToken, async (req, res) => {
    const { query } = req.query;

    if(!query) {
        return res.status(400).json({ error: true, message: "Query is required" });
    }

    try {
        const target = await resolveTargetUser(req);
        if (!target || !target._id) {
            return res.status(401).json({ error: true, message: "Unauthorized" });
        }

        const regex = new RegExp(query, "i");
        const matchingNotes = await Note.find({
            userId: { $in: target.filterIds },
            $or: [
                { title: { $regex: regex } },
                { content: { $regex: regex } },
                { category: { $regex: regex } },
                { tags: { $regex: regex } },
            ],
        });

        return res.status(200).json({ 
            error: false, 
            notes: matchingNotes, 
            message: "Matching notes fetched successfully" 
        });
    } catch (error) {
        console.error("Search notes error:", error);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
});

// Admin: System Statistics
app.get('/admin/stats', authenticateAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isSuspended: false });
        const suspendedUsers = await User.countDocuments({ isSuspended: true });
        const totalNotes = await Note.countDocuments();
        const pinnedNotes = await Note.countDocuments({ isPinned: true });
        const favoriteNotes = await Note.countDocuments({ isFavorite: true });
        const archivedNotes = await Note.countDocuments({ isArchived: true });

        // Today's activity
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const todayNotes = await Note.countDocuments({ createdAt: { $gte: startOfDay } });
        const todayUsers = await User.countDocuments({ createdAt: { $gte: startOfDay } });

        // Category breakdown (normalizing empty/null values to "General" and sorting stably: count DESC, oldest firstCreatedAt ASC, _id ASC)
        const categoriesAggregation = await Note.aggregate([
            {
                $group: {
                    _id: {
                        $cond: [
                            {
                                $and: [
                                    { $ne: ["$category", null] },
                                    { $ne: ["$category", ""] }
                                ]
                            },
                            "$category",
                            "General"
                        ]
                    },
                    count: { $sum: 1 },
                    firstCreatedAt: { $min: "$createdAt" }
                }
            },
            {
                $sort: {
                    count: -1,
                    firstCreatedAt: 1,
                    _id: 1
                }
            }
        ]);

        return res.json({
            error: false,
            stats: {
                totalUsers,
                activeUsers,
                suspendedUsers,
                totalNotes,
                pinnedNotes,
                favoriteNotes,
                archivedNotes,
                todayNotes,
                todayUsers,
                categoriesBreakdown: categoriesAggregation,
            },
        });
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
});

// Admin: Get Users
app.get('/admin/users', authenticateAdmin, async (req, res) => {
    try {
        const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 }).lean();
        
        // Count notes per user
        const usersWithStats = await Promise.all(users.map(async (u) => {
            const noteCount = await Note.countDocuments({ userId: u._id });
            return {
                ...u,
                noteCount,
            };
        }));

        return res.json({ error: false, users: usersWithStats });
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
});

// Admin: Toggle Suspend User
app.put('/admin/toggle-suspend/:userId', authenticateAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if(!user) return res.status(404).json({ error: true, message: "User not found" });

        // Protect master admin from suspension
        if (user.role === 'admin' || user.email.toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase()) {
            return res.status(400).json({ error: true, message: "Master Administrator account cannot be suspended." });
        }

        user.isSuspended = !user.isSuspended;
        await user.save();

        return res.json({ 
            error: false, 
            message: user.isSuspended ? "User account suspended" : "User account activated", 
            isSuspended: user.isSuspended 
        });
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
});

// Admin: Delete User
app.delete('/admin/user/:userId', authenticateAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if(!user) return res.status(404).json({ error: true, message: "User not found" });

        // Protect master admin from deletion
        if (user.role === 'admin' || user.email.toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase()) {
            return res.status(400).json({ error: true, message: "Master Administrator account cannot be deleted." });
        }

        const userId = req.params.userId;
        let objectId = null;
        if (mongoose.Types.ObjectId.isValid(userId)) {
            objectId = new mongoose.Types.ObjectId(userId);
        }

        const deleteQuery = objectId 
            ? { $or: [{ userId: userId }, { userId: objectId }, { userId: user._id }, { userId: user._id.toString() }] }
            : { $or: [{ userId: userId }, { userId: user._id }] };

        // 1. Permanently delete all personal notes belonging to this user
        await Note.deleteMany(deleteQuery);
        // 2. Permanently delete user account
        await User.findByIdAndDelete(userId);

        return res.json({ error: false, message: "User and all personal notes permanently deleted" });
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
});

// Admin: Get All Notes
app.get('/admin/notes', authenticateAdmin, async (req, res) => {
    try {
        const notes = await Note.find().populate('userId', 'fullName email isSuspended').sort({ createdAt: -1 });
        return res.json({ error: false, notes });
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
});

// Admin: Delete Note
app.delete('/admin/note/:noteId', authenticateAdmin, async (req, res) => {
    try {
        const note = await Note.findById(req.params.noteId);
        if(!note) return res.status(404).json({ error: true, message: "Note not found" });

        await note.deleteOne();

        return res.json({ error: false, message: "Content successfully removed by administrator" });
    } catch (error) {
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
});

// SPA Fallback
app.get('*', (req, res, next) => {
    const indexPath = path.join(__dirname, "../frontend/dist", "index.html");
    res.sendFile(indexPath, (err) => {
        if (err) {
            next();
        }
    });
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error("Unhandled server error:", err);
    if (res.headersSent) {
        return next(err);
    }
    return res.status(500).json({ error: true, message: "Internal Server Error" });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
