const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración básica de almacenamiento
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = './uploads/images';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    cb(null, `work_${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Filtro simple para imágenes
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes'));
  }
};

// Configuración simple de Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

module.exports = upload; 