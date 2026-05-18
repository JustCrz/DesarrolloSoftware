jest.mock('../../../bd', () => ({
  query: jest.fn()
}));

const { updateProduct } = require('../../../services/products.service');
const pool = require('../../../bd');
const fs = require('fs');

describe('UPDATE PRODUCT', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
  });

  test('debe actualizar producto correctamente', async () => {

    // SELECT imagen
    pool.query
      .mockResolvedValueOnce([[{ Imagen: null }]])
      // UPDATE producto
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const data = {
      Nombre: 'Nuevo',
      Categoria: 'Ropa',
      Descripcion: 'Desc',
      Precio: 200,
      Stock: 5
    };

    const result = await updateProduct(1, data, null);

    expect(result).toBe(true);

    expect(pool.query).toHaveBeenCalled();

  });

});