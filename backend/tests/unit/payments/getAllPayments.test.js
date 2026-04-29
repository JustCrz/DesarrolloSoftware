jest.mock('../../../bd', () => ({
  query: jest.fn()
}));

const pool = require('../../../bd');
const { getAllPayments } = require('../../../services/payments.service');

describe('Payments Service - getAllPayments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should retrieve all payments successfully', async () => {
    const mockPayments = [
      { id: 1, saleId: 101, amount: 250, method: 'credit_card', status: 'completed', date: '2024-01-15' },
      { id: 2, saleId: 102, amount: 150, method: 'debit_card', status: 'completed', date: '2024-01-16' }
    ];

    pool.query.mockResolvedValueOnce([mockPayments]);

    const result = await getAllPayments();

    expect(pool.query).toHaveBeenCalled();
    expect(result).toEqual(mockPayments);
    expect(result.length).toBe(2);
  });

  test('should retrieve payments filtered by status', async () => {
    const mockPayments = [
      { id: 1, saleId: 101, amount: 250, method: 'credit_card', status: 'pending', date: '2024-01-15' }
    ];

    pool.query.mockResolvedValueOnce([mockPayments]);

    const result = await getAllPayments('pending');

    expect(pool.query).toHaveBeenCalled();
    expect(result).toEqual(mockPayments);
    expect(result[0].status).toBe('pending');
  });

  test('should return empty array when no payments exist', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const result = await getAllPayments();

    expect(result).toEqual([]);
  });

  test('should throw error when database query fails', async () => {
    const error = new Error('Database connection failed');
    pool.query.mockRejectedValueOnce(error);

    await expect(getAllPayments()).rejects.toThrow('Database connection failed');
  });

  test('should include payment method information', async () => {
    const mockPayments = [
      { 
        id: 1, 
        saleId: 101, 
        amount: 250, 
        method: 'credit_card', 
        status: 'completed', 
        date: '2024-01-15',
        cardLastFour: '1234'
      }
    ];

    pool.query.mockResolvedValueOnce([mockPayments]);

    const result = await getAllPayments();

    expect(result[0]).toHaveProperty('method');
    expect(result[0]).toHaveProperty('amount');
    expect(result[0]).toHaveProperty('status');
    expect(result[0].method).toBe('credit_card');
  });

  test('should retrieve payments with date range', async () => {
    const mockPayments = [
      { id: 1, saleId: 101, amount: 250, method: 'credit_card', status: 'completed', date: '2024-01-15' }
    ];

    pool.query.mockResolvedValueOnce([mockPayments]);

    const result = await getAllPayments(null, '2024-01-01', '2024-01-31');

    expect(pool.query).toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});
