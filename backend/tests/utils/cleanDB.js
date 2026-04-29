const db = require('../../bd');

async function cleanDB() {
  try {
    await db.query('SET FOREIGN_KEY_CHECKS = 0');

    // 🔴 Tablas dependientes (primero)
    await db.query('DELETE FROM carritoproducto');
    await db.query('DELETE FROM pedidoproducto');
    await db.query('DELETE FROM pago');

    // 🟠 Intermedias
    await db.query('DELETE FROM carrito');
    await db.query('DELETE FROM pedido');
    await db.query('DELETE FROM productoproveedor');

    // 🟡 Base
    await db.query('DELETE FROM producto');
    await db.query('DELETE FROM proveedores');
    await db.query('DELETE FROM cliente');

    await db.query('SET FOREIGN_KEY_CHECKS = 1');

  } catch (err) {
    console.error('Error limpiando la BD:', err);
    throw err;
  }
}

module.exports = cleanDB;