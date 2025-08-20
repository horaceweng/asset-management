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
    // 1. 從 request body 中多讀取一個 manager_ids 陣列
    const { name, parent_id, description, manager_ids } = req.body;

    const insertCategorySql = 'INSERT INTO categories (name, parent_id, description) VALUES (?, ?, ?)';

    // 2. 使用 db.serialize 來確保資料庫操作的順序性
    db.serialize(() => {
        db.run(insertCategorySql, [name, parent_id, description], function (err) {
            if (err) {
                return res.status(400).json({ message: 'Failed to create category', error: err.message });
            }
            
            const categoryId = this.lastID; // 3. 取得剛剛建立的分類 ID

            // 4. 如果有傳入管理者 ID，就進行指派
            if (manager_ids && manager_ids.length > 0) {
                const insertManagerSql = 'INSERT INTO category_managers (category_id, user_id) VALUES (?, ?)';
                const stmt = db.prepare(insertManagerSql);
                manager_ids.forEach(userId => {
                    stmt.run(categoryId, userId);
                });
                stmt.finalize(); // 5. 執行所有插入操作
            }

            res.status(201).json({ id: categoryId, name });
        });
    });
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/AssetManager+
exports.updateCategory = (req, res) => {
    const { id } = req.params;
    const { name, parent_id, description, manager_ids } = req.body;

    db.serialize(() => {
        // 1. 更新 categories 表本身的資料
        const updateCategorySql = 'UPDATE categories SET name = ?, parent_id = ?, description = ? WHERE id = ?';
        db.run(updateCategorySql, [name, parent_id, description, id]);

        // 2. 刪除這個分類所有舊的管理者關聯
        const deleteManagersSql = 'DELETE FROM category_managers WHERE category_id = ?';
        db.run(deleteManagersSql, [id]);

        // 3. 如果有傳入新的管理者 ID，就建立新的關聯
        if (manager_ids && manager_ids.length > 0) {
            const insertManagerSql = 'INSERT INTO category_managers (category_id, user_id) VALUES (?, ?)';
            const stmt = db.prepare(insertManagerSql);
            manager_ids.forEach(userId => {
                stmt.run(id, userId);
            });
            stmt.finalize();
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
