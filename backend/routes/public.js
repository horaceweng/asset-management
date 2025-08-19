const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.get('/assets/:unique_code', publicController.getPublicAssetByCode);

module.exports = router;
