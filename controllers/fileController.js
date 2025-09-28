const db = require('../config/database');
const { AppError } = require('../utils/errorHandler');
const fs = require('fs').promises;
const path = require('path');

// Función auxiliar para eliminar archivo físico
const deletePhysicalFile = async (filePath) => {
  if (!filePath) {
    console.log('No se proporcionó ruta de archivo para eliminar');
    return;
  }
  
  try {
    // Normalizar la ruta: asegurar que comienza con / y luego quitarlo para unirlo correctamente
    const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const absolutePath = path.join(__dirname, '..', normalizedPath);
    
    console.log(`Intentando eliminar archivo: ${absolutePath}`);
    
    // Verificar si el archivo existe antes de intentar eliminarlo
    try {
      await fs.access(absolutePath);
      console.log(`Archivo encontrado: ${absolutePath}`);
    } catch (err) {
      console.error(`Archivo no encontrado: ${absolutePath}`);
      return;
    }
    
    // Eliminar el archivo
    await fs.unlink(absolutePath);
    console.log(`Archivo eliminado exitosamente: ${absolutePath}`);
  } catch (error) {
    console.error(`Error al eliminar archivo físico: ${filePath}`, error);
    // No lanzamos el error para permitir que el proceso continúe
  }
};

// Eliminar una imagen individual
exports.deleteImage = async (req, res) => {
  const conn = await db.pool.getConnection();
  
  try {
    await conn.beginTransaction();

    const { id_imagen: imageId, tipo: imageType } = req.body;
    console.log(`Solicitud de eliminación para imagen ID: ${imageId}, tipo: ${imageType}`);

    if (imageType === 'main') {
      // Actualizar la obra para eliminar la referencia a la imagen principal
      const [works] = await conn.query(
        'SELECT url_image_work FROM works WHERE id_work = ? AND id_user_work = ?',
        [imageId, req.user.id_user]
      );

      if (!works || works.length === 0) {
        throw new AppError('Imagen no encontrada o no tienes permiso para eliminarla', 403);
      }

      const work = works[0];
      console.log('Información de la obra:', work);

      // Eliminar el archivo físico
      if (work.url_image_work) {
        console.log(`Eliminando archivo físico de imagen principal: ${work.url_image_work}`);
        await deletePhysicalFile(work.url_image_work);
      }

      // Actualizar la obra
      const [result] = await conn.query(
        'UPDATE works SET url_image_work = NULL WHERE id_work = ?',
        [imageId]
      );
      console.log('Resultado de actualización en BD:', result);
    } else {
      // Eliminar imagen adicional
      const [images] = await conn.query(
        `SELECT ai.* FROM additional_images ai 
         JOIN works w ON ai.id_work = w.id_work 
         WHERE ai.id_additional_image = ? AND w.id_user_work = ?`,
        [imageId, req.user.id_user]
      );

      if (!images || images.length === 0) {
        throw new AppError('Imagen no encontrada o no tienes permiso para eliminarla', 403);
      }

      const image = images[0];
      console.log('Información de imagen adicional a eliminar:', image);

      // Eliminar el archivo físico si existe
      if (image.image_url) {
        console.log(`Eliminando archivo físico de imagen adicional: ${image.image_url}`);
        await deletePhysicalFile(image.image_url);
      }

      // Eliminar registro de la base de datos
      const [result] = await conn.query(
        'DELETE FROM additional_images WHERE id_additional_image = ?',
        [imageId]
      );
      console.log('Resultado de eliminación en BD:', result);
    }

    await conn.commit();
    console.log(`Imagen ${imageId} eliminada exitosamente`);
    res.json({ message: 'Imagen eliminada exitosamente' });

  } catch (error) {
    await conn.rollback();
    console.error('Error al eliminar imagen:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Error al eliminar la imagen', 500);
  } finally {
    conn.release();
  }
};

// Eliminar un video
exports.deleteVideo = async (req, res) => {
  const conn = await db.pool.getConnection();
  
  try {
    await conn.beginTransaction();
    
    const { id_video: videoId } = req.body;
    console.log(`Solicitud de eliminación para video ID: ${videoId}`);

    // Verificar propiedad del video y obtener su información
    const [videos] = await conn.query(
      `SELECT v.*, w.id_user_work FROM videos v 
       JOIN works w ON v.id_work = w.id_work 
       WHERE v.id_video = ? AND w.id_user_work = ?`,
      [videoId, req.user.id_user]
    );

    if (!videos || videos.length === 0) {
      throw new AppError('Video no encontrado o no tienes permiso para eliminarlo', 403);
    }

    const video = videos[0];
    console.log('Información del video a eliminar:', video);

    // Verificar el tipo de video
    const isFileType = video.video_type === 'file';
    console.log(`Tipo de video: ${video.video_type}, es tipo archivo: ${isFileType}`);

    // Si es un video subido como archivo, eliminar el archivo físico
    if (isFileType && video.video_url) {
      console.log(`Eliminando archivo físico: ${video.video_url}`);
      await deletePhysicalFile(video.video_url);
    } else {
      console.log(`Video tipo 'link', solo se eliminará de la base de datos: ${video.video_url}`);
    }
    
    // Eliminar el registro de la base de datos
    const [result] = await conn.query('DELETE FROM videos WHERE id_video = ?', [videoId]);
    console.log(`Resultado de eliminación en BD:`, result);
    
    if (result.affectedRows === 0) {
      throw new AppError('No se pudo eliminar el video de la base de datos', 500);
    }
    
    await conn.commit();
    console.log(`Video ${videoId} eliminado exitosamente`);
    res.json({ message: 'Video eliminado exitosamente' });
    
  } catch (error) {
    await conn.rollback();
    console.error('Error al eliminar video:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Error al eliminar el video', 500);
  } finally {
    conn.release();
  }
};

// Función para procesar la eliminación de videos al guardar el formulario
exports.processVideoDeletions = async (videosToDelete, userId, conn) => {
  console.log(`Procesando eliminación de ${videosToDelete.length} videos para usuario ${userId}`);
  console.log('Videos a eliminar:', JSON.stringify(videosToDelete));
  
  try {
    for (const videoData of videosToDelete) {
      console.log(`Procesando video: ${JSON.stringify(videoData)}`);
      
      // Verificar propiedad del video y obtener su información completa
      const [videos] = await conn.query(
        `SELECT v.*, w.id_user_work FROM videos v 
         JOIN works w ON v.id_work = w.id_work 
         WHERE v.id_video = ? AND w.id_user_work = ?`,
        [videoData.id, userId]
      );

      if (!videos || videos.length === 0) {
        console.warn(`Video ${videoData.id} no encontrado o sin permisos para usuario ${userId}`);
        continue;
      }

      const videoInfo = videos[0];
      console.log('Información completa del video a eliminar:', videoInfo);

      try {
        // Si es un video tipo 'file', eliminar el archivo físico usando la ruta de la base de datos
        if (videoInfo.video_type === 'file' && videoInfo.video_url) {
          console.log(`Eliminando archivo físico: ${videoInfo.video_url}`);
          await deletePhysicalFile(videoInfo.video_url);
        } else {
          console.log(`Video tipo: ${videoInfo.video_type || 'desconocido'}, solo se eliminará de la base de datos.`);
        }

        // Eliminar el registro de la base de datos (para ambos tipos de video: 'file' y 'link')
        const [result] = await conn.query('DELETE FROM videos WHERE id_video = ?', [videoInfo.id_video]);
        console.log(`Resultado de eliminación en BD para video ${videoInfo.id_video}:`, result);
        
        if (result.affectedRows === 0) {
          console.error(`No se pudo eliminar el video ${videoInfo.id_video} de la base de datos`);
        } else {
          console.log(`Video ${videoInfo.id_video} eliminado exitosamente de la base de datos`);
        }
      } catch (error) {
        console.error(`Error al eliminar video ${videoInfo.id_video}:`, error);
        // Continuamos con el siguiente video en lugar de fallar todo el proceso
      }
    }
    console.log('Proceso de eliminación de videos completado con éxito');
  } catch (error) {
    console.error('Error al procesar eliminación de videos:', error);
    throw error;
  }
};

// Función para procesar la eliminación de imágenes al guardar el formulario
exports.processImageDeletions = async (imagesToDelete, userId, conn) => {
  console.log(`Procesando eliminación de ${imagesToDelete.length} imágenes para usuario ${userId}`);
  console.log('Imágenes a eliminar:', JSON.stringify(imagesToDelete));
  
  try {
    for (const imageData of imagesToDelete) {
      console.log(`Procesando imagen: ${JSON.stringify(imageData)}`);
      
      try {
        if (imageData.type === 'main') {
          // Verificar propiedad de la obra y obtener información
          const [works] = await conn.query(
            'SELECT w.* FROM works w WHERE w.id_work = ? AND w.id_user_work = ?',
            [imageData.id, userId]
          );

          if (!works || works.length === 0) {
            console.warn(`Obra ${imageData.id} no encontrada o sin permisos para usuario ${userId}`);
            continue;
          }

          const work = works[0];
          console.log('Información de la obra:', work);

          // Eliminar el archivo físico
          if (work.url_image_work) {
            console.log(`Eliminando archivo físico de imagen principal: ${work.url_image_work}`);
            await deletePhysicalFile(work.url_image_work);
          }

          // Actualizar la obra (poner a NULL el url_image_work)
          // Nota: No hacemos esto aquí porque debe ser manejado por el controlador
          // que verifica que se esté subiendo un nuevo contenido principal
        } else {
          // Verificar propiedad de la imagen adicional y obtener información
          const [images] = await conn.query(
            `SELECT ai.* FROM additional_images ai 
             JOIN works w ON ai.id_work = w.id_work 
             WHERE ai.id_additional_image = ? AND w.id_user_work = ?`,
            [imageData.id, userId]
          );

          if (!images || images.length === 0) {
            console.warn(`Imagen adicional ${imageData.id} no encontrada o sin permisos para usuario ${userId}`);
            continue;
          }

          const image = images[0];
          console.log('Información de imagen adicional a eliminar:', image);

          // Eliminar el archivo físico
          if (image.image_url) {
            console.log(`Eliminando archivo físico de imagen adicional: ${image.image_url}`);
            await deletePhysicalFile(image.image_url);
          }

          // Eliminar registro de la base de datos
          const [result] = await conn.query(
            'DELETE FROM additional_images WHERE id_additional_image = ?',
            [imageData.id]
          );
          console.log('Resultado de eliminación en BD:', result);
        }
      } catch (error) {
        console.error(`Error al procesar eliminación de imagen ${JSON.stringify(imageData)}:`, error);
        // Continuamos con la siguiente imagen en lugar de fallar todo el proceso
      }
    }
    console.log('Proceso de eliminación de imágenes completado con éxito');
  } catch (error) {
    console.error('Error al procesar eliminación de imágenes:', error);
    throw error;
  }
};

// Función para procesar la eliminación del archivo target
exports.processTargetDeletion = async (targetData, userId, conn) => {
  console.log(`Procesando eliminación del archivo target para usuario ${userId}`);
  console.log('Target a eliminar:', JSON.stringify(targetData));
  
  try {
    // Verificar propiedad de la obra y obtener información
    const [works] = await conn.query(
      'SELECT w.* FROM works w WHERE w.id_work = ? AND w.id_user_work = ?',
      [targetData.id, userId]
    );

    if (!works || works.length === 0) {
      console.warn(`Obra ${targetData.id} no encontrada o sin permisos para usuario ${userId}`);
      return false;
    }

    const work = works[0];
    console.log('Información de la obra:', work);

    // Eliminar el archivo físico
    if (work.url_target_work) {
      console.log(`Eliminando archivo físico del target: ${work.url_target_work}`);
      await deletePhysicalFile(work.url_target_work);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error al procesar eliminación del target:', error);
    return false;
  }
}; 