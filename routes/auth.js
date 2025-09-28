const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const db = require('../config/database');
const { forwardAuthenticated } = require('../middleware/auth');

// Ruta para página de login
router.get('/login', forwardAuthenticated, (req, res) => {
  res.render('auth/login', {
    title: 'Iniciar Sesión'
  });
});

// Ruta para página de registro
router.get('/register', forwardAuthenticated, (req, res) => {
  res.render('auth/register', {
    title: 'Registro'
  });
});

// Manejar solicitud de login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      // Si el usuario necesita restablecer su contraseña, redirigimos a la página de recuperación
      if (info && info.requiresReset) {
        req.flash('warning_msg', info.message);
        return res.redirect('/auth/reset-password');
      }
      
      req.flash('error_msg', info.message);
      return res.redirect('/auth/login');
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      
      // Guardar datos adicionales en la sesión
      req.session.userRole = user.id_role_user;
      req.session.userName = user.name_user;
      
      // Redirigir a los administradores al dashboard, otros a la página de obras
      if (user.id_role_user === 1) {
        return res.redirect('/admin/dashboard');
      } else {
        return res.redirect('/works');
      }
    });
  })(req, res, next);
});

// Manejar solicitud de registro
router.post('/register', (req, res) => {
  req.flash('error_msg', 'El registro público ha sido deshabilitado. Contacta con un administrador para crear una cuenta.');
  res.redirect('/auth/register');
});

// Ruta para cerrar sesión
router.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) {
      return next(err);
    }
    req.flash('success_msg', 'Has cerrado sesión');
    res.redirect('/auth/login');
  });
});

// Ruta para la página de solicitud de recuperación de contraseña
router.get('/reset-password', forwardAuthenticated, (req, res) => {
  res.render('auth/reset-password', {
    title: 'Recuperar Contraseña'
  });
});

// Procesar solicitud de recuperación
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Verificar si el email existe
    const users = await db.query('SELECT * FROM users WHERE email_user = ?', [email]);
    
    if (users.length === 0) {
      req.flash('error_msg', 'El email proporcionado no está registrado en nuestro sistema');
      return res.redirect('/auth/reset-password');
    }
    
    // Generar token de recuperación
    const token = require('crypto').randomBytes(20).toString('hex');
    const tokenExp = new Date(Date.now() + 3600000); // Expiración: 1 hora
    
    // Guardar token en la base de datos
    await db.query(
      'UPDATE users SET token_user = ?, token_exp_user = ? WHERE email_user = ?',
      [token, tokenExp, email]
    );
    
    // En un entorno real, aquí enviarías un email con un enlace de recuperación
    // Por ahora, simplemente mostraremos un mensaje
    req.flash('success_msg', 'Se ha enviado un enlace de recuperación a tu email. Por favor, revisa tu bandeja de entrada.');
    res.redirect('/auth/login');
  } catch (error) {
    console.error('Error al procesar la solicitud de recuperación:', error);
    req.flash('error_msg', 'Ha ocurrido un error al procesar la solicitud');
    res.redirect('/auth/reset-password');
  }
});

module.exports = router; 