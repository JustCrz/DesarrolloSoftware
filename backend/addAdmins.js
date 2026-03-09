// backend/addAdmins.js
const bcrypt = require('bcrypt');
const pool = require('./bd');

async function addAdmins() {
  try {
    const admins = [
      { NombreC: 'Admin Principal', Correo: 'admin@tienda.com', Contraseña: 'admin123', Telefono: '', Direccion: '' },
      { NombreC: 'Gerente', Correo: 'gerente@tienda.com', Contraseña: 'gerente123', Telefono: '', Direccion: '' }
    ];

    for (const user of admins) {
      // 1. Verificar si ya existe para evitar errores
      const [existing] = await pool.query('SELECT IdCliente FROM cliente WHERE Correo = ?', [user.Correo]);
      
      if (existing.length > 0) {
        console.log(`El admin ${user.Correo} ya existe, saltando...`);
        continue; // Pasa al siguiente admin
      }

      // 2. Hash de la contraseña
      const hashed = await bcrypt.hash(user.Contraseña, 10);
      
      // 3. Insertar
      const [result] = await pool.query(
        'INSERT INTO cliente (NombreC, Telefono, Direccion, Correo, Contraseña) VALUES (?, ?, ?, ?, ?)',
        [user.NombreC, user.Telefono || null, user.Direccion || null, user.Correo, hashed]
      );
      
      console.log(`Admin agregado correctamente: ${user.Correo} (Id: ${result.insertId})`);
    }
    
    console.log('Proceso de carga de admins finalizado.');
    process.exit(0);
  } catch (err) {
    console.error('Error al agregar admins:', err);
    process.exit(1);
  }
}

addAdmins();