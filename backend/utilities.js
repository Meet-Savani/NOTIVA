const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if(!token) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
        if(err) return res.sendStatus(401);
        req.user = payload;
        next();
    });
};

const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if(!token) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
        if(err) return res.sendStatus(401);
        if(!payload || payload.role !== "admin") {
            return res.status(403).json({ error: true, message: "Forbidden: Admin privileges required" });
        }
        req.user = payload;
        next();
    });
};

module.exports = { authenticateToken, authenticateAdmin };
