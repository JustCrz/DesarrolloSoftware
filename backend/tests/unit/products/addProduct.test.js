jest.mock('../../../bd', () => ({
  query: jest.fn(),
  getConnection: jest.fn()
}));

const { createProduct } = require('../../../services/products.service');
const pool = require('../../../bd');

describe('ADD PRODUCT', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debe crear producto correctamente', async () => {

    const mockConnection = {
      query: jest.fn()
        .mockResolvedValueOnce([{ insertId: 1 }]) // insert producto
        .mockResolvedValueOnce([{}]),             // insert variante
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };

    pool.getConnection.mockResolvedValue(mockConnection);

    const data = {
      Nombre: 'Producto Test',
      Categoria: 'Ropa',
      Descripcion: 'Desc',
      Precio: 100,
      Stock: 10
    };

    const result = await createProduct(data, null);

    expect(result.IdProducto).toBe(1);
    expect(mockConnection.commit).toHaveBeenCalled();

  });

});