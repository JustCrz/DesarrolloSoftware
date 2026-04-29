const request = require('supertest');
const app = require('../../app');
const db = require('../../bd');

const cleanDB = require('../utils/cleanDB');
const { seedUsers, seedProviders, seedProducts } = require('../utils/seedData');

describe('Sales Integration', () => {

  let idCliente;
  let idProducto;

  beforeAll(async () => {
    await cleanDB();

    idCliente = await seedUsers();
    const idProveedor = await seedProviders();
    idProducto = await seedProducts(idProveedor);
  });

  afterAll(async () => {
    await db.end();
  });

  // 🔹 INT-07.01
  test('POST /sales crea venta correctamente', async () => {
    const res = await request(app)
      .post('/api/sales')
      .send({
        IdCliente: idCliente,
        productos: [
          { IdProducto: idProducto, Cantidad: 2 }
        ]
      });
    console.log(res.body);
    expect(res.statusCode).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.result.idPedido).toBeDefined();
  });

  // 🔹 INT-07.02
  test('POST falla si no hay productos', async () => {
    const res = await request(app)
      .post('/api/sales')
      .send({
        IdCliente: idCliente,
        productos: []
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  // 🔹 INT-07.03
  test('POST falla si producto no existe', async () => {
    const res = await request(app)
      .post('/api/sales')
      .send({
        IdCliente: idCliente,
        productos: [
          { IdProducto: 99999, Cantidad: 1 }
        ]
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  // 🔹 INT-07.04
  test('GET /sales obtiene ventas', async () => {
    const res = await request(app)
      .get('/api/sales');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

});