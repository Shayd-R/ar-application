require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const path = require('path');
const fs = require('fs');
const { globalErrorHandler, AppError } = require('./utils/errorHandler');

// Inicialización de Express
const app = express();
const PORT = process.env.PORT || 3000;

// Asegurar que existen las carpetas para almacenamiento
const uploadDirs = [
  './uploads',
  './uploads/images',
  './uploads/additional_images',
  './uploads/videos',
  './uploads/targets'
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configuración de middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuración de EJS como motor de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configuración de sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-key-ar-arte',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Configuración de Passport para autenticación
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

// Configuración de mensajes flash
app.use(flash());

// Variables globales
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

// Rutas públicas de AR (deben ir antes de las rutas protegidas)
const arController = require('./controllers/arController');
const { catchAsync } = require('./utils/errorHandler');
app.get('/v/:token/ar', catchAsync(arController.showARExperience));
app.get('/v/:token', catchAsync(require('./controllers/workController').getWorkByToken));

// Rutas principales
const authRoutes = require('./routes/auth');
const workRoutes = require('./routes/works');
const adminRoutes = require('./routes/admin');
const galleryRoutes = require('./routes/gallery');

app.use('/auth', authRoutes);
app.use('/works', workRoutes);
app.use('/admin', adminRoutes);
app.use('/gallery', galleryRoutes);

// Ruta principal
app.get('/', (req, res) => {
  // Redirigir a la galería que ahora funcionará como landing page
  res.redirect('/gallery');
});

// Manejador de errores 404
app.use((req, res, next) => {
  next(new AppError('Página no encontrada', 404));
});

// Manejador de errores global
app.use(globalErrorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto http://localhost:${PORT}`);
}); 