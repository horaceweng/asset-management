const bcrypt = require('bcrypt');
const db = require('../config/db');

exports.createUser = async (req, res) => {
    const { username, password, full_name, role_id } = req.body;
    const saltRounds = 10;

    try {
        const password_hash = await bcrypt.hash(password, saltRounds);
        const sql = 'INSERT INTO users (username, password_hash, full_name, role_id) VALUES (?, ?, ?, ?)';
        
        db.run(sql, [username, password_hash, full_name, role_id], function(err) {
            if (err) {
                return res.status(500).json({ message: 'Server error', error: err.message });
            }
            // Get the newly created user
            db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, newUser) => {
                if (err) {
                    return res.status(500).json({ message: 'Server error', error: err.message });
                }
                res.status(201).json(newUser);
            });
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.getUsers = async (req, res) => {
    const sql = 'SELECT id, username, full_name, role_id FROM users';
    db.all(sql, [], (err, users) => {
        if (err) {
            return res.status(500).json({ message: 'Server error', error: err.message });
        }
        res.status(200).json(users);
    });
};
