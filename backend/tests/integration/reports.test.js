const request = require('supertest');
const app = require('../../app');
const db = require('../../bd');

const cleanDB = require('../utils/cleanDB');
const { seedUsers, seedPedido, seedProviders, seedProducts, seedPedidoProducto } = require('../utils/seedData');

describe('Reports Integration', () => {

  let idCliente;
  let idPedido;

  beforeAll(async () => {
    await cleanDB();

    idCliente = await seedUsers();
    idPedido = await seedPedido(idCliente);
  });

  afterAll(async () => {
    await db.end();
  });

  // 🔹 INT-06.01
  test('GET /reports/daily-summary retorna resumen del día', async () => {
    const res = await request(app)
      .get('/api/reports/daily-summary');

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);

    expect(res.body.datos).toHaveProperty('total_pedidos');
    expect(res.body.datos).toHaveProperty('ingresos_sucios');
  });

  // 🔹 INT-06.02
  test('GET /reports/sales-by-date retorna ventas por fecha', async () => {
    const today = new Date().toISOString().split('T')[0];

    const res = await request(app)
      .get(`/api/reports/sales-by-date?fecha=${today}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);

    expect(Array.isArray(res.body.ventasDetalle)).toBe(true);
  });

  test('GET /reports/top-product obtiene producto más vendido', async () => {
  const idProveedor = await seedProviders();
  const idProducto = await seedProducts(idProveedor);
  const idCliente = await seedUsers();
  const idPedido = await seedPedido(idCliente);

  await seedPedidoProducto(idPedido, idProducto);

  const res = await request(app)
    .get('/api/reports/top-product');

  expect(res.statusCode).toBe(200);
  expect(res.body.ok).toBe(true);

  expect(res.body.producto.prenda).toBe('Producto Test');
  expect(res.body.producto.unidades_vendidas).toBeGreaterThan(0);
});
});