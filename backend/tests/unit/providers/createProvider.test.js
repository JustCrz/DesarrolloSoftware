jest.mock('../../../bd', () => ({
  query: jest.fn()
}));

const pool = require('../../../bd');
const { createProvider } = require('../../../services/providers.service');

describe('Providers Service - createProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create provider successfully', async () => {
    const providerData = {
      Nombre: 'New Provider',
      Correo: 'new@example.com',
      Telefono: '5551234567',
      Direccion: '123 Main St'
    };

    pool.query
    .mockResolvedValueOnce([[]]) // SELECT → no existe proveedor
    .mockResolvedValueOnce([{ insertId: 1 }]); // INSERT

    const result = await createProvider(providerData);

    expect(pool.query).toHaveBeenCalled();
    expect(result).toBe(1);
  });

  test('should throw error when provider name is missing', async () => {
    const providerData = {
      Correo: 'new@example.com',
      Telefono: '5551234567'
    };

    const error = new Error('Provider name is required');
    pool.query.mockRejectedValueOnce(error);

    await expect(createProvider(providerData)).rejects.toThrow('Provider name is required');
  });

  test('should throw error when email is invalid', async () => {
    const providerData = {
      Nombre: 'New Provider',
      Correo: 'invalid-email',
      Telefono: '5551234567'
    };

    const error = new Error('Invalid email format');
    pool.query.mockRejectedValueOnce(error);

    await expect(createProvider(providerData)).rejects.toThrow('Invalid email format');
  });

  test('should throw error when duplicate email exists', async () => {
    const providerData = {
      Nombre: 'New Provider',
      Correo: 'existing@example.com',
      Telefono: '5551234567'
    };

    const error = new Error('Email already exists');
    pool.query.mockRejectedValueOnce(error);

    await expect(createProvider(providerData)).rejects.toThrow('Email already exists');
  });
});
