const request = require('supertest');
const app = require('../../app');
const db = require('../../bd');

const cleanDB = require('../utils/cleanDB');
const { seedProviders } = require('../utils/seedData');

describe('Providers Integration', () => {

  let idProvider;

  beforeAll(async () => {
    await cleanDB();
    idProvider = await seedProviders();
  });

  afterAll(async () => {
    await db.end();
  });

  // 🔹 INT-05.01
  test('GET /providers obtiene lista de proveedores', async () => {
    const res = await request(app)
      .get('/api/providers');

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.providers)).toBe(true);
  });

  // 🔹 INT-05.02
  test('POST crea proveedor correctamente', async () => {
    const res = await request(app)
      .post('/api/providers')
      .send({
        Nombre: 'Proveedor Nuevo',
        Telefono: '9999999999',
        Correo: 'nuevo@test.com',
        Direccion: 'direccion nueva'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.id).toBeDefined();
  });

  // 🔹 INT-05.03
  test('POST falla si correo ya existe', async () => {
    const res = await request(app)
      .post('/api/providers')
      .send({
        Nombre: 'Proveedor Duplicado',
        Telefono: '1111111111',
        Correo: 'prov@test.com', // 👈 ya existe por seed
        Direccion: 'direccion'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  // 🔹 INT-05.04
  test('PUT actualiza proveedor correctamente', async () => {
    const res = await request(app)
      .put(`/api/providers/${idProvider}`)
      .send({
        Nombre: 'Proveedor Actualizado',
        Telefono: '8888888888',
        Correo: 'update@test.com',
        Direccion: 'direccion actualizada'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);

    const [rows] = await db.query(
      'SELECT Nombre FROM proveedores WHERE IdProveedor = ?',
      [idProvider]
    );

    expect(rows[0].Nombre).toBe('Proveedor Actualizado');
  });

  // 🔹 INT-05.05
  test('PUT falla si proveedor no existe', async () => {
    const res = await request(app)
      .put('/api/providers/99999')
      .send({
        Nombre: 'X',
        Telefono: '000',
        Correo: 'x@test.com',
        Direccion: 'x'
      });

    expect(res.statusCode).toBe(404); // 👈 según tu controller
    expect(res.body.ok).toBe(false);
  });

  // 🔹 INT-05.06
  test('DELETE elimina proveedor correctamente', async () => {
    const res = await request(app)
      .delete(`/api/providers/${idProvider}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);

    const [rows] = await db.query(
      'SELECT * FROM proveedores WHERE IdProveedor = ?',
      [idProvider]
    );

    expect(rows.length).toBe(0);
  });

  // 🔹 INT-05.07
  test('DELETE falla si proveedor no existe', async () => {
    const res = await request(app)
      .delete('/api/providers/99999');

    expect(res.statusCode).toBe(404);
    expect(res.body.ok).toBe(false);
  });

});