const mysql = require('mysql2/promise');

<<<<<<< HEAD
// Al usar process.env, el sistema tomará los datos del archivo .env
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1', // Usa el .env o 127.0.0.1 por defecto
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'tiendaropa',
  port: process.env.DB_PORT || 3306,
=======
const isProduction = process.env.NODE_ENV === 'production';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3307,
  ssl: isProduction
    ? { ca: process.env.DB_SSL_CA }
    : undefined,
>>>>>>> origin/main
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

<<<<<<< HEAD
// Prueba de conexión inmediata
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`✅ Conexión a la base de datos "${process.env.DB_NAME || 'tiendaropa'}" exitosa`);
    connection.release(); 
  } catch (err) {
    console.error('❌ Error al conectar a la DB:', err.message);
    console.log('Revisa que tu servidor MySQL (XAMPP) esté encendido y los datos del .env sean correctos.');
  }
})();

module.exports = pool;
=======
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Conexión a la DB exitosa');
    connection.release();
  } catch (err) {
    console.error('Error al conectar a la DB:', err);
  }
})();

module.exports = pool;
>>>>>>> origin/main
