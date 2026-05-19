require('dotenv').config();
const mysql = require('mysql2/promise');

/**
 * Configuración de la base de datos MySQL
 * Se utiliza el puerto estándar 3306 y la base de datos 'tiendaropa'
 */
const pool = mysql.createPool({
  host: '127.0.0.1', 
  user: process.env.DB_USER, // Asegúrate de que coincida con tu usuario de XAMPP/MySQL
  password: process.env.DB_PASSWORD, // Asegúrate de que coincida con tu contraseña de XAMPP/MySQL
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;