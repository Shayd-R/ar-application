const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const { catchAsync } = require('../utils/errorHandler');

// Asegurar que todas las rutas de administración requieran autenticación y rol de admin
router.use(ensureAuthenticated, ensureAdmin);

// Dashboard
router.get('/dashboard', catchAsync(adminController.getDashboard));

// Gestión de usuarios
router.get('/users', catchAsync(adminController.getUsers));
router.post('/users/create', catchAsync(adminController.createUser));
router.get('/users/:id/edit', catchAsync(adminController.getUserEdit));
router.post('/users/:id/update', catchAsync(adminController.updateUser));
router.get('/users/:id/delete', catchAsync(adminController.checkUserWorks));
router.post('/users/:id/delete', catchAsync(adminController.deleteUser));

// Gestión de obras
router.get('/works', catchAsync(adminController.getAllWorks));
router.post('/works/:id/status', catchAsync(adminController.updateWorkStatus));

module.exports = router; 