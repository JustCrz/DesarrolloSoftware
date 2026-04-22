const mysql = require('mysql2/promise');

// Al usar process.env, el sistema tomará los datos del archivo .env
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1', 
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'tiendaropa',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Prueba de conexión inmediata
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log(` Conexión a la base de datos "${process.env.DB_NAME || 'tiendaropa'}" exitosa`);
    connection.release(); 
  } catch (err) {
    console.error('Error al conectar a la DB:', err.message);
    console.log('Revisa que tu servidor MySQL (XAMPP) esté encendido y los datos del .env sean correctos.');
  }
})();

module.exports = pool;
