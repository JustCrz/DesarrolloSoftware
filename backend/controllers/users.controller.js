/**
 * @module UsersController
 */
const pool = require('../bd');
const bcrypt = require('bcrypt');

/**
 * Obtener todos los clientes registrados (Para el Panel Admin)
 */
async function getAllUsers(req, res) {
  try {
    const [rows] = await pool.query('SELECT IdCliente, NombreC, Correo, Telefono, Direccion FROM cliente');
    res.json({ ok: true, users: rows });
  } catch (err) {
    console.error("Error al obtener usuarios:", err);
    res.status(500).json({ ok: false, message: 'Error al obtener usuarios' });
  }
}

/**
 * Registrar un nuevo cliente con contraseña encriptada
 */
async function registerUser(req, res) {
  try {
    const { NombreC, Correo, Telefono, Direccion } = req.body;
    const passwordRaw = req.body['Contraseña'] || req.body.Contrasena || req.body.password;

    if (!NombreC || !Correo || !passwordRaw) {
      return res.status(400).json({ ok: false, message: 'Nombre, correo y contraseña son obligatorios' });
    }

    const [existing] = await pool.query('SELECT * FROM cliente WHERE Correo = ?', [Correo]);
    if (existing.length > 0) {
      return res.status(400).json({ ok: false, message: 'Este correo ya está registrado' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(passwordRaw, saltRounds);

    const [result] = await pool.query(
      'INSERT INTO cliente (NombreC, Correo, Contraseña, Telefono, Direccion, role) VALUES (?, ?, ?, ?, ?, ?)',
      [NombreC, Correo, hashedPassword, Telefono || null, Direccion || null, 'cliente']
    );

    res.status(201).json({ ok: true, message: 'Usuario registrado exitosamente', id: result.insertId });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
}

/**
 * Eliminar un cliente
 */
async function deleteUser(req, res) {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM cliente WHERE IdCliente = ?', [id]);
    res.json({ ok: true, message: 'Usuario eliminado' });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'No se puede eliminar un cliente con historial de compras' });
  }
}
/**
 * Actualizar perfil de un cliente
 */
async function updateUser(req, res) {
  const id = req.body.id || req.body.idCliente || req.body.IdCliente;
  const nombre = req.body.nombre || req.body.NombreC;
  const telefono = req.body.telefono || req.body.Telefono;
  const direccion = req.body.direccion || req.body.Direccion;

  if (!id) {
    return res.status(400).json({ ok: false, message: 'ID de usuario es requerido' });
  }

  if (req.user.role !== 'admin' && Number(req.user.id) !== Number(id)) {
    return res.status(403).json({ ok: false, message: 'Acceso denegado' });
  }

  try {
    const query = `
      UPDATE cliente 
      SET NombreC = ?, Telefono = ?, Direccion = ? 
      WHERE IdCliente = ?
    `;

    const [result] = await pool.query(query, [nombre, telefono, direccion, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    }

    res.json({ ok: true, message: 'Perfil actualizado correctamente' });
  } catch (err) {
    console.error("Error al actualizar usuario:", err);
    res.status(500).json({ ok: false, message: 'Error interno al actualizar el perfil' });
  }
}

/// Borra todos los exports.xxx y cámbialos por un solo objeto:
module.exports = {
  getAllUsers,
  registerUser,
  deleteUser,
  updateUser
};
