jest.mock('../../../bd', () => ({
  query: jest.fn()
}));

const pool = require('../../../bd');
const { getAllProviders } = require('../../../services/providers.service');

describe('Providers Service - getAllProviders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should retrieve all providers successfully', async () => {
    const mockProviders = [
      { id: 1, name: 'Provider A', email: 'provider_a@example.com', phone: '5551234567' },
      { id: 2, name: 'Provider B', email: 'provider_b@example.com', phone: '5559876543' }
    ];

    pool.query.mockResolvedValueOnce([mockProviders]);

    const result = await getAllProviders();

    expect(pool.query).toHaveBeenCalled();
    expect(result).toEqual(mockProviders);
    expect(result.length).toBe(2);
  });

  test('should return empty array when no providers exist', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const result = await getAllProviders();

    expect(result).toEqual([]);
  });

  test('should throw error when database query fails', async () => {
    const error = new Error('Database connection error');
    pool.query.mockRejectedValueOnce(error);

    await expect(getAllProviders()).rejects.toThrow('Database connection error');
  });

  test('should return providers with all required fields', async () => {
    const mockProviders = [
      { id: 1, name: 'Provider A', email: 'provider_a@example.com', phone: '5551234567', status: 'active' }
    ];

    pool.query.mockResolvedValueOnce([mockProviders]);

    const result = await getAllProviders();

    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('name');
    expect(result[0]).toHaveProperty('email');
    expect(result[0]).toHaveProperty('phone');
  });
});
