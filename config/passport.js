const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const db = require('./database');

module.exports = function(passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        // Buscar usuario por email
        const users = await db.query('SELECT * FROM users WHERE email_user = ?', [email]);
        
        if (users.length === 0) {
          return done(null, false, { message: 'Ese email no está registrado' });
        }

        const user = users[0];

        // Verificar si el usuario está activo
        // Primero comprobamos si la columna active_user existe en la base de datos
        let isActive = true; // Por defecto asumimos que está activo si no existe la columna
        
        try {
          const activeUsers = await db.query('SELECT active_user FROM users WHERE id_user = ?', [user.id_user]);
          isActive = activeUsers[0].active_user === 1;
        } catch (err) {
          if (err.code === 'ER_BAD_FIELD_ERROR') {
            // La columna no existe todavía, consideramos al usuario activo
            console.log('Columna active_user no encontrada, considerando usuario activo por defecto');
          } else {
            throw err;
          }
        }
        
        // Si el usuario está inactivo, no permitir el login
        if (!isActive) {
          return done(null, false, { message: 'Esta cuenta ha sido desactivada. Contacta con el administrador.' });
        }

        // Verificar si el usuario tiene un token de recuperación
        if (user.token_user) {
          // Verificar si el token ha expirado
          const tokenExpired = user.token_exp_user && new Date() > new Date(user.token_exp_user);
          
          if (tokenExpired) {
            // Si el token ha expirado, lo limpiamos y continuamos con la autenticación normal
            await db.query(
              'UPDATE users SET token_user = NULL, token_exp_user = NULL WHERE id_user = ?',
              [user.id_user]
            );
          } else {
            // Si el token está vigente, redirigimos a la página de recuperación
            return done(null, false, { 
              message: 'Tu contraseña necesita ser restablecida. Por favor, utiliza la opción "Olvidé mi contraseña" en la pantalla de inicio de sesión.',
              requiresReset: true
            });
          }
        }

        // Verificar contraseña
        bcrypt.compare(password, user.password_user, (err, isMatch) => {
          if (err) throw err;
          
          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, { message: 'Contraseña incorrecta' });
          }
        });
      } catch (error) {
        console.error('Error en la autenticación:', error);
        return done(error);
      }
    })
  );

  // Serializar usuario para la sesión
  passport.serializeUser((user, done) => {
    done(null, user.id_user);
  });

  // Deserializar usuario
  passport.deserializeUser(async (id, done) => {
    try {
      const users = await db.query('SELECT * FROM users WHERE id_user = ?', [id]);
      done(null, users[0]);
    } catch (error) {
      done(error, null);
    }
  });
}; 