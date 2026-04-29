const request = require('supertest');
const app = require('../../app');
const db = require('../../bd');

const cleanDB = require('../utils/cleanDB');
const { seedUsers } = require('../utils/seedData');

describe('Auth Integration - loginUser', () => {

  beforeAll(async () => {
    await cleanDB();
    await seedUsers();
  });

  afterAll(async () => {
    await db.end();
  });

  // (Opcional) silenciar logs de error
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('login correcto (cliente)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        correo: 'test@test.com',
        password: '123456'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toMatchObject({
      correo: 'test@test.com',
      role: 'cliente'
    });
  });

  test('login correcto (admin)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        correo: 'admin@tienda.com',
        password: '123456'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.role).toBe('admin');
  });

  test('rechaza contraseña incorrecta', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        correo: 'test@test.com',
        password: 'wrongpass'
      });

    expect(res.statusCode).toBe(401);
  });

  test('rechaza usuario inexistente', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        correo: 'noexiste@test.com',
        password: '123456'
      });

    expect(res.statusCode).toBe(404);
  });

  test('valida campos obligatorios', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.statusCode).toBe(400);
  });

});