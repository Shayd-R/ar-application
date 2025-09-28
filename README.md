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
   git clone https://github.com/Shayd-R/ar-application.git
   cd ar-application
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
   PORT=3000
   SESSION_SECRET=ar-arte-secreto-seguro
   
   # Para desarrollo local:
   DB_HOST=localhost
   
   # Para Docker:
   # DB_HOST=shared_mysql_db
   
   DB_USER=root
   DB_PASS=
   DB_NAME=ar
   JWT_SECRET=jwt-secreto-ar-arte-12345
   ```

   ⚠️ **Nota**: 
   - Para desarrollo local, usa `DB_HOST=localhost`
   - Para Docker, usa `DB_HOST=shared_mysql_db`

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

2. Copia el archivo de variables de entorno:
   ```bash
   cp .env.example .env
   ```

3. Configura las variables en el archivo `.env` (especialmente las relacionadas con la base de datos)

4. Construye y levanta los contenedores:
   ```bash
   docker-compose up -d --build
   ```

5. Importa la base de datos (desde otro terminal):
   ```bash
   docker exec -i ar-app mysql -u root ar < database/ar.sql
   ```

La aplicación estará disponible en `http://localhost:3000`

⚠️ **Nota**: Si es la primera vez que ejecutas el proyecto, asegúrate de que los directorios de uploads se creen correctamente dentro del contenedor.

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
ar-application/
├── config/           # Configuraciones y variables de entorno
├── controllers/      # Controladores de la aplicación
├── database/         # Scripts SQL y configuración de BD
├── middleware/       # Middleware de autenticación y uploads
├── public/          # Archivos estáticos (JS, CSS, imágenes)
│   ├── css/         # Estilos
│   └── js/          # Scripts del cliente
├── routes/          # Rutas de la aplicación
├── uploads/         # Archivos subidos por los usuarios
│   ├── images/      # Imágenes principales
│   ├── videos/      # Videos
│   ├── targets/     # Archivos target de AR
│   └── additional_images/  # Imágenes adicionales
├── utils/           # Utilidades y helpers
└── views/           # Vistas EJS
    ├── admin/       # Vistas del panel de administración
    ├── auth/        # Vistas de autenticación
    ├── works/       # Vistas de obras
    └── partials/    # Componentes reutilizables
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