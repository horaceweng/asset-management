const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

// @desc    Get all assets
// @route   GET /api/assets
// @access  Private
exports.getAllAssets = (req, res) => {
    const sql = `
        SELECT a.*, c.name as category_name, u.full_name as current_user_name
        FROM assets a
        LEFT JOIN categories c ON a.category_id = c.id
        LEFT JOIN users u ON a.current_user_id = u.id
        ORDER BY a.created_at DESC
    `;
    db.all(sql, [], (err, assets) => {
        if (err) {
            return res.status(500).json({ message: 'Server error', error: err.message });
        }
        res.status(200).json(assets);
    });
};

// @desc    Get single asset by ID
// @route   GET /api/assets/:id
// @access  Private
exports.getAssetById = (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT a.*, c.name as category_name, u.full_name as current_user_name
        FROM assets a
        LEFT JOIN categories c ON a.category_id = c.id
        LEFT JOIN users u ON a.current_user_id = u.id
        WHERE a.id = ?
    `;
    db.get(sql, [id], (err, asset) => {
        if (err) {
            return res.status(500).json({ message: 'Server error', error: err.message });
        }
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }
        res.status(200).json(asset);
    });
};


// @desc    Create an asset
// @route   POST /api/assets
// @access  Private/AssetManager+
exports.createAsset = (req, res) => {
    const { name, asset_type, category_id, features } = req.body;

    // Check if category is a leaf node
    db.get('SELECT 1 FROM categories WHERE parent_id = ?', [category_id], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Server error checking category', error: err.message });
        }
        if (row) {
            return res.status(400).json({ message: 'Assets can only be assigned to leaf categories (categories with no subcategories).' });
        }

        const unique_code = `ASSET-${uuidv4()}`;
        const photo_url = req.file ? `/uploads/${req.file.filename}` : null;

        const sql = `INSERT INTO assets (name, unique_code, asset_type, category_id, features, photo_url)
                     VALUES (?, ?, ?, ?, ?, ?)`;

        db.run(sql, [name, unique_code, asset_type, category_id, features, photo_url], function (err) {
            if (err) {
                return res.status(400).json({ message: 'Failed to create asset', error: err.message });
            }
            res.status(201).json({ id: this.lastID, name, unique_code });
        });
    });
};

// @desc    Update an asset
// @route   PUT /api/assets/:id
// @access  Private/AssetManager+
exports.updateAsset = (req, res) => {
    const { id } = req.params;
    const { name, category_id, status, features } = req.body;

    const performUpdate = () => {
        let setClauses = [];
        let params = [];

        if (name) {
            setClauses.push('name = ?');
            params.push(name);
        }
        if (category_id) {
            setClauses.push('category_id = ?');
            params.push(category_id);
        }
        if (status) {
            setClauses.push('status = ?');
            params.push(status);
        }
        if (features) {
            setClauses.push('features = ?');
            params.push(features);
        }
        if (req.file) {
            const photo_url = `/uploads/${req.file.filename}`;
            setClauses.push('photo_url = ?');
            params.push(photo_url);
        }
        
        if (setClauses.length === 0 && !req.file) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        params.push(id);
        const sql = `UPDATE assets SET ${setClauses.join(', ')}, updated_at = datetime('now') WHERE id = ?`;

        db.run(sql, params, function (err) {
            if (err) {
                return res.status(400).json({ message: 'Failed to update asset', error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: 'Asset not found' });
            }
            res.status(200).json({ message: 'Asset updated successfully' });
        });
    };

    if (category_id) {
        const checkLeafSql = 'SELECT COUNT(*) as child_count FROM categories WHERE parent_id = ?';
        db.get(checkLeafSql, [category_id], (err, row) => {
            if (err) {
                return res.status(500).json({ message: 'Server error checking category', error: err.message });
            }
            if (row.child_count > 0) {
                return res.status(400).json({ message: 'Cannot assign asset to a non-leaf category' });
            }
            performUpdate();
        });
    } else {
        performUpdate();
    }
};

// @desc    Generate QR Code for an asset
// @route   GET /api/assets/:id/qrcode
// @access  Private
exports.generateQrCode = (req, res) => {
    const { id } = req.params;
    console.log(`[QR] Request received for asset ID: ${id}`);
    db.get('SELECT unique_code FROM assets WHERE id = ?', [id], (err, asset) => {
        if (err) {
            console.error(`[QR] Database error for ID ${id}:`, err.message);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }
        if (!asset) {
            console.error(`[QR] Asset with ID ${id} not found.`);
            return res.status(404).json({ message: 'Asset not found' });
        }
        
        console.log(`[QR] Found unique_code: ${asset.unique_code} for asset ID: ${id}`);
        const viewUrl = `http://localhost:3000/assets/view/${asset.unique_code}`;
        console.log(`[QR] Generating QR for URL: ${viewUrl}`);
        
        QRCode.toDataURL(viewUrl, (err, url) => {
            if (err) {
                console.error(`[QR] Failed to generate QR code for URL: ${viewUrl}`, err);
                return res.status(500).json({ message: 'Failed to generate QR code' });
            }
            console.log(`[QR] Successfully generated QR code for asset ID: ${id}`);
            res.status(200).json({ qrCodeUrl: url });
        });
    });
};

// @desc    Delete (retire) an asset
// @route   DELETE /api/assets/:id
// @access  Private/AssetManager+
exports.deleteAsset = (req, res) => {
    const { id } = req.params;
    const sql = `UPDATE assets SET status = 'retired', updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

    db.run(sql, [id], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Failed to retire asset', error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Asset not found' });
        }
        res.status(200).json({ message: 'Asset retired successfully' });
    });
};
