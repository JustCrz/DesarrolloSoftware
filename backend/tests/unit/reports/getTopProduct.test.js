jest.mock('../../../bd', () => ({
  query: jest.fn()
}));

const pool = require('../../../bd');
const { getTopProduct } = require('../../../services/reports.service');

describe('Reports Service - getTopProduct', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should retrieve top product successfully', async () => {
    const mockTopProduct = {
      productId: 101,
      productName: 'Top Seller',
      totalSold: 500,
      revenue: 25000
    };

    pool.query.mockResolvedValueOnce([[mockTopProduct]]);

    const result = await getTopProduct();

    expect(pool.query).toHaveBeenCalled();
    expect(result).toEqual(mockTopProduct);
    expect(result.totalSold).toBe(500);
  });

  test('should return top product with date range', async () => {
    const mockTopProduct = {
      productId: 102,
      productName: 'Recent Top Seller',
      totalSold: 150,
      revenue: 7500
    };

    pool.query.mockResolvedValueOnce([[mockTopProduct]]);

    const result = await getTopProduct('2024-01-01', '2024-12-31');

    expect(pool.query).toHaveBeenCalled();
    expect(result).toEqual(mockTopProduct);
  });

  test('should throw error when no sales data available', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const result = await getTopProduct();

    expect(result).toHaveProperty('prenda', 'Sin ventas registradas');
    expect(result.total_generado).toBe(0);  
  });

  test('should throw error when database query fails', async () => {
    const error = new Error('Report generation failed');
    pool.query.mockRejectedValueOnce(error);

    await expect(getTopProduct()).rejects.toThrow('Report generation failed');
  });

  test('should include revenue calculation in results', async () => {
    const mockTopProduct = {
      productId: 103,
      productName: 'Product C',
      totalSold: 200,
      revenue: 10000,
      averagePrice: 50
    };

    pool.query.mockResolvedValueOnce([[mockTopProduct]]);

    const result = await getTopProduct();

    expect(result).toHaveProperty('revenue');
    expect(result).toHaveProperty('totalSold');
    expect(result.revenue).toBe(10000);
  });
});
