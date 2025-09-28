const db = require('../config/database');
const { AppError } = require('../utils/errorHandler');
const { deleteWorkFiles } = require('../utils/fileManager');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Función para generar un token seguro
const generateShareToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = path.join(__dirname, '..', 'uploads');
    let subPath = '';
    
    // Determinar la subcarpeta según el tipo de archivo
    if (file.fieldname === 'mainContent') {
      subPath = file.mimetype.startsWith('video/') ? 'videos' : 'images';
    } else if (file.fieldname === 'additionalImages') {
      subPath = 'additional_images';
    } else if (file.fieldname === 'targetFile') {
      subPath = 'targets';
    } else if (file.fieldname === 'videoFiles') {
      subPath = 'videos';
    }
    
    uploadPath = path.join(uploadPath, subPath);
    
    // Crear el directorio si no existe
    try {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log(`Directorio creado/verificado: ${uploadPath}`);
      cb(null, uploadPath);
    } catch (error) {
      console.error(`Error al crear directorio ${uploadPath}:`, error);
      cb(new Error(`Error al crear directorio de subida: ${error.message}`));
    }
  },
  filename: function (req, file, cb) {
    try {
      const timestamp = Date.now();
      let prefix = '';
      
      switch(file.fieldname) {
        case 'mainContent':
          prefix = file.mimetype.startsWith('video/') ? 'video_' : 'image_';
          break;
        case 'additionalImages':
          prefix = 'additional_';
          break;
        case 'targetFile':
          prefix = 'target_';
          break;
        case 'videoFiles':
          prefix = 'video_';
          break;
        default:
          prefix = 'file_';
      }
      
      const extension = file.fieldname === 'targetFile' ? '.mind' : path.extname(file.originalname);
      const filename = `${prefix}${timestamp}${extension}`;
      console.log(`Nombre de archivo generado: ${filename}`);
      cb(null, filename);
    } catch (error) {
      console.error('Error al generar nombre de archivo:', error);
      cb(new Error(`Error al generar nombre de archivo: ${error.message}`));
    }
  }
});

// Obtener todas las obras del usuario
exports.getAllWorks = async (req, res) => {
  try {
    const works = await db.query(
      'SELECT * FROM works WHERE id_user_work = ? ORDER BY created_at_work DESC', 
      [req.user.id_user]
    );
    
    res.render('works/index', {
      title: 'Mis Obras',
      works,
      user: req.user
    });
  } catch (error) {
    throw new AppError('Error al cargar las obras', 500);
  }
};

// Mostrar formulario de nueva obra
exports.showNewWorkForm = async (req, res) => {
  try {
    const [categories, tags] = await Promise.all([
      db.query('SELECT * FROM categories ORDER BY name_category'),
      db.query('SELECT * FROM tags ORDER BY name_tag LIMIT 30')
    ]);
    
    res.render('works/new', {
      title: 'Nueva Obra',
      categories,
      tags,
      user: req.user
    });
  } catch (error) {
    throw new AppError('Error al cargar el formulario', 500);
  }
};

// Mostrar formulario de edición
exports.showEditForm = async (req, res) => {
  try {
    const workId = req.params.id;
    
    // Obtener todos los datos necesarios
    const [
      works,
      categories,
      tags,
      workTags,
      additionalImages,
      videos,
      links,
      socialMedia
    ] = await Promise.all([
      db.query('SELECT * FROM works WHERE id_work = ?', [workId]),
      db.query('SELECT * FROM categories ORDER BY name_category'),
      db.query('SELECT * FROM tags ORDER BY name_tag'),
      db.query('SELECT id_tag FROM work_tags WHERE id_work = ?', [workId]),
      db.query('SELECT * FROM additional_images WHERE id_work = ?', [workId]),
      db.query('SELECT * FROM videos WHERE id_work = ?', [workId]),
      db.query('SELECT * FROM links WHERE id_work = ?', [workId]),
      db.query('SELECT * FROM social_media WHERE id_work = ?', [workId])
    ]);

    if (!works || works.length === 0) {
      throw new AppError('Obra no encontrada', 404);
    }

    res.render('works/edit', {
      title: 'Editar Obra',
      work: works[0],
      categories,
      tags,
      workTags,
      additionalImages,
      videos,
      links,
      socialMedia,
      user: req.user
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error al cargar el formulario de edición', 500);
  }
};

// Actualizar una obra
exports.updateWork = async (req, res) => {
  const workId = req.params.id;
  const conn = await db.pool.getConnection();
  
  try {
    await conn.beginTransaction();

    // 1. Actualizar información básica de la obra
    await conn.query(
      `UPDATE works SET 
        title_work = ?,
        description_work = ?,
        id_category = ?,
        status_work = ?
      WHERE id_work = ?`,
      [
        req.body.title,
        req.body.description,
        req.body.id_category || null,
        req.body.status,
        workId
      ]
    );

    // 2. Actualizar etiquetas
    if (req.body.tags) {
      // Eliminar etiquetas existentes
      await conn.query('DELETE FROM work_tags WHERE id_work = ?', [workId]);
      
      // Insertar nuevas etiquetas
      const tags = Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags];
      for (const tagId of tags) {
        await conn.query(
          'INSERT INTO work_tags (id_work, id_tag) VALUES (?, ?)',
          [workId, tagId]
        );
      }
    }

    // 3. Procesar archivos multimedia y eliminaciones pendientes
    
    // 3.1 Procesar imágenes marcadas para eliminación
    if (req.body.images_to_delete) {
      const imagesToDelete = Array.isArray(req.body.images_to_delete) 
        ? req.body.images_to_delete.map(img => JSON.parse(img))
        : [JSON.parse(req.body.images_to_delete)];
      
      // Verificar si se está intentando eliminar la imagen principal
      const isMainImageBeingDeleted = imagesToDelete.some(img => img.type === 'main');
      
      // Si se está eliminando la imagen principal, debe haber un nuevo contenido principal
      if (isMainImageBeingDeleted && (!req.files || !req.files.mainContent)) {
        throw new AppError('No se puede eliminar el contenido principal sin subir uno nuevo. Es obligatorio tener contenido principal para compartir el QR.', 400);
      }

      // Importar la función de eliminación de imágenes
      const { processImageDeletions } = require('./fileController');
      await processImageDeletions(imagesToDelete, req.user.id_user, conn);
    }

    // 3.1.5 Procesar eliminación del archivo target
    if (req.body.target_to_delete) {
      const targetData = JSON.parse(req.body.target_to_delete);
      
      // Si se está eliminando el target, debe haber uno nuevo
      if (!req.files || !req.files.targetFile) {
        throw new AppError('No se puede eliminar el archivo target sin subir uno nuevo. Es obligatorio tener un archivo target.', 400);
      }

      // Importar la función de eliminación del target
      const { processTargetDeletion } = require('./fileController');
      await processTargetDeletion(targetData, req.user.id_user, conn);
    }

    // 3.2 Procesar nuevos archivos multimedia
    if (req.files) {
      // Procesar contenido principal si se está subiendo uno nuevo
      if (req.files.mainContent) {
        console.log('Procesando nuevo contenido principal...');
        const mainContent = req.files.mainContent[0];
        
        // Determinar el tipo de contenido
        const contentType = mainContent.mimetype.startsWith('video/') ? 'video' : 'image';
        console.log(`Nuevo contenido principal es de tipo: ${contentType}`);
        
        // Obtener la ruta actual para eliminar el archivo antiguo
        const [currentWork] = await conn.query(
          'SELECT url_image_work, content_type FROM works WHERE id_work = ?',
          [workId]
        );
        
        if (currentWork[0] && currentWork[0].url_image_work) {
          const fullPath = path.join(__dirname, '..', currentWork[0].url_image_work.replace(/^\//, ''));
          console.log(`Eliminando contenido principal antiguo: ${fullPath}`);
          
          fs.unlink(fullPath, err => {
            if (err) console.error('Error al eliminar contenido principal antiguo:', err);
          });
        }
        
        // Guardar la nueva ruta
        const mainContentPath = mainContent.path.split('\\').join('/').replace(/^.*?\/uploads\//, '/uploads/');
        console.log(`Actualizando contenido principal a: ${mainContentPath}`);
        
        await conn.query(
          'UPDATE works SET url_image_work = ?, content_type = ? WHERE id_work = ?',
          [mainContentPath, contentType, workId]
        );
      }

      // Procesar archivo target si se está subiendo uno nuevo
      if (req.files.targetFile) {
        console.log('Procesando nuevo archivo target...');
        const targetFile = req.files.targetFile[0];
        
        // Obtener la ruta actual para eliminar el archivo antiguo
        const [currentWork] = await conn.query(
          'SELECT url_target_work FROM works WHERE id_work = ?',
          [workId]
        );
        
        if (currentWork[0] && currentWork[0].url_target_work && !req.body.target_to_delete) {
          // Solo eliminar el archivo físico si no se ha procesado ya con target_to_delete
          const fullPath = path.join(__dirname, '..', currentWork[0].url_target_work.replace(/^\//, ''));
          console.log(`Eliminando archivo target antiguo: ${fullPath}`);
          
          fs.unlink(fullPath, err => {
            if (err) console.error('Error al eliminar archivo target antiguo:', err);
          });
        }
        
        // Guardar la nueva ruta
        const targetFilePath = targetFile.path.split('\\').join('/').replace(/^.*?\/uploads\//, '/uploads/');
        console.log(`Actualizando archivo target a: ${targetFilePath}`);
        
        await conn.query(
          'UPDATE works SET url_target_work = ? WHERE id_work = ?',
          [targetFilePath, workId]
        );
      }

      // Limpiar archivos antiguos si se están subiendo nuevos
      if (req.files.additionalImages) {
        const [oldImages] = await conn.query('SELECT image_url FROM additional_images WHERE id_work = ?', [workId]);
        for (const img of oldImages) {
          const fullPath = path.join(__dirname, '..', img.image_url);
          fs.unlink(fullPath, err => {
            if (err) console.error('Error al eliminar imagen antigua:', err);
          });
        }
        await conn.query('DELETE FROM additional_images WHERE id_work = ?', [workId]);
      }

      if (req.files.videoFiles) {
        const [oldVideos] = await conn.query('SELECT video_url FROM videos WHERE id_work = ? AND video_type = "file"', [workId]);
        for (const video of oldVideos) {
          const fullPath = path.join(__dirname, '..', video.video_url);
          fs.unlink(fullPath, err => {
            if (err) console.error('Error al eliminar video antiguo:', err);
          });
        }
        await conn.query('DELETE FROM videos WHERE id_work = ? AND video_type = "file"', [workId]);
      }

      // Procesar imágenes adicionales
      if (req.files.additionalImages) {
        for (const image of req.files.additionalImages) {
          const imagePath = image.path.split('\\').join('/').replace(/^.*?\/uploads\//, '/uploads/');
          await conn.query(
            'INSERT INTO additional_images (id_work, image_url) VALUES (?, ?)',
            [workId, imagePath]
          );
        }
      }

      // Procesar archivos de video
      if (req.files.videoFiles) {
        for (const video of req.files.videoFiles) {
          const videoPath = video.path.split('\\').join('/').replace(/^.*?\/uploads\//, '/uploads/');
          await conn.query(
            'INSERT INTO videos (id_work, video_url, video_type) VALUES (?, ?, ?)',
            [workId, videoPath, 'file']
          );
        }
      }
    }

    // 4. Procesar enlaces de video y eliminaciones pendientes
    
    // Obtener IDs de videos a eliminar
    const videoIdsToDelete = [];
    if (req.body.videos_to_delete) {
      console.log('Procesando videos marcados para eliminación...');
      const videosToDelete = Array.isArray(req.body.videos_to_delete) 
        ? req.body.videos_to_delete.map(v => JSON.parse(v))
        : [JSON.parse(req.body.videos_to_delete)];
      
      // Guardar los IDs de videos a eliminar para no reinsertarlos después
      videosToDelete.forEach(video => {
        videoIdsToDelete.push(video.id);
      });
      
      console.log(`Videos a eliminar (${videosToDelete.length}):`, videosToDelete);

      // Importar la función de eliminación de videos
      const { processVideoDeletions } = require('./fileController');
      await processVideoDeletions(videosToDelete, req.user.id_user, conn);
    }

    // Obtener URLs de videos tipo 'link' que ya están eliminados
    const deletedVideoUrls = [];
    if (req.body.videos_to_delete) {
      const videosToDelete = Array.isArray(req.body.videos_to_delete) 
        ? req.body.videos_to_delete.map(v => JSON.parse(v))
        : [JSON.parse(req.body.videos_to_delete)];
      
      videosToDelete.forEach(video => {
        if (video.url) {
          deletedVideoUrls.push(video.url);
        }
      });
    }
    console.log('URLs de videos eliminados:', deletedVideoUrls);

    // Procesar enlaces de video (tipo 'link')
    console.log('Procesando enlaces de video tipo link...');
    
    // Eliminar videos tipo 'link' anteriores que no están en la lista de eliminados
    // (por si hubo cambios en las URLs sin eliminar el elemento)
    await conn.query('DELETE FROM videos WHERE id_work = ? AND video_type = "link"', [workId]);

    // Insertar nuevos enlaces de video (tipo 'link')
    if (req.body.video_urls) {
      let videoUrls = Array.isArray(req.body.video_urls) ? req.body.video_urls : [req.body.video_urls];
      
      // Filtrar URLs para no reinsertar las que fueron eliminadas
      videoUrls = videoUrls.filter(url => url && url.trim() && !deletedVideoUrls.includes(url.trim()));
      
      console.log(`Enlaces de video a procesar (${videoUrls.length}):`, videoUrls);
      
      for (const url of videoUrls) {
        if (url && url.trim()) {
          const [result] = await conn.query(
            'INSERT INTO videos (id_work, video_url, video_type) VALUES (?, ?, ?)',
            [workId, url.trim(), 'link']
          );
          console.log(`Enlace de video insertado: ${url.trim()}`, result);
        }
      }
    } else {
      console.log('No hay nuevos enlaces de video para procesar');
    }

    // 5. Actualizar enlaces
    console.log('Procesando enlaces externos...');
    // Primero eliminamos todos los enlaces existentes
    await conn.query('DELETE FROM links WHERE id_work = ?', [workId]);
    
    // Luego insertamos los nuevos (si hay)
    if (req.body.links) {
      const links = Array.isArray(req.body.links) ? req.body.links : [req.body.links];
      const validLinks = links.filter(link => link && link.trim());
      
      console.log(`Enlaces a procesar (${validLinks.length}):`, validLinks);
      
      for (const link of validLinks) {
        if (link.trim()) {
          const [result] = await conn.query(
            'INSERT INTO links (id_work, link_url) VALUES (?, ?)',
            [workId, link.trim()]
          );
          console.log(`Enlace insertado: ${link.trim()}`, result);
        }
      }
    } else {
      console.log('No hay nuevos enlaces para procesar');
    }

    // 6. Actualizar redes sociales
    console.log('Procesando redes sociales...');
    // Primero eliminamos todas las redes sociales existentes
    await conn.query('DELETE FROM social_media WHERE id_work = ?', [workId]);
    
    // Luego insertamos las nuevas (si hay)
    if (req.body.social_platform && req.body.social_url) {
      const platforms = Array.isArray(req.body.social_platform) ? req.body.social_platform : [req.body.social_platform];
      const urls = Array.isArray(req.body.social_url) ? req.body.social_url : [req.body.social_url];
      
      console.log(`Redes sociales a procesar: platforms(${platforms.length}), urls(${urls.length})`);
      
      // Solo procesamos hasta donde tenemos pares completos
      const validCount = Math.min(platforms.length, urls.length);
      
      for (let i = 0; i < validCount; i++) {
        if (platforms[i] && urls[i] && urls[i].trim()) {
          const [result] = await conn.query(
            'INSERT INTO social_media (id_work, platform, handle_or_url) VALUES (?, ?, ?)',
            [workId, platforms[i], urls[i].trim()]
          );
          console.log(`Red social insertada: ${platforms[i]} - ${urls[i].trim()}`, result);
        }
      }
    } else {
      console.log('No hay nuevas redes sociales para procesar');
    }

    // Validación final - Verificar que la obra tenga contenido principal y archivo target
    const [workAfterUpdate] = await conn.query(
      'SELECT url_image_work, url_target_work FROM works WHERE id_work = ?',
      [workId]
    );
    
    if (!workAfterUpdate[0] || !workAfterUpdate[0].url_image_work) {
      throw new AppError('La obra debe tener contenido principal (imagen o video) para poder compartir el QR.', 400);
    }
    
    if (!workAfterUpdate[0] || !workAfterUpdate[0].url_target_work) {
      throw new AppError('La obra debe tener un archivo target para poder utilizar Realidad Aumentada.', 400);
    }

    await conn.commit();
    req.flash('success_msg', 'Obra actualizada exitosamente');
    res.redirect(`/works/${workId}`);
    
  } catch (error) {
    await conn.rollback();
    console.error('Error al actualizar la obra:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Error al actualizar la obra', 500);
  } finally {
    conn.release();
  }
};

// Obtener detalles de una obra
exports.getWorkDetails = async (req, res) => {
  try {
    const workId = req.params.id;
    const [work, ...resources] = await Promise.all([
      db.query('SELECT * FROM works WHERE id_work = ?', [workId]),
      db.query('SELECT * FROM additional_images WHERE id_work = ?', [workId]),
      db.query('SELECT * FROM videos WHERE id_work = ?', [workId]),
      db.query('SELECT * FROM links WHERE id_work = ?', [workId]),
      db.query('SELECT * FROM social_media WHERE id_work = ?', [workId])
    ]);

    if (!work || work.length === 0) {
      throw new AppError('Obra no encontrada', 404);
    }

    // Generar o recuperar el token de compartir
    if (!work[0].share_token) {
      const shareToken = generateShareToken();
      await db.query('UPDATE works SET share_token = ? WHERE id_work = ?', [shareToken, workId]);
      work[0].share_token = shareToken;
    }

    const [additionalImages, videos, links, socialMedia] = resources;
    const baseUrl = req.headers.host;
    const protocol = req.protocol;

    res.render('works/show', {
      title: work[0].title_work,
      work: work[0],
      mainImage: work[0],
      additionalImages,
      videos,
      links,
      socialMedia,
      baseUrl,
      protocol,
      user: req.user
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error al cargar los detalles de la obra', 500);
  }
};

// Obtener obra por token
exports.getWorkByToken = async (req, res) => {
  try {
    // Verificar si el usuario está autenticado
    if (!req.user) {
      // Si no está autenticado, redirigir a la galería con mensaje
      req.flash('error_msg', 'Necesitas iniciar sesión para ver los detalles de la obra');
      return res.redirect('/auth/login');
    }
    
    const shareToken = req.params.token;
    const [work, ...resources] = await Promise.all([
      db.query('SELECT * FROM works WHERE share_token = ? AND status_work = "activa"', [shareToken]),
      db.query('SELECT * FROM additional_images WHERE id_work = (SELECT id_work FROM works WHERE share_token = ?)', [shareToken]),
      db.query('SELECT * FROM videos WHERE id_work = (SELECT id_work FROM works WHERE share_token = ?)', [shareToken]),
      db.query('SELECT * FROM links WHERE id_work = (SELECT id_work FROM works WHERE share_token = ?)', [shareToken]),
      db.query('SELECT * FROM social_media WHERE id_work = (SELECT id_work FROM works WHERE share_token = ?)', [shareToken])
    ]);

    if (!work || work.length === 0) {
      throw new AppError('Obra no encontrada o no disponible', 404);
    }

    const [additionalImages, videos, links, socialMedia] = resources;
    const baseUrl = req.headers.host;
    const protocol = req.protocol;

    res.render('works/show', {
      title: work[0].title_work,
      work: work[0],
      mainImage: work[0],
      additionalImages,
      videos,
      links,
      socialMedia,
      baseUrl,
      protocol,
      user: req.user
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error al cargar la obra', 500);
  }
};

// Ver obra en AR por token
exports.viewWorkAR = async (req, res) => {
  try {
    const shareToken = req.params.token;
    const [work, ...resources] = await Promise.all([
      db.query('SELECT * FROM works WHERE share_token = ? AND status_work = "activa"', [shareToken]),
      db.query('SELECT * FROM additional_images WHERE id_work = (SELECT id_work FROM works WHERE share_token = ?)', [shareToken]),
      db.query('SELECT * FROM videos WHERE id_work = (SELECT id_work FROM works WHERE share_token = ?)', [shareToken]),
      db.query('SELECT * FROM social_media WHERE id_work = (SELECT id_work FROM works WHERE share_token = ?)', [shareToken])
    ]);

    if (!work || work.length === 0) {
      throw new AppError('Obra no encontrada o no disponible', 404);
    }

    const [additionalImages, videos, socialMedia] = resources;

    res.render('works/ar', {
      title: work[0].title_work,
      work: work[0],
      additionalImages,
      videos,
      socialMedia,
      user: req.user
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Error al cargar la vista AR', 500);
  }
};

// Eliminar una obra completa
exports.deleteWork = async (req, res) => {
  const workId = req.params.id;
  const conn = await db.pool.getConnection();
  
  try {
    await conn.beginTransaction();
    
    // 1. Obtener información completa de la obra
    const [works] = await conn.query('SELECT * FROM works WHERE id_work = ?', [workId]);
    if (!works || works.length === 0) {
      throw new AppError('Obra no encontrada', 404);
    }
    const work = works[0];

    // 2. Obtener todos los recursos asociados
    // Consultas individuales para cada tipo de recurso
    const [additionalImages] = await conn.query('SELECT * FROM additional_images WHERE id_work = ?', [workId]);
    const [videos] = await conn.query('SELECT * FROM videos WHERE id_work = ?', [workId]);
    const [links] = await conn.query('SELECT * FROM links WHERE id_work = ?', [workId]);
    const [socialMedia] = await conn.query('SELECT * FROM social_media WHERE id_work = ?', [workId]);
    const [workTags] = await conn.query('SELECT * FROM work_tags WHERE id_work = ?', [workId]);
    
    console.log('Información de la obra:', work);
    console.log('Imágenes adicionales encontradas:', additionalImages.length);
    console.log('Videos encontrados:', videos.length);
    console.log('Enlaces encontrados:', links.length);
    console.log('Redes sociales encontradas:', socialMedia.length);
    console.log('Etiquetas asociadas:', workTags.length);

    // 3. Eliminar archivos físicos
    await deleteWorkFiles({
      work,
      additionalImages,
      videos: videos?.filter(v => v.video_type === 'file') || []
    });

    // 4. Eliminar registros de la base de datos usando consultas individuales en secuencia
    // para asegurar que todo se elimina correctamente
    await conn.query('DELETE FROM additional_images WHERE id_work = ?', [workId]);
    await conn.query('DELETE FROM videos WHERE id_work = ?', [workId]);
    await conn.query('DELETE FROM links WHERE id_work = ?', [workId]);
    await conn.query('DELETE FROM social_media WHERE id_work = ?', [workId]);
    await conn.query('DELETE FROM work_tags WHERE id_work = ?', [workId]);

    // 5. Finalmente, eliminar la obra
    await conn.query('DELETE FROM works WHERE id_work = ?', [workId]);
    
    await conn.commit();
    req.flash('success_msg', 'Obra eliminada completamente, incluyendo todos sus recursos');
    res.redirect('/works');
    
  } catch (error) {
    await conn.rollback();
    console.error('Error al eliminar obra:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Error al eliminar la obra', 500);
  } finally {
    conn.release();
  }
};

// Crear una nueva obra
exports.createWork = async (req, res) => {
  const conn = await db.pool.getConnection();
  
  try {
    await conn.beginTransaction();
    console.log('Iniciando transacción para crear obra');

    // 1. Procesar los archivos subidos
    const mainContent = req.files['mainContent'] ? req.files['mainContent'][0] : null;
    const targetFile = req.files['targetFile'] ? req.files['targetFile'][0] : null;
    
    console.log('Archivos recibidos:', {
      mainContent: mainContent ? {
        filename: mainContent.filename,
        path: mainContent.path,
        mimetype: mainContent.mimetype
      } : null,
      targetFile: targetFile ? {
        filename: targetFile.filename,
        path: targetFile.path
      } : null
    });

    if (!mainContent || !targetFile) {
      throw new AppError('Se requiere contenido principal y archivo target', 400);
    }

    // Determinar el tipo de contenido
    const contentType = mainContent.mimetype.startsWith('video/') ? 'video' : 'image';
    console.log('Tipo de contenido:', contentType);

    // Convertir rutas de Windows a formato URL
    const mainContentPath = mainContent.path.split('\\').join('/').replace(/^.*?\/uploads\//, '/uploads/');
    const targetFilePath = targetFile.path.split('\\').join('/').replace(/^.*?\/uploads\//, '/uploads/');

    console.log('Rutas procesadas:', {
      mainContentPath,
      targetFilePath
    });

    // 2. Crear la obra en la base de datos
    console.log('Insertando obra en la base de datos con datos:', {
      title: req.body.title,
      description: req.body.description,
      category: req.body.id_category,
      userId: req.user.id_user,
      contentType
    });

    const [result] = await conn.query(
      `INSERT INTO works (
        title_work,
        description_work,
        id_category,
        id_user_work,
        url_image_work,
        url_target_work,
        content_type,
        status_work,
        share_token
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.body.title,
        req.body.description,
        req.body.id_category || null,
        req.user.id_user,
        mainContentPath,
        targetFilePath,
        contentType,
        'activa',
        generateShareToken()
      ]
    );

    console.log('Obra creada con ID:', result.insertId);
    const workId = result.insertId;

    // 3. Procesar etiquetas si existen
    if (req.body.tags) {
      const tags = Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags];
      console.log('Procesando etiquetas:', tags);
      
      for (const tagId of tags) {
        await conn.query(
          'INSERT INTO work_tags (id_work, id_tag) VALUES (?, ?)',
          [workId, tagId]
        );
      }
    }

    // 4. Procesar enlaces si existen
    if (req.body.links) {
      const links = Array.isArray(req.body.links) ? req.body.links : [req.body.links];
      console.log('Procesando enlaces:', links);
      
      for (const link of links) {
        if (link.trim()) {
          await conn.query(
            'INSERT INTO links (id_work, link_url) VALUES (?, ?)',
            [workId, link.trim()]
          );
        }
      }
    }

    // 5. Procesar redes sociales si existen
    if (req.body.social_platform && req.body.social_url) {
      const platforms = Array.isArray(req.body.social_platform) ? req.body.social_platform : [req.body.social_platform];
      const urls = Array.isArray(req.body.social_url) ? req.body.social_url : [req.body.social_url];
      
      console.log('Procesando redes sociales:', { platforms, urls });
      
      for (let i = 0; i < platforms.length; i++) {
        if (platforms[i] && urls[i] && urls[i].trim()) {
          await conn.query(
            'INSERT INTO social_media (id_work, platform, handle_or_url) VALUES (?, ?, ?)',
            [workId, platforms[i], urls[i].trim()]
          );
        }
      }
    }

    console.log('Confirmando transacción');
    await conn.commit();
    
    req.flash('success_msg', 'Obra creada exitosamente');
    res.redirect(`/works/${workId}`);
    
  } catch (error) {
    console.error('Error en createWork:', error);
    await conn.rollback();
    
    // Si hay error, eliminar los archivos subidos
    if (req.files) {
      Object.values(req.files).forEach(fileArray => {
        fileArray.forEach(file => {
          if (file.path) {
            fs.unlink(file.path, (err) => {
              if (err) console.error('Error eliminando archivo:', err);
            });
          }
        });
      });
    }

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      throw new AppError('La categoría seleccionada no existe', 400);
    } else if (error.code === 'ER_DUP_ENTRY') {
      throw new AppError('Ya existe una obra con ese título', 400);
    } else if (error instanceof AppError) {
      throw error;
    } else {
      console.error('Error detallado:', error);
      throw new AppError('Error al crear la obra: ' + error.message, 500);
    }
  } finally {
    conn.release();
  }
}; 