const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.protect = (req, res, next) => {
    let token;
    // 1) Getting token and check if it's there
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'You are not logged in! Please log in to get access.' });
    }

    // 2) Verification token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token. Please log in again.' });
        }

        // 3) Check if user still exists
        const query = 'SELECT id, username, role_id FROM users WHERE id = ?';
        db.get(query, [decoded.id], (err, user) => {
            if (err) {
                console.error('Database error in protect middleware:', err);
                console.error('Query was attempted with decoded user ID:', decoded.id);
                // This will catch database errors
                return res.status(500).json({ message: 'An error occurred while fetching user data.' });
            }
            if (!user) {
                return res.status(401).json({ message: 'The user belonging to this token does no longer exist.' });
            }

            // GRANT ACCESS TO PROTECTED ROUTE
            req.user = user;
            next();
        });
    });
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role_id)) {
            return res.status(403).json({ message: 'You do not have permission to perform this action' });
        }
        next();
    };
};
