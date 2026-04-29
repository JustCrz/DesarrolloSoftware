jest.mock('../../../bd', () => ({
  query: jest.fn(),
  getConnection: jest.fn()
}));

const { removeProduct } = require('../../../services/products.service');
const pool = require('../../../bd');
const fs = require('fs');

describe('DELETE PRODUCT', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
  });

  test('debe eliminar producto', async () => {

    pool.query
      .mockResolvedValueOnce([[{ Imagen: null }]]) // select imagen
      .mockResolvedValueOnce([{}])                 // delete variantes
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // delete producto

    const result = await removeProduct(1);

    expect(result).toBe(true);
  });

});