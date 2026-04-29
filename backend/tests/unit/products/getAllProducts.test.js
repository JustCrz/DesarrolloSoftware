jest.mock('../../../bd', () => ({
  query: jest.fn()
}));

const pool = require('../../../bd');
const { getAllProducts } = require('../../../services/products.service');

describe('Products Service', () => {

  test('debe agrupar múltiples productos con sus variantes', async () => {
  const mockRows = [
    // Producto 1 con 2 variantes
    {
      IdProducto: 1,
      Nombre: 'Playera',
      Categoria: 'Ropa',
      Descripcion: 'Algodón',
      Imagen: 'img1.jpg',
      IdVariante: 10,
      SKU: 'SKU1',
      Talla: 'M',
      Color: 'Rojo',
      Precio: 100,
      Stock: 5
    },
    {
      IdProducto: 1,
      Nombre: 'Playera',
      Categoria: 'Ropa',
      Descripcion: 'Algodón',
      Imagen: 'img1.jpg',
      IdVariante: 11,
      SKU: 'SKU2',
      Talla: 'L',
      Color: 'Azul',
      Precio: 110,
      Stock: 3
    },
  ];

  pool.query.mockResolvedValue({ rows: mockRows });

  const result = await getAllProducts();

  // Validaciones
  expect(result.length).toBe(1);

  // Producto 1
  expect(result[0].IdProducto).toBe(1);
  expect(result[0].Variantes.length).toBe(2);
  });
})