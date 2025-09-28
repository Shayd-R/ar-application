# CreationAR - Sistema de Gestión de Arte con Realidad Aumentada

Este proyecto es una aplicación web que permite gestionar obras artísticas utilizando realidad aumentada (AR) para su visualización. Permite subir imágenes, videos y crear experiencias interactivas de AR utilizando la tecnología MindAR.

## 🚀 Características

- Gestión de obras artísticas con soporte para imágenes y videos
- Experiencias de realidad aumentada usando MindAR
- Sistema de autenticación y autorización
- Panel de administración
- Galería de obras
- Compilador de imágenes para generar targets de AR
- Carga y gestión de archivos multimedia

## 📋 Requisitos Previos

- Node.js (v14 o superior)
- MySQL/MariaDB
- Docker y Docker Compose (para instalación con Docker)
- Navegador web moderno con soporte para WebGL y WebRTC
- Para pruebas locales de AR: dispositivo móvil con cámara

## 🔧 Instalación Local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/Shayd-R/creationAR.git
   cd creationAR
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   - Copia el archivo `.env.example` a `.env`
   ```bash
   cp .env.example .env
   ```
   - Edita el archivo `.env` con tus configuraciones:
   ```env
   NODE_ENV=development
   PORT=3000
   BASE_URL=http://localhost:3000
   
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=ar
   
   SESSION_SECRET=tu-secreto-seguro
   JWT_SECRET=tu-jwt-secreto
   ```

4. Importa la base de datos:
   ```bash
   mysql -u root -p < database/ar.sql
   ```

5. Inicia la aplicación:
   ```bash
   npm run dev
   ```

6. Accede al sistema con las siguientes credenciales por defecto:
   ```
   Email: admin@gmail.com
   Contraseña: admin123
   ```
   
   ⚠️ **Importante**: Por seguridad, cambia la contraseña del administrador después de tu primer inicio de sesión.

## 🐳 Instalación con Docker

1. Asegúrate de tener Docker y Docker Compose instalados

2. Construye y levanta los contenedores:
   ```bash
   docker-compose up -d --build
   ```

La aplicación estará disponible en `http://localhost:3000`

## 📱 Pruebas de AR en Desarrollo Local

Para probar las funcionalidades de AR en un entorno de desarrollo local:

1. Instala una aplicación de cámara IP en tu dispositivo móvil (por ejemplo, IP Webcam para Android)

2. Conecta tu dispositivo móvil y tu PC a la misma red WiFi

3. En la aplicación de cámara IP:
   - Inicia el servidor de video
   - Anota la URL del stream (ejemplo: http://192.168.1.100:8080/video)

4. En tu navegador:
   - Abre la herramienta de desarrollo (F12)
   - Ve a la configuración de los dispositivos multimedia
   - Agrega la URL del stream como fuente de video virtual

5. Al usar la función de AR, selecciona la cámara virtual como fuente de video

⚠️ **Importante**: Para el correcto funcionamiento de AR:
- Usa un dispositivo móvil con buena cámara
- Asegura una buena iluminación
- Mantén la imagen objetivo estable
- Usa una conexión WiFi estable

## 📁 Estructura del Proyecto

```
creationAR/
├── config/           # Configuraciones
├── controllers/      # Controladores
├── database/         # Scripts SQL
├── middleware/       # Middleware
├── public/          # Archivos estáticos
├── routes/          # Rutas
├── uploads/         # Archivos subidos
├── utils/           # Utilidades
└── views/           # Vistas EJS
```

## 🛠️ Tecnologías Utilizadas

- Backend: Node.js, Express
- Base de datos: MySQL
- Vistas: EJS
- AR: MindAR
- Autenticación: Passport.js
- Gestión de archivos: Multer
- Contenedores: Docker

## 🔐 Seguridad

- Todas las contraseñas se hashean antes de almacenarse
- Sesiones seguras con express-session
- Validación de archivos subidos
- Protección de rutas mediante middleware de autenticación

## 👥 Contribuir

1. Haz un Fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - mira el archivo [LICENSE](LICENSE) para detalles 