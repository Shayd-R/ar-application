const mysql = require('mysql2/promise');

// Configuración de la conexión a la base de datos
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'ar',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verificar la conexión
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Conexión a la base de datos establecida correctamente');
    connection.release();
    return true;
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
    return false;
  }
}

// Ejecutar consulta SQL
async function query(sql, params) {
  try {
    const [results] = await pool.execute(sql, params);
    // console.log('Resultados consulta SQL:', sql.substring(0, 50) + '...', results);
    return results;
  } catch (error) {
    console.error('Error en la consulta SQL:', error);
    throw error;
  }
}

// Ejecutar una consulta INSERT y obtener el ID insertado
async function insert(sql, params) {
  try {
    const [result] = await pool.execute(sql, params);
    console.log('Resultado de inserción:', result);
    return {
      insertId: result.insertId,
      affectedRows: result.affectedRows
    };
  } catch (error) {
    console.error('Error en la inserción SQL:', error);
    throw error;
  }
}

module.exports = {
  pool,
  query,
  insert,
  testConnection
}; 