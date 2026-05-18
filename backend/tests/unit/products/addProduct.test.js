jest.mock('../../../bd', () => ({
  query: jest.fn()
}));

const { createProduct } = require('../../../services/products.service');
const pool = require('../../../bd');

describe('ADD PRODUCT', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debe crear producto correctamente', async () => {

    pool.query.mockResolvedValueOnce([{ insertId: 1 }]);

    const data = {
      Nombre: 'Producto Test',
      Categoria: 'Ropa',
      Talla: 'M',
      Color: 'Rojo',
      Precio: 100,
      Stock: 10,
      Calificacion: 4.5,
      EnPromocion: 1,
      PrecioOferta: 80,
      FechaFinPromo: '2024-12-31'
    };

    const result = await createProduct(data, null);

    expect(result.IdProducto).toBe(1);

  });

});