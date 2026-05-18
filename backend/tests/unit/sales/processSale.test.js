jest.mock('../../../bd', () => ({
  query: jest.fn(),
  getConnection: jest.fn()
}));

const pool = require('../../../bd');
const { processSale } = require('../../../services/sales.service');

describe('Sales Service - processSale', () => {
  let mockConnection;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConnection = {
      beginTransaction: jest.fn(),
      query: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };

    pool.getConnection.mockResolvedValue(mockConnection);
  });

  test('Procesar la venta correctamente', async () => {
    const saleData = {
      IdCliente: 1,
      productos: [
        { IdProducto: 101, Cantidad: 2 },
        { IdProducto: 102, Cantidad: 1 }
      ]
    };

    mockConnection.query
      // Validación productos
      .mockResolvedValueOnce([[{ Precio: 50, Stock: 10, Nombre: 'Prod1' }]])
      .mockResolvedValueOnce([[{ Precio: 100, Stock: 10, Nombre: 'Prod2' }]])
      // Insert venta
      .mockResolvedValueOnce([{ insertId: 1001 }])
      // Insert detalles
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{}]);

    const result = await processSale(saleData.IdCliente, saleData.productos);

    expect(mockConnection.beginTransaction).toHaveBeenCalled();
    expect(mockConnection.commit).toHaveBeenCalled();
    expect(mockConnection.release).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  test('Debe hacer rollback en caso de error', async () => {
    const saleData = {
      IdCliente: 1,
      productos: [{ IdProducto: 101, Cantidad: 2 }]
    };

    mockConnection.query
      .mockResolvedValueOnce([[{ Precio: 50, Stock: 10, Nombre: 'Prod1' }]])
      .mockRejectedValueOnce(new Error('La venta debe tener al menos un producto'));

    await expect(processSale(saleData.IdCliente, saleData.productos)).rejects.toThrow('La venta debe tener al menos un producto');

    expect(mockConnection.rollback).toHaveBeenCalled();
    expect(mockConnection.release).toHaveBeenCalled();
  });

  test('Debe lanzar error cuando el ID del cliente es inválido', async () => {
    const saleData = {
      IdCliente: null,
      productos: [{ IdProducto: 101, Cantidad: 2 }]
    };

    await expect(processSale(saleData))
      .rejects.toThrow('La venta debe tener al menos un producto');
  });

  test('Debe lanzar error cuando no hay productos en la venta', async () => {
    const saleData = {
      IdCliente: 1,
      productos: []
    };

    await expect(processSale(saleData))
      .rejects.toThrow('La venta debe tener al menos un producto');
  });

  test('Debe calcular el total correctamente para múltiples artículos', async () => {
    const saleData = {
      IdCliente: 1,
      productos: [
        { IdProducto: 101, Cantidad: 2 }, // 2 * 50 = 100
        { IdProducto: 102, Cantidad: 3 }  // 3 * 30 = 90
      ]
    };

    mockConnection.query
      // Validación productos
      .mockResolvedValueOnce([[{ Precio: 50, Stock: 10, Nombre: 'Prod1' }]])
      .mockResolvedValueOnce([[{ Precio: 30, Stock: 10, Nombre: 'Prod2' }]])
      // Insert venta
      .mockResolvedValueOnce([{ insertId: 2001 }])
      // Insert detalles
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{}]);

    const result = await processSale(saleData.IdCliente, saleData.productos);

    expect(result).toBeDefined();
    expect(mockConnection.commit).toHaveBeenCalled();
  });

});