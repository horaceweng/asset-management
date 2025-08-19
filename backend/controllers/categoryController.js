const db = require('../config/db');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private
exports.getAllCategories = (req, res) => {
    // We can use a recursive query to build a tree structure directly in SQL if the DB supports it.
    // For SQLite, it's simpler to fetch all and build the tree in the application.
    const sql = 'SELECT * FROM categories ORDER BY parent_id, name';
    db.all(sql, [], (err, categories) => {
        if (err) {
            return res.status(500).json({ message: 'Server error', error: err.message });
        }
        // Simple list for now, tree structure can be built on the client-side
        res.status(200).json(categories);
    });
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/AssetManager+
exports.createCategory = (req, res) => {
    const { name, parent_id, description } = req.body;
    const sql = 'INSERT INTO categories (name, parent_id, description) VALUES (?, ?, ?)';

    db.run(sql, [name, parent_id, description], function (err) {
        if (err) {
            return res.status(400).json({ message: 'Failed to create category', error: err.message });
        }
        res.status(201).json({ id: this.lastID, name, parent_id, description });
    });
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/AssetManager+
exports.updateCategory = (req, res) => {
    const { id } = req.params;
    const { name, parent_id, description } = req.body;
    const sql = 'UPDATE categories SET name = ?, parent_id = ?, description = ? WHERE id = ?';

    db.run(sql, [name, parent_id, description, id], function (err) {
        if (err) {
            return res.status(400).json({ message: 'Failed to update category', error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json({ message: 'Category updated successfully' });
    });
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/AssetManager+
exports.deleteCategory = (req, res) => {
    const { id } = req.params;
    // Note: Add logic to handle subcategories. For now, we'll prevent deletion of categories that are parents.
    db.get('SELECT 1 FROM categories WHERE parent_id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Server error', error: err.message });
        }
        if (row) {
            return res.status(400).json({ message: 'Cannot delete a category that has subcategories.' });
        }

        const sql = 'DELETE FROM categories WHERE id = ?';
        db.run(sql, [id], function (err) {
            if (err) {
                return res.status(500).json({ message: 'Failed to delete category', error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: 'Category not found' });
            }
            res.status(200).json({ message: 'Category deleted successfully' });
        });
    });
};
