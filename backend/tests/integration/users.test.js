const request = require('supertest');
const app = require('../../app');
const db = require('../../bd');

const cleanDB = require('../utils/cleanDB');
const { seedUsers } = require('../utils/seedData');

describe('Users Integration', () => {

  let idCliente;

  beforeAll(async () => {
    await cleanDB();

    // Seed inicial (para pruebas de GET y duplicados)
    idCliente = await seedUsers();
  });

  afterAll(async () => {
    await db.end();
  });

  // 🔹 INT-08.01
  test('GET /users obtiene lista de usuarios', async () => {
    const res = await request(app)
      .get('/api/users');

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBeGreaterThan(0);
  });

  // 🔹 INT-08.02
  test('POST /users/register crea usuario correctamente', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        NombreC: 'Nuevo Usuario',
        Correo: 'nuevo@test.com',
        Contraseña: '123456',
        Telefono: '1234567890',
        Direccion: 'Direccion test'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.id).toBeDefined();
  });

  // 🔹 INT-08.03
  test('POST falla si faltan campos obligatorios', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        Correo: 'fail@test.com'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  // 🔹 INT-08.04
  test('POST falla si correo ya existe', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        NombreC: 'Duplicado',
        Correo: 'test@test.com', // 👈 ya existe por seed
        Contraseña: '123456'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  // 🔹 INT-08.05
  test('DELETE elimina usuario correctamente', async () => {
    // Crear uno nuevo para eliminar
    const resCreate = await request(app)
      .post('/api/users/register')
      .send({
        NombreC: 'Eliminar Usuario',
        Correo: 'delete@test.com',
        Contraseña: '123456'
      });

    const id = resCreate.body.id;

    const resDelete = await request(app)
      .delete(`/api/users/${id}`);

    expect(resDelete.statusCode).toBe(200);
    expect(resDelete.body.ok).toBe(true);

    const [rows] = await db.query(
      'SELECT * FROM cliente WHERE IdCliente = ?',
      [id]
    );

    expect(rows.length).toBe(0);
  });

});