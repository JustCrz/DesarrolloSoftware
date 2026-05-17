const mysql = require('mysql2/promise');

/**
 * Configuración de la base de datos MySQL
 * Se utiliza el puerto estándar 3306 y la base de datos 'tiendaropa'
 */
const pool = mysql.createPool({
  host: '127.0.0.1', 
  user: 'root',
  password: '', // Asegúrate de que coincida con tu contraseña de XAMPP/MySQL
  database: 'tiendaropa',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;