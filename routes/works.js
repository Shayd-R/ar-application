const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { ensureAuthenticated, ensureWorkOwnership } = require('../middleware/auth');
const db = require('../config/database');
const config = require('../config/config');
const multer = require('multer');
const { AppError, catchAsync } = require('../utils/errorHandler');

// Controladores
const workController = require('../controllers/workController');
const fileController = require('../controllers/fileController');
const arController = require('../controllers/arController');

// Configuración de almacenamiento para diferentes tipos de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = path.join(__dirname, '..', 'uploads');
    let subPath = '';
    
    // Determinar la subcarpeta según el tipo de archivo
    if (file.fieldname === 'mainContent') {
      subPath = file.mimetype.startsWith('video/') ? 'videos' : 'images';
    } else if (file.fieldname === 'additionalImages') {
      subPath = 'additional_images';
    } else if (file.fieldname === 'targetFile') {
      subPath = 'targets';
    } else if (file.fieldname === 'videoFiles') {
      subPath = 'videos';
    }
    
    uploadPath = path.join(uploadPath, subPath);
    
    // Crear el directorio si no existe
    try {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log(`Directorio creado/verificado: ${uploadPath}`);
      cb(null, uploadPath);
    } catch (error) {
      console.error(`Error al crear directorio ${uploadPath}:`, error);
      cb(new Error(`Error al crear directorio de subida: ${error.message}`));
    }
  },
  filename: function (req, file, cb) {
    try {
      const timestamp = Date.now();
      let prefix = '';
      
      switch(file.fieldname) {
        case 'mainContent':
          prefix = file.mimetype.startsWith('video/') ? 'video_' : 'image_';
          break;
        case 'additionalImages':
          prefix = 'additional_';
          break;
        case 'targetFile':
          prefix = 'target_';
          break;
        case 'videoFiles':
          prefix = 'video_';
          break;
        default:
          prefix = 'file_';
      }
      
      const extension = file.fieldname === 'targetFile' ? '.mind' : path.extname(file.originalname);
      const filename = `${prefix}${timestamp}${extension}`;
      console.log(`Nombre de archivo generado: ${filename}`);
      cb(null, filename);
    } catch (error) {
      console.error('Error al generar nombre de archivo:', error);
      cb(new Error(`Error al generar nombre de archivo: ${error.message}`));
    }
  }
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  try {
    if (file.fieldname === 'mainContent') {
      if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        console.log(`Archivo principal aceptado: ${file.originalname} (${file.mimetype})`);
        cb(null, true);
      } else {
        cb(new Error('El archivo debe ser una imagen o video válido'));
      }
    } else if (file.fieldname === 'targetFile') {
      if (path.extname(file.originalname).toLowerCase() === '.mind') {
        console.log(`Archivo target aceptado: ${file.originalname}`);
        cb(null, true);
      } else {
        cb(new Error('El archivo target debe tener extensión .mind'));
      }
    } else if (file.fieldname === 'additionalImages') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('El archivo debe ser una imagen válida'));
      }
    } else if (file.fieldname === 'videoFiles') {
      if (file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('El archivo debe ser un video válido'));
      }
    } else {
      cb(null, false);
    }
  } catch (error) {
    console.error('Error en fileFilter:', error);
    cb(new Error(`Error al validar archivo: ${error.message}`));
  }
};

// Configuración de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB límite
    files: 10 // máximo número de archivos
  }
}).fields([
  { name: 'mainContent', maxCount: 1 },
  { name: 'targetFile', maxCount: 1 },
  { name: 'additionalImages', maxCount: 6 },
  { name: 'videoFiles', maxCount: 6 }
]);

// Middleware para manejar errores de multer
const handleMulterError = (err, req, res, next) => {
  console.error('Error en multer:', err);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: 'El archivo es demasiado grande. Máximo 100MB.'
      });
    }
    return res.status(400).json({
      status: 'error',
      message: `Error al subir archivo: ${err.message}`
    });
  }
  next(err);
};

// Rutas principales
router.get('/', ensureAuthenticated, catchAsync(workController.getAllWorks));
router.get('/new', ensureAuthenticated, catchAsync(workController.showNewWorkForm));

// Rutas de eliminación de archivos (deben ir antes de las rutas con parámetros)
router.post('/image/delete', ensureAuthenticated, catchAsync(fileController.deleteImage));
router.post('/video/delete', ensureAuthenticated, catchAsync(fileController.deleteVideo));

// Rutas de creación con manejo de errores mejorado
router.post('/', ensureAuthenticated, (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      console.error('Error en upload:', err);
      return next(new AppError(err.message, 400));
    }
    next();
  });
}, catchAsync(workController.createWork));

// Rutas de edición
router.get('/:id/edit', ensureAuthenticated, ensureWorkOwnership, catchAsync(workController.showEditForm));
router.post('/:id', ensureAuthenticated, ensureWorkOwnership, (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      console.error('Error en upload:', err);
      return next(new AppError(err.message, 400));
    }
    next();
  });
}, catchAsync(workController.updateWork));

// Rutas de eliminación de obra
router.post('/:id/delete', ensureAuthenticated, ensureWorkOwnership, catchAsync(workController.deleteWork));

// Rutas AR
router.get('/:id/ar', ensureAuthenticated, ensureWorkOwnership, catchAsync(arController.showARExperience));

// Ruta de detalles (debe ir después de las rutas específicas)
router.get('/:id', ensureAuthenticated, ensureWorkOwnership, catchAsync(workController.getWorkDetails));

module.exports = router;