jest.mock('../../../bd', () => ({
  query: jest.fn(),
  getConnection: jest.fn()
}));

const { getProductsProviders } = require('../../../services/products.service');
const pool = require('../../../bd');

describe('GET PRODUCTS WITH PROVIDERS', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debe devolver productos con proveedores', async () => {

    pool.query.mockResolvedValue({
      rows: [
        {
          IdProducto: 1,
          Nombre: 'Producto 1',
          Categoria: 'Ropa',
          Descripcion: 'Desc',
          Imagen: null,
          IdVariante: 1,
          SKU: 'SKU1',
          Talla: 'M',
          Color: 'Rojo',
          Precio: 100,
          Stock: 10,
          IdProveedor: 1,
          NombreProveedor: 'Nike'
        }
      ]
    });

    const result = await getProductsProviders();

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('Proveedores');
  });

});