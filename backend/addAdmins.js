// backend/addAdmins.js
const bcrypt = require('bcrypt');
const pool = require('./bd'); // tu conexión a MySQL desde bd.js
async function addAdmins() {
  try {
    const admins = [
      { NombreC: 'Admin Principal', Correo: 'admin@tienda.com', Contraseña: 'admin123', Telefono: '', Direccion: '' },
      { NombreC: 'Gerente', Correo: 'gerente@tienda.com', Contraseña: 'gerente123', Telefono: '', Direccion: '' }
    ];
    for (const user of admins) {
      // Hash de la contraseña
      const hashed = await bcrypt.hash(user.Contraseña, 10);
      // Insertar en la tabla Clientes
      const [result] = await pool.query(
        'INSERT INTO cliente (NombreC, Telefono, Direccion, Correo, Contraseña) VALUES (?, ?, ?, ?, ?)',
        [user.NombreC, user.Telefono || null, user.Direccion || null, user.Correo, hashed]
      );
      console.log(`Admin agregado: ${user.Correo} (Id: ${result.insertId})`);
    }
    console.log('Todos los admins fueron agregados exitosamente.');
    process.exit(0);
  } catch (err) {
    console.error('Error al agregar admins:', err);
    process.exit(1);
  }
}

addAdmins();
