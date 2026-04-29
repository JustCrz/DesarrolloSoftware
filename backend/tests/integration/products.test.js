const request = require('supertest');
const app = require('../../app');
const db = require('../../bd');
const path = require('path');
const fs = require('fs');

const cleanDB = require('../utils/cleanDB');
const {
  seedProviders,
  seedProducts
} = require('../utils/seedData');

describe('Products Integration', () => {

  let idProveedor;
  let idProducto;

  beforeAll(async () => {
    await cleanDB();

    idProveedor = await seedProviders();
    idProducto = await seedProducts(idProveedor);
  });

  afterAll(async () => {
    await db.end();
  });

  // 🔹 INT-04.01
  test('GET /products obtiene lista de productos', async () => {
    const res = await request(app)
      .get('/api/products');

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.products)).toBe(true);
  });

  // 🔹 INT-04.02
  test('GET /products/with-providers incluye proveedores', async () => {
    const res = await request(app)
      .get('/api/products/with-providers');

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);

    const producto = res.body.products.find(p => p.IdProducto === idProducto);

    expect(producto).toBeDefined();
    expect(Array.isArray(producto.Proveedores)).toBe(true);
    expect(producto.Proveedores.length).toBeGreaterThan(0);
  });

  // 🔹 INT-04.03
  test('POST crea producto correctamente', async () => {
    const res = await request(app)
    .post('/api/products')
    .field('Nombre', 'Nuevo Producto')
    .field('Precio', '200')
    .field('Stock', '5')
    .attach('Imagen', fs.createReadStream(
        path.join(process.cwd(), 'tests/files/test.jpg')
    ));
      
    expect(res.statusCode).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.product.Nombre).toBe('Nuevo Producto');
  });

  // 🔹 INT-04.04
  test('POST falla si faltan campos obligatorios', async () => {
    const res = await request(app)
      .post('/api/products')
      .field('Precio', 200);

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  // 🔹 INT-04.05
  test('PUT actualiza producto correctamente', async () => {
    const res = await request(app)
      .put(`/api/products/${idProducto}`)
      .field('Nombre', 'Producto Actualizado')
      .field('Precio', 150)
      .field('Stock', 20);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);

    const [rows] = await db.query(
      'SELECT Nombre FROM producto WHERE IdProducto = ?',
      [idProducto]
    );

    expect(rows[0].Nombre).toBe('Producto Actualizado');
  });

  // 🔹 INT-04.06
  test('PUT falla si producto no existe', async () => {
    const res = await request(app)
      .put('/api/products/99999')
      .field('Nombre', 'X')
      .field('Precio', 100)
      .field('Stock', 10);

    expect(res.statusCode).toBe(404);
    expect(res.body.ok).toBe(false);
  });

  // 🔹 INT-04.07
  test('DELETE elimina producto correctamente', async () => {
    const res = await request(app)
      .delete(`/api/products/${idProducto}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);

    const [rows] = await db.query(
      'SELECT * FROM producto WHERE IdProducto = ?',
      [idProducto]
    );

    expect(rows.length).toBe(0);
  });

  // 🔹 INT-04.08
  test('DELETE falla si producto no existe', async () => {
    const res = await request(app)
      .delete('/api/products/99999');

    expect(res.statusCode).toBe(404);
    expect(res.body.ok).toBe(false);
  });

});