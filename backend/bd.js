const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '127.0.0.1',     // Cambiado de localhost a IP para evitar errores en Mac
  user: 'root',          // Usuario por defecto de XAMPP
  password: '',          // XAMPP normalmente no tiene contraseña
  database: 'tiendaropa', // El nombre que veo en tu captura de phpMyAdmin
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Prueba de conexión inmediata
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a la base de datos "tiendaropa" exitosa');
    connection.release(); 
  } catch (err) {
    console.error('❌ Error al conectar a la DB:', err.message);
  }
})();

module.exports = pool;