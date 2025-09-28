const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
const { catchAsync } = require('../utils/errorHandler');

// Ruta principal de la galería
router.get('/', catchAsync(galleryController.getGallery));

module.exports = router; 