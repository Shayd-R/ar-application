const fs = require('fs');

// Tipos de errores personalizados
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Función para manejar errores operacionales
const handleOperationalError = (err, req, res) => {
  // Guardar la URL anterior
  const previousUrl = req.header('Referer') || '/';

  console.log('Error operacional:', {
    message: err.message,
    status: err.status,
    statusCode: err.statusCode
  });

  if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
    // Si es una petición AJAX o espera JSON
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }

  // Para peticiones normales, renderizar la vista de error
  return res.status(err.statusCode).render('error', {
    statusCode: err.statusCode,
    message: err.message,
    error: process.env.NODE_ENV === 'development' ? err : null,
    previousUrl,
    user: req.user
  });
};

// Función para manejar errores de desarrollo
const handleDevelopmentError = (err, req, res) => {
  // Guardar la URL anterior
  const previousUrl = req.header('Referer') || '/';

  console.error('Error de desarrollo:', {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode || 500
  });

  // Limpiar archivos subidos si hay error
  if (req.files) {
    Object.values(req.files).forEach(fileArray => {
      fileArray.forEach(file => {
        if (file.path) {
          fs.unlink(file.path, (unlinkErr) => {
            if (unlinkErr) console.error('Error eliminando archivo:', unlinkErr);
          });
        }
      });
    });
  }

  if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
    return res.status(err.statusCode || 500).json({
      status: 'error',
      error: err,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }

  // Para peticiones normales, renderizar la vista de error
  return res.status(err.statusCode || 500).render('error', {
    statusCode: err.statusCode || 500,
    message: err.message || 'Ha ocurrido un error inesperado',
    error: process.env.NODE_ENV === 'development' ? err : null,
    previousUrl,
    user: req.user
  });
};

// Middleware de manejo de errores global
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Registrar todos los errores
  console.error('Error global:', {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode
  });

  if (err.isOperational) {
    handleOperationalError(err, req, res);
  } else {
    handleDevelopmentError(err, req, res);
  }
};

// Función para capturar errores en funciones async
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  globalErrorHandler,
  catchAsync
}; 