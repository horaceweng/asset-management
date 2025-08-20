const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'You are not logged in! Please log in to get access.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token. Please log in again.' });
        }

        const sql = `SELECT id, username, role_id FROM users WHERE id = ?`;
        db.get(sql, [decoded.id], (err, user) => {
            if (err || !user) {
                return res.status(401).json({ message: 'The user belonging to this token does no longer exist.' });
            }

            // Log for debugging
            //console.log('[AuthMiddleware] User authenticated:', { id: user.id, username: user.username, role_id: user.role_id });
            
            req.user = user;
            next();
        });
    });
};

exports.restrictTo = (...roleNames) => {
    return (req, res, next) => {
        const userRoleId = req.user.role_id;

        const sql = `SELECT role_name FROM roles WHERE id = ?`;
        db.get(sql, [userRoleId], (err, role) => {
            if (err || !role) {
                return res.status(500).json({ message: 'Error fetching user role.' });
            }

            if (!roleNames.includes(role.role_name)) {
                return res.status(403).json({ message: 'You do not have permission to perform this action' });
            }
            next();
        });
    };
};
