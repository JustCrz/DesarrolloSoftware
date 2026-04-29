const request = require('supertest');
const app = require('../../app');
const db = require('../../bd');

const cleanDB = require('../utils/cleanDB');
const {
  seedUsers,
  seedProviders,
  seedProducts
} = require('../utils/seedData');

describe('Cart Integration', () => {

  let idCliente;
  let idProducto;

  beforeEach(async () => {
    await cleanDB();

    idCliente = await seedUsers();
    const idProveedor = await seedProviders();
    idProducto = await seedProducts(idProveedor);
  });

  afterAll(async () => {
    await db.end();
  });

  test('GET carrito vacío', async () => {
    const res = await request(app)
      .get(`/api/cart/${idCliente}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.carrito).toEqual([]);
  });

  test('POST agrega producto', async () => {
    const res = await request(app)
      .post(`/api/cart/${idCliente}`)
      .send({
        idProducto,
        cantidad: 2
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('POST acumula cantidad', async () => {
    await request(app)
      .post(`/api/cart/${idCliente}`)
      .send({ idProducto, cantidad: 1 });

    const res = await request(app)
      .post(`/api/cart/${idCliente}`)
      .send({ idProducto, cantidad: 3 });

    expect(res.statusCode).toBe(200);
  });

  test('PUT actualiza cantidad', async () => {
    await request(app)
      .post(`/api/cart/${idCliente}`)
      .send({ idProducto, cantidad: 1 });

    const res = await request(app)
      .put(`/api/cart/${idCliente}`)
      .send({
        idProducto,
        cantidad: 5
      });

    expect(res.statusCode).toBe(200);
  });

  test('PUT elimina si cantidad es 0', async () => {
    await request(app)
      .post(`/api/cart/${idCliente}`)
      .send({ idProducto, cantidad: 1 });

    const res = await request(app)
      .put(`/api/cart/${idCliente}`)
      .send({
        idProducto,
        cantidad: 0
      });

    expect(res.statusCode).toBe(200);
  });

  test('DELETE elimina producto', async () => {
    await request(app)
      .post(`/api/cart/${idCliente}`)
      .send({ idProducto, cantidad: 1 });

    const res = await request(app)
      .delete(`/api/cart/${idCliente}/${idProducto}`);

    expect(res.statusCode).toBe(200);
  });

  test('DELETE vacía carrito', async () => {
    await request(app)
      .post(`/api/cart/${idCliente}`)
      .send({ idProducto, cantidad: 2 });

    const res = await request(app)
      .delete(`/api/cart/${idCliente}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Carrito vaciado');
  });

  test('PUT falla si carrito no existe', async () => {
    const res = await request(app)
      .put(`/api/cart/999`)
      .send({
        idProducto: 1,
        cantidad: 2
      });

    expect(res.statusCode).toBe(404);
  });

});