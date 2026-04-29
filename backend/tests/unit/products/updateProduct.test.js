jest.mock('../../../bd', () => ({
  query: jest.fn(),
  getConnection: jest.fn()
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

    const mockConnection = {
      query: jest.fn()
        .mockResolvedValueOnce([[{ Imagen: null }]]) // select imagen
        .mockResolvedValueOnce([{}])                 // update producto
        .mockResolvedValueOnce([[{ IdVariante: 1 }]]) // select variante
        .mockResolvedValueOnce([{}]),                // update variante
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };

    pool.getConnection.mockResolvedValue(mockConnection);

    const data = {
      Nombre: 'Nuevo',
      Categoria: 'Ropa',
      Descripcion: 'Desc',
      Precio: 200,
      Stock: 5
    };

    const result = await updateProduct(1, data, null);

    expect(result).toBe(true);
    expect(mockConnection.commit).toHaveBeenCalled();

  });

});