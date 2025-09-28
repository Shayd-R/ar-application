/**
 * Configuración de la aplicación
 * Este archivo contiene la configuración para diferentes entornos
 */

const path = require('path');

// Obtener el entorno actual
const env = process.env.NODE_ENV || 'development';

// Configuración base
const baseConfig = {
  // Configuración general
  port: process.env.PORT || 3000,
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  
  // Configuración de base de datos
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'arfinal',
    connectionLimit: 10
  },
  
  // Configuración del compilador MindAR
  compiler: {
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    uploadsDir: process.env.UPLOADS_DIR || path.join(__dirname, '../uploads'),
    targetsDir: process.env.TARGETS_DIR || path.join(__dirname, '../uploads/targets'),
    publicPath: process.env.PUBLIC_PATH || '/uploads'
  }
};

// Configuraciones específicas por entorno
const envConfigs = {
  development: {
    // Configuración específica para desarrollo
  },
  
  test: {
    // Configuración específica para pruebas
  },
  
  production: {
    // Configuración específica para producción
    compiler: {
      // En producción podríamos tener diferentes rutas o configuraciones
      baseUrl: process.env.BASE_URL || 'https://tu-dominio.com',
      publicPath: process.env.PUBLIC_PATH || '/static'
    }
  }
};

// Combinar configuración base con la específica del entorno
const config = {
  ...baseConfig,
  ...(envConfigs[env] || {})
};

// Permitir que la configuración de entorno sobrescriba la configuración del compilador
if (envConfigs[env]?.compiler) {
  config.compiler = {
    ...baseConfig.compiler,
    ...envConfigs[env].compiler
  };
}

module.exports = config; 