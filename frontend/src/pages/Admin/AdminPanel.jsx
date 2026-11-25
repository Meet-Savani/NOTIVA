import React, { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Modal from 'react-modal'
import { 
    MdOutlineShield, 
    MdOutlinePeople, 
    MdOutlineStickyNote2, 
    MdOutlineBarChart, 
    MdOutlineDelete, 
    MdOutlineBlock, 
    MdOutlineCheckCircle, 
    MdSearch, 
    MdOutlineRefresh,
    MdOutlineHome,
    MdOutlinePerson,
    MdOutlineCategory,
    MdOutlineAccessTime,
    MdOutlineTrendingUp,
    MdClose,
    MdOutlineRemoveRedEye,
    MdLogout,
    MdOutlineFolder,
    MdAdminPanelSettings,
    MdChevronLeft,
    MdChevronRight,
    MdArrowUpward,
    MdArrowDownward,
    MdSwapVert
} from 'react-icons/md'
import { HiOutlineSun, HiOutlineMoon } from 'react-icons/hi'
import axiosInstance from '../../utils/axiosInstance'
import Loader from '../../components/Loader/Loader'
import { broadcastRealtimeUpdate, subscribeToRealtimeUpdates } from '../../utils/realtimeSync'
import { DEFAULT_CATEGORIES, removeUserCustomCategories, getSortedCustomCategories } from '../../utils/constants'
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal'
import { getInitials } from '../../utils/helper'
import moment from 'moment'
import { useTheme } from '../../utils/theme'

const AdminPanel = () => {
    const { isDark, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'users' | 'notes'
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [notes, setNotes] = useState([]);
    const [userSearch, setUserSearch] = useState('');
    const [userStatusFilter, setUserStatusFilter] = useState('all'); // 'all' | 'active' | 'suspended' | 'admin'
    const [userSortField, setUserSortField] = useState('joined'); // 'name' | 'joined' | 'notes' | 'role' | 'status'
    const [userSortOrder, setUserSortOrder] = useState('desc'); // 'asc' | 'desc'
    const [userPage, setUserPage] = useState(1);
    const USERS_PER_PAGE = 10;
    const [noteSearch, setNoteSearch] = useState('');
    const [noteCategoryFilter, setNoteCategoryFilter] = useState('all');
    const [noteSortOrder, setNoteSortOrder] = useState('desc'); // 'desc' (high/new) | 'asc' (low/old)
    const [notePage, setNotePage] = useState(1);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    const [selectedNote, setSelectedNote] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [confirmModal, setConfirmModal] = useState({
        isShown: false,
        title: '',
        message: '',
        itemTitle: '',
        confirmText: 'Confirm',
        type: 'delete',
        onConfirm: null
    });
    const navigate = useNavigate();

    const handleLogout = () => {
        const theme = localStorage.getItem('theme');
        localStorage.clear();
        if (theme) localStorage.setItem('theme', theme);
        navigate('/', { replace: true });
    };

    const fetchStats = async () => {
        try {
            const res = await axiosInstance.get('/admin/stats');
            if (res.data && !res.data.error) {
                setStats(res.data.stats);
            }
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                handleLogout();
            }
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await axiosInstance.get('/admin/users');
            if (res.data && !res.data.error) {
                setUsers(res.data.users);
            }
        } catch (err) {
            if (import.meta.env.DEV) console.error("Failed to fetch users", err);
        }
    };

    const fetchNotes = async () => {
        try {
            const res = await axiosInstance.get('/admin/notes');
            if (res.data && !res.data.error) {
                setNotes(res.data.notes);
            }
        } catch (err) {
            if (import.meta.env.DEV) console.error("Failed to fetch notes", err);
        }
    };

    const loadAllData = async (silent = false) => {
        if (!silent) setIsRefreshing(true);
        await Promise.all([fetchStats(), fetchUsers(), fetchNotes()]);
        if (!silent) setIsRefreshing(false);
        setIsLoading(false);
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/', { replace: true });
            return;
        }

        // Initial load
        loadAllData(false);

        // 1. Cross-tab & Cross-panel Real-Time Broadcast Listener
        const unsubscribe = subscribeToRealtimeUpdates(() => {
            loadAllData(true);
        });

        // 2. Tab focus & visibility change listener (instantly fetches before refreshing)
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                loadAllData(true);
            }
        };

        const handleFocus = () => {
            loadAllData(true);
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("focus", handleFocus);

        // 3. Periodic Background Fallback Auto-Fetch (Every 15 seconds in active tab)
        const pollTimer = setInterval(() => {
            if (document.visibilityState === "visible") {
                loadAllData(true);
            }
        }, 15000);

        return () => {
            unsubscribe();
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("focus", handleFocus);
            clearInterval(pollTimer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleToggleSuspend = async (userId) => {
        try {
            const res = await axiosInstance.put(`/admin/toggle-suspend/${userId}`);
            if (res.data && !res.data.error) {
                fetchUsers();
                fetchStats();
                broadcastRealtimeUpdate('USERS_CHANGED');
            }
        } catch (err) {
            if (import.meta.env.DEV) console.error("Failed to toggle suspension", err);
        }
    };

    const requestToggleSuspend = (userId, currentStatus, userName) => {
        const action = currentStatus ? "activate" : "suspend";
        setConfirmModal({
            isShown: true,
            title: action === "suspend" ? "Suspend Account" : "Activate Account",
            message: `Are you sure you want to ${action} the account for "${userName}"?`,
            itemTitle: userName,
            confirmText: action === "suspend" ? "Suspend Account" : "Activate Account",
            type: action === "suspend" ? "delete" : "warning",
            onConfirm: () => handleToggleSuspend(userId)
        });
    };

    const handleDeleteUser = async (userId, userName) => {
        try {
            const res = await axiosInstance.delete(`/admin/user/${userId}`);
            if (res.data && !res.data.error) {
                if (selectedNote && (selectedNote.userId?._id === userId || selectedNote.userId === userId)) {
                    setSelectedNote(null);
                }
                removeUserCustomCategories(userId);
                if (userName) removeUserCustomCategories(userName);

                fetchUsers();
                fetchStats();
                fetchNotes();
                broadcastRealtimeUpdate('USER_DELETED', { deletedUserId: userId });
                broadcastRealtimeUpdate('NOTES_CHANGED');
            }
        } catch (err) {
            if (import.meta.env.DEV) console.error("Failed to delete user", err);
        }
    };

    const requestDeleteUser = (userId, userName) => {
        setConfirmModal({
            isShown: true,
            title: "Delete User Account",
            message: `Permanently delete user "${userName}" and all of their personal notes? This cannot be undone.`,
            itemTitle: userName,
            confirmText: "Delete User",
            type: "delete",
            onConfirm: () => handleDeleteUser(userId, userName)
        });
    };

    const handleDeleteNote = async (noteId) => {
        try {
            const res = await axiosInstance.delete(`/admin/note/${noteId}`);
            if (res.data && !res.data.error) {
                if (selectedNote && selectedNote._id === noteId) {
                    setSelectedNote(null);
                }
                fetchNotes();
                fetchStats();
                broadcastRealtimeUpdate('NOTES_CHANGED');
            }
        } catch (err) {
            if (import.meta.env.DEV) console.error("Failed to delete note", err);
        }
    };

    const requestDeleteNote = (noteId, noteTitle) => {
        setConfirmModal({
            isShown: true,
            title: "Delete Note",
            message: `Remove note "${noteTitle || 'Untitled'}" from the system? This action is permanent.`,
            itemTitle: noteTitle || "Untitled",
            confirmText: "Delete Note",
            type: "delete",
            onConfirm: () => handleDeleteNote(noteId)
        });
    };

    useEffect(() => {
        setUserPage(1);
    }, [userSearch, userStatusFilter, userSortField, userSortOrder]);

    // Track responsive window size for exact Notes pagination rules
    useEffect(() => {
        let timer = null;
        const handleResize = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                setWindowWidth(window.innerWidth);
            }, 100);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Notes per page based on device size:
    // Mobile (< 768px): max 10
    // Tablet (768px - 1279px): 2 cards in a row * 6 rows max = 12
    // Laptop & above (>= 1280px): 3 cards in a row * 6 rows max = 18
    const notesPerPage = useMemo(() => {
        if (windowWidth < 768) {
            return 10;
        } else if (windowWidth < 1279) {
            return 12;
        } else {
            return 18;
        }
    }, [windowWidth]);

    const handleUserSort = (field) => {
        if (userSortField === field) {
            setUserSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setUserSortField(field);
            // High to Low default for counts & dates, A-Z for names
            setUserSortOrder(field === 'notes' || field === 'joined' ? 'desc' : 'asc');
        }
        setUserPage(1);
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = 
            (u.fullName || '').toLowerCase().includes(userSearch.toLowerCase()) ||
            (u.email || '').toLowerCase().includes(userSearch.toLowerCase());
        
        if (!matchesSearch) return false;

        if (userStatusFilter === 'active') return !u.isSuspended && u.role !== 'admin';
        if (userStatusFilter === 'suspended') return u.isSuspended;
        if (userStatusFilter === 'admin') return u.role === 'admin';
        return true;
    });

    const sortedUsers = useMemo(() => {
        if (!userSortField) return filteredUsers;

        return [...filteredUsers].sort((a, b) => {
            switch (userSortField) {
                case 'name': {
                    const valA = (a.fullName || '').toLowerCase();
                    const valB = (b.fullName || '').toLowerCase();
                    return userSortOrder === 'asc' 
                        ? valA.localeCompare(valB) 
                        : valB.localeCompare(valA);
                }
                case 'joined': {
                    const valA = new Date(a.createdAt || 0).getTime();
                    const valB = new Date(b.createdAt || 0).getTime();
                    return userSortOrder === 'asc' ? valA - valB : valB - valA;
                }
                case 'notes': {
                    const valA = Number(a.noteCount) || 0;
                    const valB = Number(b.noteCount) || 0;
                    return userSortOrder === 'asc' ? valA - valB : valB - valA;
                }
                case 'role': {
                    const valA = (a.role || 'user').toLowerCase();
                    const valB = (b.role || 'user').toLowerCase();
                    return userSortOrder === 'asc'
                        ? valA.localeCompare(valB)
                        : valB.localeCompare(valA);
                }
                case 'status': {
                    const valA = a.isSuspended ? 1 : 0;
                    const valB = b.isSuspended ? 1 : 0;
                    return userSortOrder === 'asc' ? valA - valB : valB - valA;
                }
                default:
                    return 0;
            }
        });
    }, [filteredUsers, userSortField, userSortOrder]);

    const totalUserPages = Math.ceil(sortedUsers.length / USERS_PER_PAGE) || 1;
    const userStartIndex = (userPage - 1) * USERS_PER_PAGE;
    const userEndIndex = Math.min(userStartIndex + USERS_PER_PAGE, sortedUsers.length);
    const paginatedUsers = sortedUsers.slice(userStartIndex, userEndIndex);

    const noteCategories = useMemo(() => {
        const sortedCustom = getSortedCustomCategories(notes);
        return ['all', ...DEFAULT_CATEGORIES, ...sortedCustom];
    }, [notes]);

    const filteredNotes = notes.filter(n => {
        const matchesSearch = 
            (n.title || '').toLowerCase().includes(noteSearch.toLowerCase()) ||
            (n.content || '').toLowerCase().includes(noteSearch.toLowerCase()) ||
            (n.category || '').toLowerCase().includes(noteSearch.toLowerCase()) ||
            (n.userId?.fullName || '').toLowerCase().includes(noteSearch.toLowerCase()) ||
            (n.userId?.email || '').toLowerCase().includes(noteSearch.toLowerCase());

        if (!matchesSearch) return false;

        if (noteCategoryFilter !== 'all') {
            return (n.category || 'General').toLowerCase() === noteCategoryFilter.toLowerCase();
        }

        return true;
    });

    // Reset notes pagination on filter/search or screen change
    useEffect(() => {
        setNotePage(1);
    }, [noteSearch, noteCategoryFilter, notesPerPage]);

    // Auto-reset category filter to 'all' if the selected category was auto-removed (no notes remaining)
    useEffect(() => {
        if (noteCategoryFilter !== 'all' && !noteCategories.some(c => c.toLowerCase() === noteCategoryFilter.toLowerCase())) {
            setNoteCategoryFilter('all');
        }
    }, [noteCategories, noteCategoryFilter]);

    // Sorted Notes (with High/Low date toggle)
    const sortedNotes = useMemo(() => {
        return [...filteredNotes].sort((a, b) => {
            const timeA = new Date(a.createdAt || 0).getTime();
            const timeB = new Date(b.createdAt || 0).getTime();
            return noteSortOrder === 'desc' ? timeB - timeA : timeA - timeB;
        });
    }, [filteredNotes, noteSortOrder]);

    const totalNotePages = Math.ceil(sortedNotes.length / notesPerPage) || 1;
    const noteStartIndex = (notePage - 1) * notesPerPage;
    const noteEndIndex = Math.min(noteStartIndex + notesPerPage, sortedNotes.length);
    const paginatedNotes = sortedNotes.slice(noteStartIndex, noteEndIndex);

    // Normalized, deduplicated category distribution list (stable sort: count/pct DESC, then older category first)
    const categoryDistribution = useMemo(() => {
        if (!stats?.categoriesBreakdown || !Array.isArray(stats.categoriesBreakdown)) return [];

        const categoryMap = new Map();
        stats.categoriesBreakdown.forEach((item) => {
            const rawName = item._id;
            const name = (rawName && typeof rawName === 'string' && rawName.trim()) ? rawName.trim() : 'General';
            const count = Math.max(0, Number(item.count) || 0);
            const firstCreatedAt = item.firstCreatedAt || null;

            const existing = categoryMap.get(name);
            if (!existing) {
                categoryMap.set(name, { count, firstCreatedAt });
            } else {
                let earliest = existing.firstCreatedAt;
                if (firstCreatedAt) {
                    if (!earliest || new Date(firstCreatedAt) < new Date(earliest)) {
                        earliest = firstCreatedAt;
                    }
                }
                categoryMap.set(name, { count: existing.count + count, firstCreatedAt: earliest });
            }
        });

        return Array.from(categoryMap.entries())
            .map(([name, data]) => ({ _id: name, count: data.count, firstCreatedAt: data.firstCreatedAt }))
            .sort((a, b) => {
                // 1. Primary: Count / % descending
                if (b.count !== a.count) {
                    return b.count - a.count;
                }
                // 2. Secondary: If two have same %, old one gets first chance (earliest created first)
                if (a.firstCreatedAt && b.firstCreatedAt) {
                    const timeA = new Date(a.firstCreatedAt).getTime();
                    const timeB = new Date(b.firstCreatedAt).getTime();
                    if (timeA !== timeB) return timeA - timeB;
                } else if (a.firstCreatedAt) {
                    return -1;
                } else if (b.firstCreatedAt) {
                    return 1;
                }
                // 3. Fallback: Stable alphabetical order
                return a._id.localeCompare(b._id);
            });
    }, [stats?.categoriesBreakdown]);

    // Total count across all categorized notes (falls back to stats.totalNotes)
    const totalCategoryNotes = useMemo(() => {
        if (categoryDistribution.length > 0) {
            const sum = categoryDistribution.reduce((acc, curr) => acc + curr.count, 0);
            if (sum > 0) return sum;
        }
        return Math.max(0, Number(stats?.totalNotes) || 0);
    }, [categoryDistribution, stats?.totalNotes]);

    return (
        <div className='h-screen max-h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 transition-colors'>
            {/* Top Admin Navbar */}
            <header className='shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100 dark:border-slate-800 shadow-xs transition-colors'>
                <div className='max-w-7xl mx-auto flex items-center justify-between px-3 sm:px-8 py-2.5 sm:py-3 gap-2 sm:gap-3'>
                    {/* Brand: Icon and Name link to Home Page */}
                    <Link 
                        to="/dashboard" 
                        className='flex items-center gap-2 group shrink-0'
                        title="Go to Home"
                    >
                        <div className='w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-600/20 group-hover:scale-105 transition-transform'>
                            <MdOutlineStickyNote2 className='text-lg sm:text-xl' />
                        </div>
                        <span className='text-base sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors whitespace-nowrap'>
                            Notiva<span className='text-teal-600 dark:text-teal-400'>.</span>
                        </span>
                    </Link>

                    {/* Right Navigation Controls */}
                    <div className='flex items-center gap-1.5 sm:gap-2.5'>
                        {/* Direct Notes Page Navigation Button */}
                        <Link
                            to="/dashboard"
                            className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100/90 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 border border-teal-200/80 dark:border-teal-800/90 text-xs sm:text-[13px] font-semibold text-teal-800 dark:text-teal-300 transition-all shrink-0 shadow-2xs hover:shadow-xs'
                            title='Go to Notes Page'
                        >
                            <MdOutlineStickyNote2 className='text-base text-teal-700 dark:text-teal-300' />
                            <span>Notes Page</span>
                        </Link>

                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            className='p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0'
                            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                            aria-label="Toggle theme"
                        >
                            {isDark ? (
                                <HiOutlineSun className='text-xl text-amber-400 transform hover:rotate-45 transition-transform' />
                            ) : (
                                <HiOutlineMoon className='text-xl text-slate-600 transform hover:-rotate-12 transition-transform' />
                            )}
                        </button>

                        {/* Refresh Button */}
                        <button
                            onClick={loadAllData}
                            className={`p-2 rounded-xl text-slate-400 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-slate-800 transition shrink-0 ${isRefreshing ? 'animate-spin text-teal-600' : ''}`}
                            title='Refresh data'
                            aria-label='Refresh data'
                        >
                            <MdOutlineRefresh className='text-lg' />
                        </button>

                        {/* Sign Out Button */}
                        <button
                            onClick={handleLogout}
                            className='p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0'
                            title='Sign Out'
                            aria-label='Sign Out'
                        >
                            <MdLogout className='text-lg sm:text-xl' />
                        </button>
                    </div>
                </div>
            </header>

            {/* Admin Tabs Bar */}
            <div className='shrink-0 bg-white/70 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800 px-3 sm:px-8 py-2.5'>
                <div className='max-w-7xl mx-auto flex items-center justify-between gap-3'>
                    <div className='flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-x-auto no-scrollbar w-full sm:w-auto'>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 whitespace-nowrap ${
                                activeTab === 'analytics'
                                    ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-2xs'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            <MdOutlineBarChart className='text-base shrink-0' />
                            <span>Analytics</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('users')}
                            className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 whitespace-nowrap ${
                                activeTab === 'users'
                                    ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-2xs'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            <MdOutlinePeople className='text-base shrink-0' />
                            <span>Users ({users.length})</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('notes')}
                            className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 whitespace-nowrap ${
                                activeTab === 'notes'
                                    ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-2xs'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            <MdOutlineStickyNote2 className='text-base shrink-0' />
                            <span>Notes ({notes.length})</span>
                        </button>
                    </div>

                    {/* Elevated Platform Overview Indicator */}
                    <div className='hidden md:flex items-center gap-2'>
                        <div className='inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 shadow-2xs'>
                            <span className='w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0'></span>
                            <span className='font-medium text-slate-500 dark:text-slate-400'>Platform Overview:</span>
                            <span className='font-bold text-slate-800 dark:text-slate-100'>
                                {stats?.totalNotes || 0} {stats?.totalNotes === 1 ? 'Note' : 'Notes'}
                            </span>
                            <span className='text-slate-300 dark:text-slate-600'>•</span>
                            <span className='font-bold text-slate-800 dark:text-slate-100'>
                                {stats?.totalUsers || 0} Registered {stats?.totalUsers === 1 ? 'Account' : 'Accounts'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Admin Scrollable Area */}
            <main className='flex-1 overflow-y-auto px-4 sm:px-8 py-6'>
                <div className='max-w-7xl mx-auto'>
                    {isLoading ? (
                        <Loader message="Loading administrative data..." />
                    ) : (
                        <>
                            {/* TAB 1: SYSTEM ANALYTICS */}
                            {activeTab === 'analytics' && stats && (
                                <div className='space-y-6'>
                                    {/* 4 Metric Cards */}
                                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                                        <div className='p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-teal-200 dark:hover:border-slate-700 transition'>
                                            <div className='flex items-center justify-between'>
                                                <span className='text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-wider'>
                                                    Registered Users
                                                </span>
                                                <div className='w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 flex items-center justify-center text-lg border border-teal-100/60 dark:border-teal-800/60'>
                                                    <MdOutlinePeople />
                                                </div>
                                            </div>
                                            <p className='text-3xl font-extrabold text-slate-900 dark:text-white mt-2'>{stats.totalUsers}</p>
                                            <div className='flex items-center gap-2 mt-2 text-xs'>
                                                <span className='text-emerald-600 dark:text-emerald-400 font-medium'>{stats.activeUsers} Active</span>
                                                <span className='text-slate-300 dark:text-slate-700'>•</span>
                                                <span className='text-red-500 dark:text-red-400 font-medium'>{stats.suspendedUsers} Suspended</span>
                                            </div>
                                        </div>

                                        <div className='p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-teal-200 dark:hover:border-slate-700 transition'>
                                            <div className='flex items-center justify-between'>
                                                <span className='text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-wider'>
                                                    Total Notes
                                                </span>
                                                <div className='w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 flex items-center justify-center text-lg border border-teal-100/60 dark:border-teal-800/60'>
                                                    <MdOutlineStickyNote2 />
                                                </div>
                                            </div>
                                            <p className='text-3xl font-extrabold text-slate-900 dark:text-white mt-2'>{stats.totalNotes}</p>
                                            <div className='flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400'>
                                                <span>{stats.pinnedNotes} Pinned</span>
                                                <span className='text-slate-300 dark:text-slate-700'>•</span>
                                                <span>{stats.favoriteNotes} Starred</span>
                                                <span className='text-slate-300 dark:text-slate-700'>•</span>
                                                <span>{stats.archivedNotes} Archived</span>
                                            </div>
                                        </div>

                                        <div className='p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-200 dark:hover:border-slate-700 transition'>
                                            <div className='flex items-center justify-between'>
                                                <span className='text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-wider'>
                                                    Today's Signups
                                                </span>
                                                <div className='w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-lg border border-emerald-100/60 dark:border-emerald-800/60'>
                                                    <MdOutlineTrendingUp />
                                                </div>
                                            </div>
                                            <p className='text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2'>{stats.todayUsers}</p>
                                            <p className='text-xs text-slate-400 dark:text-slate-500 mt-2'>New user accounts registered today</p>
                                        </div>

                                        <div className='p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-200 dark:hover:border-slate-700 transition'>
                                            <div className='flex items-center justify-between'>
                                                <span className='text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-wider'>
                                                    Today's Notes
                                                </span>
                                                <div className='w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-lg border border-indigo-100/60 dark:border-indigo-800/60'>
                                                    <MdOutlineAccessTime />
                                                </div>
                                            </div>
                                            <p className='text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2'>{stats.todayNotes}</p>
                                            <p className='text-xs text-slate-400 dark:text-slate-500 mt-2'>Fresh notes written platform-wide today</p>
                                        </div>
                                    </div>

                                    {/* Clean Full-Width Category Distribution Section (Fully Responsive across all screen sizes) */}
                                    <div className='p-4 sm:p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-all'>
                                        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5 pb-3 border-b border-slate-100 dark:border-slate-800'>
                                            <div className='flex items-center gap-2.5 min-w-0'>
                                                <div className='w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center text-base sm:text-lg border border-teal-100 dark:border-teal-800/60 shrink-0'>
                                                    <MdOutlineCategory />
                                                </div>
                                                <div className='min-w-0'>
                                                    <h3 className='text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider truncate'>
                                                        Category Distribution
                                                    </h3>
                                                    <p className='text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 truncate'>
                                                        Spread of personal notes across user categories
                                                    </p>
                                                </div>
                                            </div>
                                            <span className='inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 shrink-0 self-start sm:self-auto'>
                                                {categoryDistribution.length} {categoryDistribution.length === 1 ? 'Active Category' : 'Active Categories'}
                                            </span>
                                        </div>

                                        {/* Grid: 1 col on mobile, 2 cols on small tablet (sm), 3 cols on desktop (lg), 4 cols on wide desktop (xl) */}
                                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4'>
                                            {categoryDistribution.length > 0 ? (
                                                categoryDistribution.map((item, idx) => {
                                                    const rawPct = totalCategoryNotes > 0 ? (item.count / totalCategoryNotes) * 100 : 0;
                                                    const roundedPct = Math.round(rawPct);
                                                    const displayPct = item.count > 0 && rawPct < 1 ? '< 1%' : `${roundedPct}%`;
                                                    const barWidth = item.count > 0 ? Math.min(Math.max(rawPct, 2), 100) : 0;

                                                    return (
                                                        <div 
                                                            key={item._id || idx} 
                                                            className='p-3.5 sm:p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 hover:border-teal-200 dark:hover:border-teal-700/60 space-y-2.5 transition-all duration-200 group'
                                                        >
                                                            <div className='flex items-center justify-between gap-2 min-w-0'>
                                                                <div className='flex items-center gap-1.5 min-w-0 flex-1'>
                                                                    <MdOutlineFolder className='text-sm sm:text-base text-teal-600 dark:text-teal-400 shrink-0' />
                                                                    <button
                                                                        onClick={() => {
                                                                            setNoteCategoryFilter(item._id || 'General');
                                                                            setNoteSearch('');
                                                                            setActiveTab('notes');
                                                                        }}
                                                                        className='font-bold text-xs sm:text-[13px] text-slate-800 dark:text-slate-200 truncate hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left cursor-pointer'
                                                                        title={`View all ${item._id || 'General'} notes`}
                                                                    >
                                                                        {item._id || 'General'}
                                                                    </button>
                                                                </div>
                                                                <div className='flex items-center gap-1 shrink-0'>
                                                                    <span className='text-[11px] font-bold text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs'>
                                                                        {item.count} {item.count === 1 ? 'note' : 'notes'}
                                                                    </span>
                                                                    <span className='text-[10.5px] font-bold text-teal-700 dark:text-teal-300 px-1.5 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/80 border border-teal-200/60 dark:border-teal-800/60'>
                                                                        {displayPct}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className='w-full h-2 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden'>
                                                                <div 
                                                                    className='h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500'
                                                                    style={{ width: `${barWidth}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className='col-span-full py-10 px-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700/80 text-center flex flex-col items-center justify-center gap-2'>
                                                    <div className='w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-xl'>
                                                        <MdOutlineCategory />
                                                    </div>
                                                    <p className='text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300'>
                                                        No categories created yet
                                                    </p>
                                                    <p className='text-[11px] text-slate-400 dark:text-slate-500 max-w-sm'>
                                                        When users organize their notes with categories, the distribution breakdown will appear here.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: USER MANAGEMENT */}
                            {activeTab === 'users' && (
                                <div className='space-y-4'>
                                    {/* Toolbar: Search in a single row on tablet & mobile, remaining controls in another row */}
                                    <div className='flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3'>
                                        {/* Search Input (Single row on tablet & mobile) */}
                                        <div className='relative w-full xl:w-80 shrink-0'>
                                            <input
                                                type='text'
                                                placeholder='Search users by name or email...'
                                                value={userSearch}
                                                onChange={(e) => setUserSearch(e.target.value)}
                                                className='w-full text-xs sm:text-sm bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 pl-9 pr-8 py-2 rounded-xl outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 placeholder:text-slate-400 dark:placeholder:text-slate-500'
                                            />
                                            <MdSearch className='absolute left-3 top-2.5 text-slate-400 dark:text-slate-500 text-base' />
                                            {userSearch && (
                                                <button 
                                                    onClick={() => setUserSearch('')}
                                                    className='absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm'
                                                    aria-label="Clear user search"
                                                >
                                                    <MdClose />
                                                </button>
                                            )}
                                        </div>

                                        {/* Remaining Controls (Another row on tablet & mobile: Status Filter + Showing Counter) */}
                                        <div className='flex items-center justify-between gap-2.5 flex-wrap w-full xl:w-auto xl:flex-1 xl:justify-end'>
                                            {/* Status Filter */}
                                            <div className='flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shrink-0 overflow-x-auto no-scrollbar'>
                                                {['all', 'active', 'suspended', 'admin'].map((status) => (
                                                    <button
                                                        key={status}
                                                        onClick={() => setUserStatusFilter(status)}
                                                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                                                            userStatusFilter === status
                                                                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-2xs'
                                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                                        }`}
                                                    >
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Polished User Counter Pill */}
                                            <div className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/60 text-xs font-medium text-slate-600 dark:text-slate-300 shrink-0'>
                                                <span>Showing</span>
                                                <span className='font-bold text-slate-900 dark:text-white px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-900 shadow-2xs text-[11px]'>
                                                    {filteredUsers.length > 0 ? `${userStartIndex + 1}-${userEndIndex}` : '0'}
                                                </span>
                                                <span>of</span>
                                                <span className='font-bold text-slate-900 dark:text-white px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-900 shadow-2xs text-[11px]'>
                                                    {filteredUsers.length}
                                                </span>
                                                <span>{filteredUsers.length === 1 ? 'user' : 'users'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Users Table */}
                                    <div className='bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden'>
                                        <div className='overflow-x-auto'>
                                            <table className='w-full text-xs'>
                                                {/* All Column Headers Centered */}
                                                <thead className='bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10.5px] tracking-wider select-none'>
                                                    <tr>
                                                        {/* User Name Sort */}
                                                        <th className='py-3.5 px-4 text-left whitespace-nowrap'>
                                                            <button
                                                                onClick={() => handleUserSort('name')}
                                                                className='inline-flex items-center gap-1.5 hover:text-teal-600 dark:hover:text-teal-400 transition-colors uppercase font-bold cursor-pointer'
                                                                title={`Sort by User Name (${userSortField === 'name' && userSortOrder === 'asc' ? 'Z to A (High to Low)' : 'A to Z (Low to High)'})`}
                                                            >
                                                                <span>User</span>
                                                                <span className='inline-flex text-xs'>
                                                                    {userSortField === 'name' ? (
                                                                        userSortOrder === 'asc' ? <MdArrowUpward className='text-teal-600 dark:text-teal-400 text-sm' /> : <MdArrowDownward className='text-teal-600 dark:text-teal-400 text-sm' />
                                                                    ) : (
                                                                        <MdSwapVert className='text-slate-400/60 hover:text-slate-600 dark:hover:text-slate-300 text-sm' />
                                                                    )}
                                                                </span>
                                                            </button>
                                                        </th>

                                                        {/* Joined Date Sort */}
                                                        <th className='py-3.5 px-4 text-center whitespace-nowrap'>
                                                            <button
                                                                onClick={() => handleUserSort('joined')}
                                                                className='inline-flex items-center gap-1.5 hover:text-teal-600 dark:hover:text-teal-400 transition-colors uppercase font-bold cursor-pointer'
                                                                title={`Sort by Joined Date (${userSortField === 'joined' && userSortOrder === 'desc' ? 'Oldest first (Low)' : 'Newest first (High)'})`}
                                                            >
                                                                <span>Joined Date</span>
                                                                <span className='inline-flex text-xs'>
                                                                    {userSortField === 'joined' ? (
                                                                        userSortOrder === 'desc' ? <MdArrowDownward className='text-teal-600 dark:text-teal-400 text-sm' /> : <MdArrowUpward className='text-teal-600 dark:text-teal-400 text-sm' />
                                                                    ) : (
                                                                        <MdSwapVert className='text-slate-400/60 hover:text-slate-600 dark:hover:text-slate-300 text-sm' />
                                                                    )}
                                                                </span>
                                                            </button>
                                                        </th>

                                                        {/* Notes Count Sort */}
                                                        <th className='py-3.5 px-4 text-center whitespace-nowrap'>
                                                            <button
                                                                onClick={() => handleUserSort('notes')}
                                                                className='inline-flex items-center gap-1.5 hover:text-teal-600 dark:hover:text-teal-400 transition-colors uppercase font-bold cursor-pointer'
                                                                title={`Sort by Notes Count (${userSortField === 'notes' && userSortOrder === 'desc' ? 'Low to High' : 'High to Low'})`}
                                                            >
                                                                <span>Notes Count</span>
                                                                <span className='inline-flex text-xs'>
                                                                    {userSortField === 'notes' ? (
                                                                        userSortOrder === 'desc' ? <MdArrowDownward className='text-teal-600 dark:text-teal-400 text-sm' /> : <MdArrowUpward className='text-teal-600 dark:text-teal-400 text-sm' />
                                                                    ) : (
                                                                        <MdSwapVert className='text-slate-400/60 hover:text-slate-600 dark:hover:text-slate-300 text-sm' />
                                                                    )}
                                                                </span>
                                                            </button>
                                                        </th>

                                                        {/* Role Sort */}
                                                        <th className='py-3.5 px-4 text-center whitespace-nowrap'>
                                                            <button
                                                                onClick={() => handleUserSort('role')}
                                                                className='inline-flex items-center gap-1.5 hover:text-teal-600 dark:hover:text-teal-400 transition-colors uppercase font-bold cursor-pointer'
                                                                title={`Sort by Role (${userSortField === 'role' && userSortOrder === 'asc' ? 'User first' : 'Admin first'})`}
                                                            >
                                                                <span>Role</span>
                                                                <span className='inline-flex text-xs'>
                                                                    {userSortField === 'role' ? (
                                                                        userSortOrder === 'asc' ? <MdArrowUpward className='text-teal-600 dark:text-teal-400 text-sm' /> : <MdArrowDownward className='text-teal-600 dark:text-teal-400 text-sm' />
                                                                    ) : (
                                                                        <MdSwapVert className='text-slate-400/60 hover:text-slate-600 dark:hover:text-slate-300 text-sm' />
                                                                    )}
                                                                </span>
                                                            </button>
                                                        </th>

                                                        {/* Status Sort */}
                                                        <th className='py-3.5 px-4 text-center whitespace-nowrap'>
                                                            <button
                                                                onClick={() => handleUserSort('status')}
                                                                className='inline-flex items-center gap-1.5 hover:text-teal-600 dark:hover:text-teal-400 transition-colors uppercase font-bold cursor-pointer'
                                                                title={`Sort by Status (${userSortField === 'status' && userSortOrder === 'asc' ? 'Suspended first' : 'Active first'})`}
                                                            >
                                                                <span>Status</span>
                                                                <span className='inline-flex text-xs'>
                                                                    {userSortField === 'status' ? (
                                                                        userSortOrder === 'asc' ? <MdArrowUpward className='text-teal-600 dark:text-teal-400 text-sm' /> : <MdArrowDownward className='text-teal-600 dark:text-teal-400 text-sm' />
                                                                    ) : (
                                                                        <MdSwapVert className='text-slate-400/60 hover:text-slate-600 dark:hover:text-slate-300 text-sm' />
                                                                    )}
                                                                </span>
                                                            </button>
                                                        </th>

                                                        <th className='py-3.5 px-4 text-center whitespace-nowrap'>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className='divide-y divide-slate-100 dark:divide-slate-800'>
                                                    {paginatedUsers.length > 0 ? (
                                                        paginatedUsers.map((user) => (
                                                            <tr key={user._id} className='hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition'>
                                                                {/* Column 1: User - Name and Avatar redirect to user's notes */}
                                                                <td className='py-3.5 px-4 whitespace-nowrap min-w-[220px]'>
                                                                    <div className='flex items-center gap-3'>
                                                                        <button
                                                                            onClick={() => {
                                                                                setNoteSearch(user.fullName);
                                                                                setNoteCategoryFilter('all');
                                                                                setActiveTab('notes');
                                                                            }}
                                                                            className='w-9 h-9 rounded-full bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-800/80 text-xs shadow-2xs hover:scale-105 hover:border-teal-300 dark:hover:border-teal-600 transition-all cursor-pointer'
                                                                            title={`View ${user.fullName}'s notes`}
                                                                        >
                                                                            {getInitials(user.fullName)}
                                                                        </button>
                                                                        <div className='min-w-0'>
                                                                            <button
                                                                                onClick={() => {
                                                                                setNoteSearch(user.fullName);
                                                                                setNoteCategoryFilter('all');
                                                                                setActiveTab('notes');
                                                                            }}
                                                                                className='font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-[13px] truncate hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left block cursor-pointer hover:underline'
                                                                                title={`View ${user.fullName}'s notes`}
                                                                            >
                                                                                {user.fullName}
                                                                            </button>
                                                                            <p className='text-[11px] text-slate-400 dark:text-slate-500 truncate'>
                                                                                {user.email}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                {/* Column 2: Joined Date - Simple clean centered date */}
                                                                <td className='py-3.5 px-4 text-center text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs'>
                                                                    {user.createdAt ? moment(user.createdAt).format('DD MMM, YYYY') : 'Unknown'}
                                                                </td>

                                                                {/* Column 3: Notes Count - Clean readable badge like others had */}
                                                                <td className='py-3.5 px-4 text-center whitespace-nowrap text-xs font-semibold'>
                                                                    <span className='inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 font-semibold text-[11.5px]'>
                                                                        {user.noteCount || 0} {user.noteCount === 1 ? 'note' : 'notes'}
                                                                    </span>
                                                                </td>

                                                                {/* Column 4: Role */}
                                                                <td className='py-3.5 px-4 text-center whitespace-nowrap'>
                                                                    <div className='flex items-center justify-center'>
                                                                        {user.role === 'admin' ? (
                                                                            <span className='inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800 shadow-2xs'>
                                                                                <MdAdminPanelSettings className='text-sm text-teal-600 dark:text-teal-400' />
                                                                                Admin
                                                                            </span>
                                                                        ) : (
                                                                            <span className='inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700'>
                                                                                <MdOutlinePerson className='text-sm text-slate-400 dark:text-slate-500' />
                                                                                User
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>

                                                                {/* Column 5: Status (Active / Suspended) */}
                                                                <td className='py-3.5 px-4 text-center whitespace-nowrap'>
                                                                    <div className='flex items-center justify-center'>
                                                                        {user.isSuspended ? (
                                                                            <span className='inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/70 text-red-600 dark:text-red-400 border border-red-200/80 dark:border-red-800/80 shadow-2xs'>
                                                                                <MdOutlineBlock className='text-xs' />
                                                                                <span>Suspended</span>
                                                                            </span>
                                                                        ) : (
                                                                            <span className='inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs'>
                                                                                <MdOutlineCheckCircle className='text-xs text-emerald-600 dark:text-emerald-400' />
                                                                                <span>Active</span>
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>

                                                                {/* Column 6: Actions - Centered */}
                                                                <td className='py-3.5 px-4 text-center whitespace-nowrap'>
                                                                    <div className='flex items-center justify-center gap-2'>
                                                                        {user.role === 'admin' ? (
                                                                            <span className='inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500 italic px-2 py-0.5 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700'>
                                                                                Protected
                                                                            </span>
                                                                        ) : (
                                                                            <>
                                                                                <button
                                                                                    onClick={() => requestToggleSuspend(user._id, user.isSuspended, user.fullName)}
                                                                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                                                                                        user.isSuspended 
                                                                                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200/60 dark:border-emerald-800/60' 
                                                                                            : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200/60 dark:border-amber-800/60'
                                                                                    }`}
                                                                                >
                                                                                    {user.isSuspended ? "Activate" : "Suspend"}
                                                                                </button>

                                                                                <button
                                                                                    onClick={() => requestDeleteUser(user._id, user.fullName)}
                                                                                    className='p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition'
                                                                                    title='Delete user and notes'
                                                                                    aria-label='Delete user'
                                                                                >
                                                                                    <MdOutlineDelete className='text-base' />
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={6} className='py-12 text-center text-slate-400 dark:text-slate-500 text-xs sm:text-sm'>
                                                                No users found matching your search.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination Controls (shown when multiple pages exist) */}
                                        {totalUserPages > 1 && (
                                            <div className='flex items-center justify-center sm:justify-end gap-1.5 px-4 py-3 bg-slate-50/70 dark:bg-slate-800/50 border-t border-slate-200/80 dark:border-slate-800'>
                                                <button
                                                    onClick={() => setUserPage(prev => Math.max(prev - 1, 1))}
                                                    disabled={userPage === 1}
                                                    className='inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition text-xs'
                                                    aria-label="Previous page"
                                                >
                                                    <MdChevronLeft className='text-base' />
                                                    <span className='hidden sm:inline'>Previous</span>
                                                </button>

                                                <div className='flex items-center gap-1'>
                                                    {Array.from({ length: totalUserPages }, (_, i) => i + 1).map((page) => (
                                                        <button
                                                            key={page}
                                                            onClick={() => setUserPage(page)}
                                                            className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                                                                userPage === page
                                                                    ? 'bg-teal-600 text-white shadow-xs'
                                                                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                            }`}
                                                        >
                                                            {page}
                                                        </button>
                                                    ))}
                                                </div>

                                                <button
                                                    onClick={() => setUserPage(prev => Math.min(prev + 1, totalUserPages))}
                                                    disabled={userPage === totalUserPages}
                                                    className='inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition text-xs'
                                                    aria-label="Next page"
                                                >
                                                    <span className='hidden sm:inline'>Next</span>
                                                    <MdChevronRight className='text-base' />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: NOTES MANAGEMENT & CONTENT MODERATION */}
                            {activeTab === 'notes' && (
                                <div className='space-y-4'>
                                    {/* Toolbar: Search in a single row on tablet & mobile, remaining controls in another row */}
                                    <div className='flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3'>
                                        {/* Search Input (Single row on tablet & mobile) */}
                                        <div className='relative w-full xl:w-80 shrink-0'>
                                            <input
                                                type='text'
                                                placeholder='Search notes by title, content, or author...'
                                                value={noteSearch}
                                                onChange={(e) => setNoteSearch(e.target.value)}
                                                className='w-full text-xs sm:text-sm bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 pl-9 pr-8 py-2 rounded-xl outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 placeholder:text-slate-400 dark:placeholder:text-slate-500'
                                            />
                                            <MdSearch className='absolute left-3 top-2.5 text-slate-400 dark:text-slate-500 text-base' />
                                            {noteSearch && (
                                                <button 
                                                    onClick={() => setNoteSearch('')}
                                                    className='absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm'
                                                    aria-label="Clear note search"
                                                >
                                                    <MdClose />
                                                </button>
                                            )}
                                        </div>

                                        {/* Remaining Controls (Another row on tablet & mobile: Category Dropdown + Date Sort + Note Counter Pill) */}
                                        <div className='flex items-center justify-between gap-2.5 flex-wrap w-full xl:w-auto xl:flex-1 xl:justify-end'>
                                            <div className='flex items-center gap-2 flex-wrap'>
                                                {/* Category Dropdown Filter */}
                                                <div className='relative shrink-0'>
                                                    <select
                                                        id='admin-notes-category-select'
                                                        value={noteCategoryFilter}
                                                        onChange={(e) => setNoteCategoryFilter(e.target.value)}
                                                        className='text-xs sm:text-[13px] py-1.5 sm:py-2 pl-3.5 pr-8 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700/90 focus:outline-none focus:ring-2 focus:ring-teal-600/10 focus:border-teal-600 font-semibold cursor-pointer shadow-2xs appearance-none transition-all'
                                                        aria-label='Filter notes by category'
                                                    >
                                                        {noteCategories.map((cat) => (
                                                            <option key={cat} value={cat}>
                                                                {cat.toLowerCase() === 'all' ? 'All Categories' : cat}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 dark:text-slate-500'>
                                                        <svg className='w-4 h-4' viewBox='0 0 20 20' fill='currentColor'>
                                                            <path fillRule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clipRule='evenodd' />
                                                        </svg>
                                                    </div>
                                                </div>

                                                {/* Date High-Low Arrow Sort Button */}
                                                <button
                                                    onClick={() => setNoteSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                                                    className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-teal-500 transition shadow-2xs shrink-0 cursor-pointer'
                                                    title={`Sort notes by date (${noteSortOrder === 'desc' ? 'Newest first (High to Low)' : 'Oldest first (Low to High)'})`}
                                                >
                                                    <span>Date</span>
                                                    <span className='inline-flex text-xs'>
                                                        {noteSortOrder === 'desc' ? (
                                                            <MdArrowDownward className='text-sm text-teal-600 dark:text-teal-400' />
                                                        ) : (
                                                            <MdArrowUpward className='text-sm text-teal-600 dark:text-teal-400' />
                                                        )}
                                                    </span>
                                                    <span className='text-[10px] text-slate-400 dark:text-slate-500 font-normal'>
                                                        {noteSortOrder === 'desc' ? 'High/New' : 'Low/Old'}
                                                    </span>
                                                </button>
                                            </div>

                                            {/* Polished Note Counter Pill */}
                                            <div className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/60 text-xs font-medium text-slate-600 dark:text-slate-300 shrink-0'>
                                                <span>Showing</span>
                                                <span className='font-bold text-slate-900 dark:text-white px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-900 shadow-2xs text-[11px]'>
                                                    {sortedNotes.length > 0 ? `${noteStartIndex + 1}-${noteEndIndex}` : '0'}
                                                </span>
                                                <span>of</span>
                                                <span className='font-bold text-slate-900 dark:text-white px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-900 shadow-2xs text-[11px]'>
                                                    {sortedNotes.length}
                                                </span>
                                                <span>{sortedNotes.length === 1 ? 'total note' : 'total notes'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes Grid: 1 col on mobile (max 10), 2 cols on tablet (max 12), 3 cols on laptop & above (max 18) */}
                                    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-4'>
                                        {paginatedNotes.length > 0 ? (
                                            paginatedNotes.map((note) => (
                                                <div 
                                                    key={note._id} 
                                                    className='p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-teal-200 dark:hover:border-slate-700 transition flex flex-col justify-between group w-full min-w-0'
                                                >
                                                    <div>
                                                        <div className='flex items-start justify-between gap-2 mb-2'>
                                                            <span className='inline-flex text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border border-teal-100 dark:border-teal-800/80 uppercase tracking-wider'>
                                                                {note.category || 'General'}
                                                            </span>

                                                            <div className='flex items-center gap-1'>
                                                                <button
                                                                    onClick={() => setSelectedNote(note)}
                                                                    className='p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0'
                                                                    title='Inspect Note Details'
                                                                    aria-label='Inspect Note'
                                                                >
                                                                    <MdOutlineRemoveRedEye className='text-lg' />
                                                                </button>
                                                                <button
                                                                    onClick={() => requestDeleteNote(note._id, note.title)}
                                                                    className='p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition shrink-0'
                                                                    title='Delete Note'
                                                                    aria-label='Delete Note'
                                                                >
                                                                    <MdOutlineDelete className='text-lg' />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <h4 
                                                            onClick={() => setSelectedNote(note)}
                                                            className='font-display text-[15px] sm:text-base font-semibold text-slate-900 dark:text-slate-100 truncate mb-1 cursor-pointer group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors tracking-tight' 
                                                            title={note.title}
                                                        >
                                                            {note.title}
                                                        </h4>

                                                        <p 
                                                            onClick={() => setSelectedNote(note)}
                                                            className='font-sans text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed break-words cursor-pointer'
                                                        >
                                                            {note.content}
                                                        </p>
                                                    </div>

                                                    <div className='mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500'>
                                                        <div className='min-w-0 pr-2'>
                                                            <p className='font-semibold text-slate-700 dark:text-slate-300 truncate'>
                                                                By:{' '}
                                                                {note.userId?.fullName ? (
                                                                    <button
                                                                        onClick={() => setNoteSearch(note.userId.fullName)}
                                                                        className='hover:text-teal-600 dark:hover:text-teal-400 transition-colors underline-offset-2 hover:underline cursor-pointer'
                                                                        title={`Filter notes by ${note.userId.fullName}`}
                                                                    >
                                                                        {note.userId.fullName}
                                                                    </button>
                                                                ) : (
                                                                    <span>Deleted user</span>
                                                                )}
                                                            </p>
                                                            <p className='truncate text-[10.5px]'>{note.userId?.email || 'N/A'}</p>
                                                        </div>
                                                        <span className='shrink-0 font-medium'>
                                                            {moment(note.createdAt).format('DD MMM, YYYY')}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className='col-span-full py-16 text-center text-slate-400 dark:text-slate-500 text-xs sm:text-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800'>
                                                No notes found matching your filter.
                                            </div>
                                        )}
                                    </div>

                                    {/* Notes Pagination Controls */}
                                    {totalNotePages > 1 && (
                                        <div className='flex items-center justify-between flex-wrap gap-3 pt-3 pb-8 border-t border-slate-200/80 dark:border-slate-800'>
                                            <p className='text-xs text-slate-500 dark:text-slate-400'>
                                                Showing page <span className='font-bold text-slate-800 dark:text-slate-200'>{notePage}</span> of <span className='font-bold text-slate-800 dark:text-slate-200'>{totalNotePages}</span>
                                                <span className='text-[11px] text-slate-400 dark:text-slate-500 ml-1.5'>
                                                    ({notesPerPage} per page)
                                                </span>
                                            </p>

                                            <div className='flex items-center gap-1.5'>
                                                <button
                                                    onClick={() => setNotePage(prev => Math.max(prev - 1, 1))}
                                                    disabled={notePage === 1}
                                                    className='inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition text-xs shadow-2xs cursor-pointer'
                                                    aria-label="Previous notes page"
                                                >
                                                    <MdChevronLeft className='text-base' />
                                                    <span className='hidden sm:inline'>Previous</span>
                                                </button>

                                                <div className='flex items-center gap-1'>
                                                    {Array.from({ length: totalNotePages }, (_, i) => i + 1).map((page) => (
                                                        <button
                                                            key={page}
                                                            onClick={() => setNotePage(page)}
                                                            className={`w-7 h-7 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer ${
                                                                notePage === page
                                                                    ? 'bg-teal-600 text-white shadow-xs'
                                                                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                            }`}
                                                        >
                                                            {page}
                                                        </button>
                                                    ))}
                                                </div>

                                                <button
                                                    onClick={() => setNotePage(prev => Math.min(prev + 1, totalNotePages))}
                                                    disabled={notePage === totalNotePages}
                                                    className='inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition text-xs shadow-2xs cursor-pointer'
                                                    aria-label="Next notes page"
                                                >
                                                    <span className='hidden sm:inline'>Next</span>
                                                    <MdChevronRight className='text-base' />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Note Details Inspection Modal */}
            <Modal
                isOpen={Boolean(selectedNote)}
                onRequestClose={() => setSelectedNote(null)}
                ariaHideApp={false}
                style={{
                    overlay: {
                        backgroundColor: "rgba(15, 23, 42, 0.6)",
                        backdropFilter: "blur(4px)",
                        zIndex: 50,
                    },
                }}
                contentLabel="Admin Note Inspection"
                className="w-[92%] sm:w-[80%] md:w-[60%] lg:w-[48%] max-h-[88vh] bg-white dark:bg-slate-900 rounded-3xl mt-8 sm:mt-10 p-6 overflow-y-auto mx-auto shadow-2xl border border-slate-200/80 dark:border-slate-800 outline-none"
            >
                {selectedNote && (
                    <div className='space-y-4'>
                        <div className='flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800'>
                            <div>
                                <div className='flex items-center gap-2 mb-1.5'>
                                    <span className='text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border border-teal-100 dark:border-teal-800/80 uppercase'>
                                        {selectedNote.category || 'General'}
                                    </span>
                                    {selectedNote.isPinned && (
                                        <span className='text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60'>
                                            Pinned
                                        </span>
                                    )}
                                    {selectedNote.isFavorite && (
                                        <span className='text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60'>
                                            Starred
                                        </span>
                                    )}
                                </div>
                                <h3 className='font-display text-lg sm:text-xl font-semibold text-slate-900 dark:text-white tracking-tight break-words'>
                                    {selectedNote.title}
                                </h3>
                            </div>

                            <button
                                onClick={() => setSelectedNote(null)}
                                className='p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition'
                            >
                                <MdClose className='text-xl' />
                            </button>
                        </div>

                        {/* Author info pill */}
                        <div className='p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs'>
                            <div>
                                <span className='text-slate-400 dark:text-slate-500'>Author: </span>
                                <span className='font-bold text-slate-800 dark:text-slate-200'>
                                    {selectedNote.userId?.fullName || 'Deleted user'}
                                </span>
                                <span className='text-slate-400 dark:text-slate-500 ml-1'>
                                    ({selectedNote.userId?.email || 'N/A'})
                                </span>
                            </div>
                            <span className='text-slate-400 dark:text-slate-500'>
                                {moment(selectedNote.createdAt).format('DD MMM, YYYY • hh:mm A')}
                            </span>
                        </div>

                        {/* Note full content */}
                        <div className='p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 max-h-[300px] overflow-y-auto'>
                            <p className='font-sans text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap break-words'>
                                {selectedNote.content}
                            </p>
                        </div>

                        {/* Tags */}
                        {selectedNote.tags && selectedNote.tags.length > 0 && (
                            <div className='flex items-center gap-1.5 flex-wrap pt-1'>
                                {selectedNote.tags.map((tag, idx) => (
                                    <span key={idx} className='font-sans text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800/70 shadow-2xs'>
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className='flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800'>
                            <button
                                onClick={() => setSelectedNote(null)}
                                className='px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition'
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    const noteToDelete = selectedNote;
                                    requestDeleteNote(noteToDelete._id, noteToDelete.title);
                                }}
                                className='inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-red-50 hover:bg-red-600 text-red-600 dark:text-red-300 hover:text-white dark:bg-red-950/60 dark:hover:bg-red-600 border border-red-200/80 dark:border-red-800/80 text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-md hover:shadow-red-600/20 active:scale-[0.98] transition-all'
                            >
                                <MdOutlineDelete className='text-base' />
                                <span>Delete Note</span>
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmModal
                isOpen={confirmModal.isShown}
                onClose={() => setConfirmModal(prev => ({ ...prev, isShown: false }))}
                onConfirm={() => {
                    if (confirmModal.onConfirm) {
                        confirmModal.onConfirm();
                    }
                    setConfirmModal(prev => ({ ...prev, isShown: false }));
                }}
                title={confirmModal.title}
                message={confirmModal.message}
                itemTitle={confirmModal.itemTitle}
                confirmText={confirmModal.confirmText}
                type={confirmModal.type}
            />
        </div>
    );
};

export default AdminPanel;