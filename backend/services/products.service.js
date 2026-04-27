const pool = require('../bd');
const fs = require('fs');
const path = require('path');

// 1. Obtener productos
async function getAllProducts() {
  const [rows] = await pool.query(`
    SELECT 
      IdProducto, Nombre, Categoria, Talla, Color,
      Precio, Stock, Imagen, Calificacion,
      EnPromocion, PrecioOferta, FechaFinPromo
    FROM producto
    ORDER BY IdProducto
  `);

  return rows;
}

// 2. Productos con proveedores
async function getProductsProviders() {
  const [rows] = await pool.query(`
    SELECT 
      p.IdProducto, p.Nombre, p.Categoria, p.Talla, p.Color,
      p.Precio, p.Stock, p.Imagen,
      pr.IdProveedor, pr.Nombre AS NombreProveedor
    FROM producto p
    LEFT JOIN productoproveedor pp ON p.IdProducto = pp.IdProducto
    LEFT JOIN proveedores pr ON pp.IdProveedor = pr.IdProveedor
    ORDER BY p.IdProducto
  `);

  // Agrupar productos con proveedores
  const map = new Map();

  for (const row of rows) {
    if (!map.has(row.IdProducto)) {
      map.set(row.IdProducto, {
        IdProducto: row.IdProducto,
        Nombre: row.Nombre,
        Categoria: row.Categoria,
        Talla: row.Talla,
        Color: row.Color,
        Precio: row.Precio,
        Stock: row.Stock,
        Imagen: row.Imagen,
        Proveedores: []
      });
    }

    if (row.IdProveedor) {
      map.get(row.IdProducto).Proveedores.push({
        IdProveedor: row.IdProveedor,
        Nombre: row.NombreProveedor
      });
    }
  }

  return Array.from(map.values());
}

// 3. Crear producto
async function createProduct(data, file) {
  const {
    Nombre,
    Categoria,
    Talla,
    Color,
    Precio,
    Stock,
    Calificacion,
    EnPromocion,
    PrecioOferta,
    FechaFinPromo
  } = data;

  const Imagen = file ? file.filename : null;

  if (!Nombre || !Precio || !Stock) {
    throw new Error('Nombre, Precio y Stock son obligatorios');
  }

  const [result] = await pool.query(`
    INSERT INTO producto 
    (Nombre, Categoria, Talla, Color, Precio, Stock, Imagen, Calificacion, EnPromocion, PrecioOferta, FechaFinPromo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    Nombre,
    Categoria || null,
    Talla || null,
    Color || null,
    Precio,
    Stock,
    Imagen,
    Calificacion || 0,
    EnPromocion || 0,
    PrecioOferta || 0,
    FechaFinPromo || null
  ]);

  return {
    IdProducto: result.insertId,
    Nombre,
    Imagen
  };
}

// 4. Eliminar producto
async function removeProduct(id) {
  const [rows] = await pool.query(
    'SELECT Imagen FROM producto WHERE IdProducto = ?',
    [id]
  );

  if (rows.length > 0 && rows[0].Imagen) {
    const filePath = path.join(__dirname, '../uploads/', rows[0].Imagen);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  const [result] = await pool.query(
    'DELETE FROM producto WHERE IdProducto = ?',
    [id]
  );

  if (result.affectedRows === 0) {
    throw new Error('Producto no encontrado');
  }

  return true;
}

// 5. Actualizar producto
async function updateProduct(id, data, file) {
  const {
    Nombre,
    Categoria,
    Talla,
    Color,
    Precio,
    Stock,
    Calificacion,
    EnPromocion,
    PrecioOferta,
    FechaFinPromo
  } = data;

  const Imagen = file ? file.filename : null;

  // eliminar imagen anterior si se reemplaza
  if (Imagen) {
    const [rows] = await pool.query(
      'SELECT Imagen FROM producto WHERE IdProducto = ?',
      [id]
    );

    if (rows.length > 0 && rows[0].Imagen) {
      const oldPath = path.join(__dirname, '../uploads/', rows[0].Imagen);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
  }

  let sql = `
    UPDATE producto SET 
      Nombre=?, Categoria=?, Talla=?, Color=?,
      Precio=?, Stock=?, Calificacion=?, EnPromocion=?,
      PrecioOferta=?, FechaFinPromo=?
  `;

  const params = [
    Nombre,
    Categoria || null,
    Talla || null,
    Color || null,
    Precio,
    Stock,
    Calificacion || 0,
    EnPromocion || 0,
    PrecioOferta || 0,
    FechaFinPromo || null
  ];

  if (Imagen) {
    sql += ', Imagen=?';
    params.push(Imagen);
  }

  sql += ' WHERE IdProducto=?';
  params.push(id);

  const [result] = await pool.query(sql, params);

  if (result.affectedRows === 0) {
    throw new Error('Producto no encontrado');
  }

  return true;
}

module.exports = {
  getAllProducts,
  getProductsProviders,
  createProduct,
  removeProduct,
  updateProduct
};