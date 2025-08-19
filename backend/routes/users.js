const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware.protect, authMiddleware.restrictTo('system_admin'), userController.createUser);
router.get('/', authMiddleware.protect, authMiddleware.restrictTo('system_admin'), userController.getUsers);

module.exports = router;
