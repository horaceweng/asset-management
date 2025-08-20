const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes are protected
router.use(authMiddleware.protect);

router.route('/')
    .get(categoryController.getAllCategories)
    .post(authMiddleware.restrictTo('system_admin'), categoryController.createCategory);

router.route('/:id')
    .put(authMiddleware.restrictTo('system_admin'), categoryController.updateCategory)
    .delete(authMiddleware.restrictTo('system_admin'), categoryController.deleteCategory);

module.exports = router;
