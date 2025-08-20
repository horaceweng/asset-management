const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Set up storage engine
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 }, // 1MB limit
    fileFilter: function(req, file, cb){
        checkFileType(file, cb);
    }
}).single('photo'); // 'photo' is the field name in the form

function checkFileType(file, cb){
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if(mimetype && extname){
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

// All routes are protected
router.use(authMiddleware.protect);

router.route('/')
    .get(assetController.getAllAssets)
    .post(authMiddleware.restrictTo('system_admin'), (req, res) => {
        upload(req, res, (err) => {
            if (err) {
                return res.status(400).json({ message: 'File upload error', error: err });
            }
            assetController.createAsset(req, res);
        });
    });

router.get('/:id/qrcode', assetController.generateQrCode);

router.route('/:id')
    .get(assetController.getAssetById)
    .put(authMiddleware.restrictTo('system_admin'), (req, res) => {
        upload(req, res, (err) => {
            if (err) {
                return res.status(400).json({ message: 'File upload error', error: err });
            }
            assetController.updateAsset(req, res);
        });
    })
    .delete(authMiddleware.restrictTo('system_admin'), assetController.deleteAsset);

router.post('/:id/checkout', assetController.checkoutAsset);
router.post('/:id/checkin', assetController.checkinAsset);

module.exports = router;
