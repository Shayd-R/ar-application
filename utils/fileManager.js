const fs = require('fs').promises;
const path = require('path');

// Eliminar un archivo individual
exports.deleteFile = async (filePath) => {
  if (!filePath) return;

  try {
    // Normalizar la ruta del archivo
    let normalizedPath = filePath;
    
    // Asegurarse de que la ruta comienza con /uploads/
    if (!normalizedPath.includes('/uploads/') && !normalizedPath.includes('\\uploads\\')) {
      console.log(`Ruta no válida para eliminar: ${normalizedPath}`);
      return;
    }
    
    // Limpiar la ruta para obtener la parte después de 'uploads'
    let relativePath = '';
    
    if (normalizedPath.includes('/uploads/')) {
      relativePath = 'uploads/' + normalizedPath.split('/uploads/')[1];
    } else if (normalizedPath.includes('\\uploads\\')) {
      relativePath = 'uploads\\' + normalizedPath.split('\\uploads\\')[1];
    }
    
    // Construir la ruta absoluta
    const absolutePath = path.resolve(__dirname, '..', relativePath);
    
    console.log(`Intentando eliminar archivo: ${absolutePath}`);
    
    // Comprobar si el archivo existe antes de intentar eliminarlo
    try {
      const fileStats = await fs.stat(absolutePath);
      if (fileStats.isFile()) {
        await fs.unlink(absolutePath);
        console.log(`Archivo eliminado exitosamente: ${absolutePath}`);
      } else {
        console.log(`La ruta no es un archivo: ${absolutePath}`);
      }
    } catch (statError) {
      if (statError.code === 'ENOENT') {
        console.log(`El archivo no existe: ${absolutePath}`);
      } else {
        console.error(`Error al verificar el archivo ${absolutePath}:`, statError.message);
      }
    }
  } catch (error) {
    console.error(`Error al procesar la eliminación del archivo: ${filePath}`, error.message);
  }
};

// Eliminar múltiples archivos
exports.deleteFiles = async (filePaths) => {
  if (!Array.isArray(filePaths)) return;
  
  console.log(`Intentando eliminar ${filePaths.length} archivos:`, filePaths);

  await Promise.all(
    filePaths.map(filePath => exports.deleteFile(filePath))
  );
};

// Eliminar todos los archivos relacionados con una obra
exports.deleteWorkFiles = async ({ work, additionalImages, videos }) => {
  const filesToDelete = [];

  console.log('Información de la obra:', work);
  console.log('Imágenes adicionales recibidas:', additionalImages);
  console.log('Videos recibidos:', videos);

  // Agregar imagen/video principal
  if (work && work.url_image_work) {
    console.log('Agregando imagen/video principal:', work.url_image_work);
    filesToDelete.push(work.url_image_work);
  }

  // Agregar archivo target
  if (work && work.url_target_work) {
    console.log('Agregando archivo target:', work.url_target_work);
    filesToDelete.push(work.url_target_work);
  }

  // Agregar imágenes adicionales
  if (additionalImages && Array.isArray(additionalImages)) {
    console.log(`Procesando ${additionalImages.length} imágenes adicionales`);
    
    additionalImages.forEach((img, index) => {
      if (img && typeof img === 'object') {
        if (img.image_url) {
          console.log(`[${index}] Agregando imagen adicional:`, img.image_url);
          filesToDelete.push(img.image_url);
        } else {
          console.log(`[${index}] Imagen adicional sin URL:`, img);
        }
      } else {
        console.log(`[${index}] Formato inválido de imagen adicional:`, img);
      }
    });
  } else {
    console.log('No hay imágenes adicionales para procesar.');
  }

  // Agregar videos (solo los que son archivos)
  if (videos && Array.isArray(videos)) {
    console.log(`Procesando ${videos.length} videos`);
    
    videos.forEach((video, index) => {
      if (video && typeof video === 'object') {
        if (video.video_url) {
          if (video.video_type === 'file' || !video.video_type) {
            console.log(`[${index}] Agregando video:`, video.video_url);
            filesToDelete.push(video.video_url);
          } else {
            console.log(`[${index}] Video no es archivo local (tipo: ${video.video_type}):`, video.video_url);
          }
        } else {
          console.log(`[${index}] Video sin URL:`, video);
        }
      } else {
        console.log(`[${index}] Formato inválido de video:`, video);
      }
    });
  } else {
    console.log('No hay videos para procesar.');
  }

  console.log(`Total de archivos a eliminar: ${filesToDelete.length}`);
  console.log('Archivos a eliminar:', filesToDelete);
  
  if (filesToDelete.length > 0) {
    // Eliminar todos los archivos
    await exports.deleteFiles(filesToDelete);
    console.log('Proceso de eliminación de archivos completado.');
  } else {
    console.log('No hay archivos para eliminar.');
  }
}; 