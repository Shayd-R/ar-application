const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de almacenamiento
exports.storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'uploads/';
    
    // Determinar la subcarpeta según el tipo de archivo
    if (file.fieldname === 'mainContent') {
      if (file.mimetype.startsWith('video/')) {
        uploadPath += 'videos/';
      } else {
        uploadPath += 'images/';
      }
    } else if (file.fieldname === 'additionalImages') {
      uploadPath += 'additional_images/';
    } else if (file.fieldname === 'targetFile') {
      uploadPath += 'targets/';
    } else if (file.fieldname === 'videoFiles') {
      uploadPath += 'videos/';
    }
    
    // Crear el directorio si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    console.log(`Guardando archivo ${file.fieldname} en: ${uploadPath}`);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
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
  }
});

// Filtro de archivos
exports.fileFilter = (req, file, cb) => {
  if (file.fieldname === 'mainContent') {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('El archivo debe ser una imagen o video válido'));
    }
  } else if (file.fieldname === 'additionalImages') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('El archivo debe ser una imagen válida'));
    }
  } else if (file.fieldname === 'targetFile') {
    if (path.extname(file.originalname).toLowerCase() === '.mind') {
      cb(null, true);
    } else {
      cb(new Error('El archivo target debe tener extensión .mind'));
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
}; 