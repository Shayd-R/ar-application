const db = require('../config/database');
const { AppError } = require('../utils/errorHandler');

// Mostrar experiencia AR
exports.showARExperience = async (req, res) => {
  try {
    let work;
    let workId;
    
    // Agregar logging para depuración
    console.log('Parámetros de la solicitud:', {
      token: req.params.token,
      id: req.params.id
    });
    
    if (req.params.token) {
      // Si se accede por token
      console.log('Buscando obra por token:', req.params.token);
      const [rows] = await db.query(`
        SELECT w.*, c.name_category,
               w.url_image_work, w.url_target_work, w.title_work,
               w.description_work, w.status_work, w.id_category,
               w.created_at_work, w.updated_at_work, w.id_user_work
        FROM works w 
        LEFT JOIN categories c ON w.id_category = c.id_category 
        WHERE w.share_token = ? AND w.status_work = 'activa'
      `, [req.params.token]);

      console.log('Resultado directo de la consulta:', rows);
     

      if (!rows || rows.length === 0) {
        console.log('No se encontró la obra');
        throw new AppError('Obra no encontrada o no disponible', 404);
      }
      
      work = rows;
      workId = work.id_work;
      
      console.log('Obra encontrada:', {
        id: work.id_work,
        title: work.title_work,
        status: work.status_work
      });
    } else {
      // Si se accede por ID
      const [rows] = await db.query(`
        SELECT w.*, c.name_category 
        FROM works w 
        LEFT JOIN categories c ON w.id_category = c.id_category 
        WHERE w.id_work = ?
      `, [req.params.id]);
      
      if (!rows || rows.length === 0) {
        throw new AppError('Obra no encontrada', 404);
      }
      
      work = rows[0];
      workId = req.params.id;
      
      // Verificar si la obra está activa
      if (work.status_work !== 'activa') {
        throw new AppError('Esta obra no está disponible para visualización en AR', 400);
      }
    }
    
    // Verificar que exista una imagen con target AR
    if (!work.url_image_work || !work.url_target_work) {
      throw new AppError('Esta obra no tiene recursos AR disponibles', 400);
    }
    
    console.log('Datos de la obra para AR:', {
      id: work.id_work,
      title: work.title_work,
      imageUrl: work.url_image_work,
      targetUrl: work.url_target_work,
      contentType: work.content_type
    });
    
    // Obtener recursos adicionales
    // Consultas individuales secuenciales
    const additionalImages = await db.query(
      'SELECT * FROM additional_images WHERE id_work = ?', 
      [workId]
    );
    // console.log(additionalImages.length);

    const videos = await db.query(
      'SELECT * FROM videos WHERE id_work = ?',
      [workId]
    );

    const links = await db.query(
      'SELECT * FROM links WHERE id_work = ?',
      [workId]
    );

    const socialMedia = await db.query(
      'SELECT * FROM social_media WHERE id_work = ?',
      [workId]
    );

    const tags = await db.query(`
      SELECT t.* 
      FROM tags t 
      INNER JOIN work_tags wt ON t.id_tag = wt.id_tag 
      WHERE wt.id_work = ?
    `, [workId]);

    // console.log('Recursos adicionales cargados:', {
    //   additionalImages: additionalImages?.length || 0,
    //   videos: videos?.length || 0, 
    //   links: links?.length || 0,
    //   socialMedia: socialMedia?.length || 0,
    //   tags: tags?.length || 0
    // });

    // Renderizar la página AR
    res.render('works/ar', {
      title: `AR: ${work.title_work}`,
      work,
      mainImage: work,
      additionalImages: additionalImages || [],
      videos: videos || [],
      links: links || [],
      social_media: socialMedia || [],
      tags: tags || [],
      user: req.user
    });
  } catch (error) {
    console.error('Error en showARExperience:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Error al cargar la experiencia AR: ' + error.message, 500);
  }
};

