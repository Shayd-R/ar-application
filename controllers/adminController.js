const db = require('../config/database');
const { AppError } = require('../utils/errorHandler');
const bcrypt = require('bcryptjs');

// Dashboard
exports.getDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalWorks,
      recentWorks,
      recentUsers
    ] = await Promise.all([
      db.query('SELECT COUNT(*) as total FROM users'),
      db.query('SELECT COUNT(*) as total FROM works'),
      db.query(`
        SELECT w.*, u.name_user 
        FROM works w 
        JOIN users u ON w.id_user_work = u.id_user 
        ORDER BY w.created_at_work DESC 
        LIMIT 5
      `),
      db.query('SELECT * FROM users ORDER BY created_at_user DESC LIMIT 5')
    ]);

    res.render('admin/dashboard', {
      title: 'Panel de Administración',
      totalUsers: totalUsers[0].total,
      totalWorks: totalWorks[0].total,
      recentWorks,
      recentUsers,
      user: req.user
    });
  } catch (error) {
    throw new AppError('Error al cargar el dashboard', 500);
  }
};

// Gestión de Usuarios
exports.getUsers = async (req, res) => {
  try {
    const users = await db.query('SELECT * FROM users ORDER BY created_at_user DESC');
    
    res.render('admin/users', {
      title: 'Gestión de Usuarios',
      users,
      user: req.user
    });
  } catch (error) {
    throw new AppError('Error al cargar los usuarios', 500);
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Verificar si el email ya existe
    const existingUser = await db.query('SELECT * FROM users WHERE email_user = ?', [email]);
    if (existingUser.length > 0) {
      req.flash('error_msg', 'El email ya está registrado');
      return res.redirect('/admin/users');
    }
    
    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Verificar si la columna active_user existe
    try {
      await db.query('SELECT active_user FROM users LIMIT 1');
      // Si no hay error, la columna existe
    } catch (error) {
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        // La columna no existe, ejecutamos ALTER TABLE para crearla
        await db.query('ALTER TABLE users ADD COLUMN active_user TINYINT NOT NULL DEFAULT 1 AFTER token_exp_user');
        console.log('Columna active_user añadida a la tabla users');
      }
    }
    
    // Crear el usuario
    await db.query(
      'INSERT INTO users (name_user, email_user, password_user, id_role_user, active_user, created_at_user) VALUES (?, ?, ?, ?, ?, NOW())',
      [name, email, hashedPassword, role, 1]
    );
    
    req.flash('success_msg', 'Usuario creado exitosamente');
    res.redirect('/admin/users');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error al crear el usuario');
    res.redirect('/admin/users');
  }
};

exports.getUserEdit = async (req, res) => {
  try {
    const userId = req.params.id;
    const [userData] = await db.query('SELECT * FROM users WHERE id_user = ?', [userId]);
    
    if (!userData) {
      req.flash('error_msg', 'Usuario no encontrado');
      return res.redirect('/admin/users');
    }
    
    res.render('admin/user-edit', {
      title: 'Editar Usuario',
      userData,
      user: req.user
    });
  } catch (error) {
    throw new AppError('Error al cargar la información del usuario', 500);
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, role, password, resetToken, active } = req.body;
    
    // Verificar si el email ya está en uso por otro usuario
    const existingUsers = await db.query(
      'SELECT * FROM users WHERE email_user = ? AND id_user != ?', 
      [email, userId]
    );
    
    if (existingUsers.length > 0) {
      req.flash('error_msg', 'El email ya está siendo usado por otro usuario');
      return res.redirect(`/admin/users/${userId}/edit`);
    }

    // Generar token de recuperación si se ha seleccionado esa opción
    let tokenValue = null;
    let tokenExpValue = null;
    
    if (resetToken === 'reset') {
      // Generar un token aleatorio
      tokenValue = require('crypto').randomBytes(20).toString('hex');
      // Establecer expiración a 1 hora desde ahora
      tokenExpValue = new Date(Date.now() + 3600000);
    }
    
    // Verificar si la columna active_user existe
    let activeValue = active ? parseInt(active) : 1;
    
    try {
      await db.query('SELECT active_user FROM users LIMIT 1');
      // Si no hay error, la columna existe
    } catch (error) {
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        // La columna no existe, ejecutamos ALTER TABLE para crearla
        await db.query('ALTER TABLE users ADD COLUMN active_user TINYINT NOT NULL DEFAULT 1 AFTER token_exp_user');
        console.log('Columna active_user añadida a la tabla users');
      }
    }
    
    // Si se proporciona una nueva contraseña, hash y actualizar
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      await db.query(
        'UPDATE users SET name_user = ?, email_user = ?, password_user = ?, id_role_user = ?, token_user = ?, token_exp_user = ?, active_user = ?, updated_at_user = NOW() WHERE id_user = ?',
        [name, email, hashedPassword, role, tokenValue, tokenExpValue, activeValue, userId]
      );
    } else {
      // Actualizar sin cambiar la contraseña
      await db.query(
        'UPDATE users SET name_user = ?, email_user = ?, id_role_user = ?, token_user = ?, token_exp_user = ?, active_user = ?, updated_at_user = NOW() WHERE id_user = ?',
        [name, email, role, tokenValue, tokenExpValue, activeValue, userId]
      );
    }
    
    req.flash('success_msg', 'Usuario actualizado exitosamente');
    res.redirect('/admin/users');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error al actualizar el usuario');
    res.redirect('/admin/users');
  }
};

// Gestión de Obras
exports.getAllWorks = async (req, res) => {
  try {
    const works = await db.query(`
      SELECT w.*, u.name_user, c.name_category 
      FROM works w 
      JOIN users u ON w.id_user_work = u.id_user 
      LEFT JOIN categories c ON w.id_category = c.id_category
      ORDER BY w.created_at_work DESC
    `);
    
    res.render('admin/works', {
      title: 'Gestión de Obras',
      works,
      user: req.user
    });
  } catch (error) {
    throw new AppError('Error al cargar las obras', 500);
  }
};

exports.updateWorkStatus = async (req, res) => {
  try {
    const { workId, status } = req.body;
    await db.query('UPDATE works SET status_work = ? WHERE id_work = ?', [status, workId]);
    
    req.flash('success_msg', 'Estado de la obra actualizado exitosamente');
    res.redirect('/admin/works');
  } catch (error) {
    throw new AppError('Error al actualizar el estado de la obra', 500);
  }
};

exports.checkUserWorks = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Obtener el usuario
    const [userData] = await db.query('SELECT * FROM users WHERE id_user = ?', [userId]);
    if (!userData) {
      req.flash('error_msg', 'Usuario no encontrado');
      return res.redirect('/admin/users');
    }
    
    // Obtener las obras del usuario
    const userWorks = await db.query('SELECT * FROM works WHERE id_user_work = ?', [userId]);
    
    if (userWorks.length === 0) {
      // Si no tiene obras, redirigir a confirmación de eliminación directa
      return res.render('admin/user-delete', {
        title: 'Eliminar Usuario',
        userData,
        userWorks: [],
        hasWorks: false,
        user: req.user
      });
    }
    
    // Si tiene obras, mostrar opciones
    res.render('admin/user-delete', {
      title: 'Eliminar Usuario',
      userData,
      userWorks,
      hasWorks: true,
      user: req.user
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error al verificar las obras del usuario');
    res.redirect('/admin/users');
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { option } = req.body;
    
    // Verificar si el usuario existe
    const [userData] = await db.query('SELECT * FROM users WHERE id_user = ?', [userId]);
    if (!userData) {
      req.flash('error_msg', 'Usuario no encontrado');
      return res.redirect('/admin/users');
    }
    
    // Obtener las obras del usuario
    const userWorks = await db.query('SELECT * FROM works WHERE id_user_work = ?', [userId]);
    
    // Según la opción seleccionada
    if (userWorks.length > 0) {
      if (option === 'migrate') {
        // Migrar las obras al usuario administrador (ID 1)
        await db.query('UPDATE works SET id_user_work = 1 WHERE id_user_work = ?', [userId]);
      } else if (option === 'delete') {
        // Importar la función para eliminar archivos físicos
        const { deleteWorkFiles } = require('../utils/fileManager');
        
        // Eliminar todas las obras del usuario, incluyendo archivos físicos
        for (const work of userWorks) {
          // Obtener todos los recursos asociados a cada obra
          const [additionalImages] = await db.query('SELECT * FROM additional_images WHERE id_work = ?', [work.id_work]);
          const [videos] = await db.query('SELECT * FROM videos WHERE id_work = ?', [work.id_work]);
          
          // Eliminar archivos físicos primero
          await deleteWorkFiles({
            work,
            additionalImages,
            videos: videos?.filter(v => v.video_type === 'file') || []
          });
          
          // Eliminar registros relacionados en orden
          await db.query('DELETE FROM additional_images WHERE id_work = ?', [work.id_work]);
          await db.query('DELETE FROM videos WHERE id_work = ?', [work.id_work]);
          await db.query('DELETE FROM links WHERE id_work = ?', [work.id_work]);
          await db.query('DELETE FROM social_media WHERE id_work = ?', [work.id_work]);
          await db.query('DELETE FROM work_tags WHERE id_work = ?', [work.id_work]);
        }
        
        // Luego eliminar las obras
        await db.query('DELETE FROM works WHERE id_user_work = ?', [userId]);
        console.log(`Eliminadas ${userWorks.length} obras del usuario ID ${userId}`);
      }
    }
    
    // Finalmente, eliminar el usuario
    await db.query('DELETE FROM users WHERE id_user = ?', [userId]);
    
    req.flash('success_msg', 'Usuario eliminado exitosamente');
    res.redirect('/admin/users');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Error al eliminar el usuario');
    res.redirect('/admin/users');
  }
}; 