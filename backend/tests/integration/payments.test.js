const request = require('supertest');
const app = require('../../app'); // ajusta si tu entry es distinto
const db = require('../../bd');

const cleanDB = require('../utils/cleanDB');
const { seedUsers } = require('../utils/seedData');
const { seedPedido } = require('../utils/seedData');

describe('Payments Integration', () => {

  let idCliente;
  let idPedido;

  beforeAll(async () => {
    await cleanDB();
    const users = await seedUsers();
    console.log('USERS:', users);

    // asumiendo que el primero es cliente
    idCliente = users;

    idPedido = await seedPedido(idCliente);
  });

  afterAll(async () => {
    await db.end();
  });

  // 🔹 INT-03.01
  test('POST registra pago correctamente (actualiza pedido)', async () => {
    const res = await request(app)
      .post('/api/payments')
      .send({ IdPedido: idPedido });

    expect(res.statusCode).toBe(201);
    expect(res.body.ok).toBe(true);

    const [rows] = await db.query(
      'SELECT Estado FROM pedido WHERE IdPedido = ?',
      [idPedido]
    );

    expect(rows[0].Estado).toBe('Pagado');
  });

  // 🔹 INT-03.02
  test('GET /payments incluye pedido pagado', async () => {
    const res = await request(app)
      .get('/api/payments');

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);

    const pedidos = res.body.pagos;

    const existe = pedidos.find(p => p.IdPedido === idPedido);

    expect(existe).toBeDefined();
    expect(existe.Estado).toBe('Pagado');
  });

  // 🔹 INT-03.03
  test('GET /payments/:idPedido obtiene pago por pedido', async () => {
    const res = await request(app)
      .get(`/api/payments/${idPedido}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);

    expect(res.body.pagos.length).toBeGreaterThan(0);
    expect(res.body.pagos[0].IdPedido).toBe(idPedido);
  });

  // 🔹 INT-03.04
  test('POST falla si falta IdPedido', async () => {
    const res = await request(app)
      .post('/api/payments')
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  // 🔹 INT-03.05
  test('POST falla si pedido no existe', async () => {
    const res = await request(app)
      .post('/api/payments')
      .send({ IdPedido: 99999 });

    expect(res.statusCode).toBe(404);
    expect(res.body.ok).toBe(false);
  });

});