jest.mock('../../../bd', () => ({
  query: jest.fn()
}));

const pool = require('../../../bd');
const { getAllProducts } = require('../../../services/products.service');

describe('Products Service', () => {

  test('Debe conseguir a todos los productos disponibles', async () => {
  const mockRows = [
    {
      IdProducto: 1,
      Nombre: 'Pantallon',
      Categoria: 'Ropa',
      Imagen: 'img2.jpg',
      Talla: 'M',
      Color: 'Rojo',
      Precio: 100,
      Stock: 5,
      Calificacion: 4.0,
      EnPromocion: false,
      PrecioOferta: null,
      FechaFinPromo: null
    },
    {
      IdProducto: 2,
      Nombre: 'Playera',
      Categoria: 'Ropa',
      Imagen: 'img1.jpg',
      Talla: 'L',
      Color: 'Azul',
      Precio: 110,
      Stock: 3,
      Calificacion: 4.5,
      EnPromocion: true,
      PrecioOferta: 90,
      FechaFinPromo: '2024-12-31'
    },
  ];

  pool.query.mockResolvedValue([mockRows]);

  const result = await getAllProducts();

  // Validaciones
  expect(result.length).toBe(2);

  expect(result[0].IdProducto).toBe(1);
  });
})