const db = require('../../bd');
const bcrypt = require('bcrypt');

// 👤 CLIENTES
async function seedUsers() {
  const hash = await bcrypt.hash('123456', 10);

  const [cliente] = await db.query(`
    INSERT INTO cliente 
    (Correo, Contraseña, Direccion, NombreC, role, Telefono)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    'test@test.com',
    hash,
    'direccion test',
    'Cliente Test',
    'cliente',
    '1234567890'
  ]);

  return cliente.insertId;
}

// 🏭 PROVEEDORES
async function seedProviders() {
  const [prov] = await db.query(`
    INSERT INTO proveedores (Nombre, Telefono, Correo, Direccion)
    VALUES ('Proveedor Test', '1234567890', 'prov@test.com', 'direccion')
  `);

  return prov.insertId;
}

// 📦 PRODUCTOS
async function seedProducts(idProveedor) {
  const [producto] = await db.query(`
    INSERT INTO producto 
    (Nombre, Categoria, Talla, Color, Precio, Stock, Imagen, Calificacion, EnPromocion, PrecioOferta, FechaFinPromo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'Producto Test',
    'Ropa',
    'M',
    'Rojo',
    100,
    10,
    'img.png',
    5,
    0,
    0,
    null
  ]);

  await db.query(`
    INSERT INTO productoproveedor (IdProducto, IdProveedor)
    VALUES (?, ?)
  `, [producto.insertId, idProveedor]);

  return producto.insertId;
}

// 🛒 CARRITO
async function seedCart(idCliente) {
  const [carrito] = await db.query(`
    INSERT INTO carrito (IdCliente, Total)
    VALUES (?, 0)
  `, [idCliente]);

  return carrito.insertId;
}

// 🛒 PRODUCTO EN CARRITO
async function seedCartProduct(idCarrito, idProducto) {
  await db.query(`
    INSERT INTO carritoproducto (Cantidad, IdCarrito, IdProducto)
    VALUES (1, ?, ?)
  `, [idCarrito, idProducto]);
}

// 📦 PEDIDO
async function seedPedido(idCliente) {
  const [pedido] = await db.query(`
    INSERT INTO pedido 
    (Estado, Fecha, IdCliente, latitud, latitud_repartidor, longitud, longitud_repartidor, Total)
    VALUES ('pendiente', NOW(), ?, 0, 0, 0, 0, 0)
  `, [idCliente]);

  return pedido.insertId;
}

// 📦 PRODUCTO EN PEDIDO
async function seedPedidoProducto(idPedido, idProducto) {
  await db.query(`
    INSERT INTO pedidoproducto (Cantidad, IdPedido, IdProducto)
    VALUES (1, ?, ?)
  `, [idPedido, idProducto]);
}

// 💳 PAGO
async function seedPago(idPedido) {
  const [pago] = await db.query(`
    INSERT INTO pago (Estado, Fecha, IdPedido, MetodoPago, Monto)
    VALUES ('pendiente', NOW(), ?, 'tarjeta', 100)
  `, [idPedido]);

  return pago.insertId;
}

module.exports = {
  seedUsers,
  seedProviders,
  seedProducts,
  seedCart,
  seedCartProduct,
  seedPedido,
  seedPedidoProducto,
  seedPago
};