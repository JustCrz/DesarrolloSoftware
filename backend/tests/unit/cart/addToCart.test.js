jest.mock('../../../bd', () => ({
  query: jest.fn(),
  getConnection: jest.fn()
}));
const pool = require('../../../bd');
const { addToCart } = require('../../../services/cart.service');

describe('Cart Service - addToCart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should add item to cart successfully', async () => {
    const clientId = 1;
    const productId = 101;
    const quantity = 2;

  pool.query
  .mockResolvedValueOnce([[]]) // no hay carrito
  .mockResolvedValueOnce([{ insertId: 1 }]) // se crea carrito
  .mockResolvedValueOnce([[]]) // producto NO existe
  .mockResolvedValueOnce([{}]) // INSERT producto
  .mockResolvedValueOnce([[{ Total: 100 }]]) // SUM
  .mockResolvedValueOnce([{}]); // UPDATE carrito

    const result = await addToCart(clientId, productId, quantity);

    expect(pool.query).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  test('should update quantity when product already in cart', async () => {
    pool.query
    .mockResolvedValueOnce([[{ IdCarrito: 1 }]]) // SELECT carrito
    .mockResolvedValueOnce([[{ IdVariante: 101 }]]) // producto YA existe
    .mockResolvedValueOnce([{}]) // UPDATE cantidad
    .mockResolvedValueOnce([[{ Total: 150 }]]) // SUM
    .mockResolvedValueOnce([{}]); // UPDATE carrito

    const result = await addToCart(1, 101, 3);
    
    expect(pool.query).toHaveBeenCalled();
    expect(typeof result).toBe('number');
});
});
