jest.mock('../../../bd', () => ({
  query: jest.fn(),
  getConnection: jest.fn()
}));
const pool = require('../../../bd');
const { getClientCart } = require('../../../services/cart.service');

describe('Cart Service - getClientCart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should retrieve client cart successfully', async () => {
    const clientId = 1;
    const mockCart = [
      { id: 1, productId: 101, quantity: 2, price: 50 },
      { id: 2, productId: 102, quantity: 1, price: 100 }
    ];

    pool.query
    .mockResolvedValueOnce([[{ IdCarrito: 1 }]]) // carrito
    .mockResolvedValueOnce([mockCart]); // productos

    const result = await getClientCart(clientId);

    expect(pool.query).toHaveBeenCalled();
    expect(result.productos).toEqual(mockCart);
  });

  test('should return empty array when client has no items in cart', async () => {
    const clientId = 2;
    pool.query.mockResolvedValueOnce([[]]);

    const result = await getClientCart(clientId);

    expect(result).toEqual([]);
  });

  test('should throw error when database query fails', async () => {
    const clientId = 1;
    const error = new Error('Database connection failed');
    pool.query.mockRejectedValueOnce(error);

    await expect(getClientCart(clientId)).rejects.toThrow('Database connection failed');
  });
});
