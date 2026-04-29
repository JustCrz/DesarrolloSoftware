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

  test('should process sale successfully with transaction', async () => {
    const saleData = {
      clientId: 1,
      productos: [
        { IdVariante: 101, Cantidad: 2 },
        { IdVariante: 102, Cantidad: 1 }
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

    const result = await processSale(saleData);

    expect(mockConnection.beginTransaction).toHaveBeenCalled();
    expect(mockConnection.commit).toHaveBeenCalled();
    expect(mockConnection.release).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  test('should rollback transaction on failure', async () => {
    const saleData = {
      clientId: 1,
      productos: [{ IdVariante: 101, Cantidad: 2 }]
    };

    mockConnection.query
      .mockResolvedValueOnce([[{ Precio: 50, Stock: 10, Nombre: 'Prod1' }]])
      .mockRejectedValueOnce(new Error('Transaction failed'));

    await expect(processSale(saleData)).rejects.toThrow('Transaction failed');

    expect(mockConnection.rollback).toHaveBeenCalled();
    expect(mockConnection.release).toHaveBeenCalled();
  });

  test('should throw error when client ID is invalid', async () => {
    const saleData = {
      clientId: null,
      productos: [{ IdVariante: 101, Cantidad: 2 }]
    };

    await expect(processSale(saleData))
      .rejects.toThrow('Invalid client ID');
  });

  test('should throw error when sale items are empty', async () => {
    const saleData = {
      clientId: 1,
      productos: []
    };

    await expect(processSale(saleData))
      .rejects.toThrow('Sale must have at least one item');
  });

  test('should calculate total correctly for multiple items', async () => {
    const saleData = {
      clientId: 1,
      productos: [
        { IdVariante: 101, Cantidad: 2 }, // 2 * 50 = 100
        { IdVariante: 102, Cantidad: 3 }  // 3 * 30 = 90
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

    const result = await processSale(saleData);

    expect(result).toBeDefined();
    expect(mockConnection.commit).toHaveBeenCalled();
  });

});