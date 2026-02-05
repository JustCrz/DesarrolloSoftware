const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    ca: process.env.DB_SSL_CA
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Conexión a la DB exitosa');
    connection.release(); // devolver la conexión al pool
  } catch (err) {
    console.error('Error al conectar a la DB:', err);
  }
})();

module.exports = pool;
