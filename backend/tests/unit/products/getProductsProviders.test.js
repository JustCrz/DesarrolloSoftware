jest.mock('../../../bd', () => ({
  query: jest.fn()
}));

const { getProductsProviders } = require('../../../services/products.service');
const pool = require('../../../bd');

describe('GET PRODUCTS WITH PROVIDERS', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debe devolver productos con proveedores', async () => {

    pool.query.mockResolvedValue([
    [
        {
          Nombre: 'Producto Test',
          Categoria: 'Ropa',
          Talla: 'M',
          Color: 'Rojo',
          Precio: 100,
          Stock: 10,
          Imagen: 'test.jpg',
          IdProveedor: 1,
          NombreProveedor: 'Proveedor Test'
        }
      ]
    ]);

    const result = await getProductsProviders();

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('Proveedores');
  });

});