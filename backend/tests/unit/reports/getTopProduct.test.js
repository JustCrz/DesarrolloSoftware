jest.mock('../../../bd', () => ({
  query: jest.fn()
}));

const pool = require('../../../bd');
const { getTopProduct } = require('../../../services/reports.service');

describe('Reports Service - getTopProduct', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

test('debería obtener el producto más vendido correctamente', async () => {
  const mockTopProduct = {
    prenda: 'Top Seller',
    total_vendido: 500,
    total_generado: 25000,
    unidades_vendidas: 500
  };

  pool.query.mockResolvedValueOnce([[mockTopProduct]]);

  const result = await getTopProduct();

  expect(pool.query).toHaveBeenCalled();
  expect(result).toEqual(mockTopProduct);
  expect(result.total_vendido).toBe(500);
});

test('debería obtener el producto más vendido en un rango de fechas', async () => {
  const mockTopProduct = {
    prenda: 'Recent Top Seller',
    total_vendido: 150,
    total_generado: 7500,
    unidades_vendidas: 150,
  };

  pool.query.mockResolvedValueOnce([[mockTopProduct]]);

  const result = await getTopProduct('2024-01-01', '2024-12-31');

  expect(pool.query).toHaveBeenCalled();
  expect(result).toEqual(mockTopProduct);
});

  test('debe mostrar error cuando no hay ventas registradas', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const result = await getTopProduct();

    expect(result).toHaveProperty('prenda', 'Sin ventas registradas');
    expect(result.total_generado).toBe(0);  
  });

  test('debe lanzar error cuando la consulta a la base de datos falla', async () => {
    const error = new Error('Report generation failed');
    pool.query.mockRejectedValueOnce(error);

    await expect(getTopProduct()).rejects.toThrow('Report generation failed');
  });

  test('debe incluir el cálculo de ingresos en los resultados', async () => {
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
