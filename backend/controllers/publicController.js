const db = require('../config/db');

// @desc    Get public asset info by unique code
// @route   GET /api/public/assets/:unique_code
// @access  Public
exports.getPublicAssetByCode = (req, res) => {
    const { unique_code } = req.params;
    const sql = `
        SELECT a.name, a.unique_code, a.status, a.photo_url, a.features,
               c.name as category_name, u.full_name as current_user_name
        FROM assets a
        LEFT JOIN categories c ON a.category_id = c.id
        LEFT JOIN users u ON a.current_user_id = u.id
        WHERE a.unique_code = ?
    `;
    db.get(sql, [unique_code], (err, asset) => {
        if (err) {
            return res.status(500).json({ message: 'Server error', error: err.message });
        }
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }
        res.status(200).json(asset);
    });
};
