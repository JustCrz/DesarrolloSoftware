const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
db.connect(err => {
  if (err) {
    console.error('Error al conectar a la DB:', err);
  } else {
    console.log('Conexión a la DB exitosa ✅');
  }
});
module.exports = pool;
