const db = require('../config/database');
const { AppError } = require('../utils/errorHandler');

exports.getGallery = async (req, res) => {
  try {
    // Obtener obras activas para mostrar en la galería pública
    const works = await db.query(`
      SELECT w.*, u.name_user 
      FROM works w 
      JOIN users u ON w.id_user_work = u.id_user 
      WHERE w.status_work = 'activa' 
      ORDER BY w.created_at_work DESC
    `);
    
    res.render('gallery', {
      title: 'Galería de Arte Digital',
      works,
      user: req.user
    });
  } catch (error) {
    console.error('Error al cargar la galería:', error);
    throw new AppError('Error al cargar la galería de obras', 500);
  }
}; 