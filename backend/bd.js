const mysql = require('mysql2/promise');

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: isProduction
    ? { ca: process.env.DB_SSL_CA }
    : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
console.log("DB usada:", process.env.DB_NAME);
// Prueba de conexión inmediata
if (!isTest) {
  (async () => {
    try {
      const connection = await pool.getConnection();
      console.log(`Conexión a la base de datos "${process.env.DB_NAME}" exitosa`);
      connection.release();
    } catch (err) {
      console.error('Error al conectar a la DB:', err.message);
    }
  })();
}

module.exports = pool;
