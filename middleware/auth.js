// Middleware para asegurar que el usuario está autenticado
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error_msg', 'Por favor inicia sesión para acceder a esta página');
  res.redirect('/auth/login');
}

// Middleware para restringir acceso a rutas si el usuario ya está autenticado
function forwardAuthenticated(req, res, next) {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect('/works');
}

// Middleware para verificar si el usuario es administrador
function ensureAdmin(req, res, next) {
  if (req.user && req.user.id_role_user === 1) {
    return next();
  }
  req.flash('error_msg', 'No tienes permisos para acceder a esta página');
  res.redirect('/');
}

// Middleware para verificar propiedad de una obra
async function ensureWorkOwnership(req, res, next) {
  try {
    const db = require('../config/database');
    const workId = req.params.id;
    const userId = req.user.id_user;
    
    // Si el usuario es administrador (rol 1), permitir acceso automáticamente
    if (req.user.id_role_user === 1) {
      return next();
    }
    
    const work = await db.query(
      'SELECT id_user_work FROM works WHERE id_work = ?',
      [workId]
    );
    
    if (work.length === 0) {
      req.flash('error_msg', 'Obra no encontrada');
      return res.redirect('/works');
    }
    
    if (work[0].id_user_work !== userId) {
      req.flash('error_msg', 'No tienes permiso para acceder a esta obra');
      return res.redirect('/works');
    }
    
    next();
  } catch (error) {
    console.error('Error al verificar propiedad de la obra:', error);
    req.flash('error_msg', 'Error al verificar permisos');
    res.redirect('/works');
  }
}

module.exports = {
  ensureAuthenticated,
  forwardAuthenticated,
  ensureAdmin,
  ensureWorkOwnership
}; 