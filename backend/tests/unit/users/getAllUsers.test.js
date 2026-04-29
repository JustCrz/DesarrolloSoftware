jest.mock('../../../bd', () => ({
  query: jest.fn()
}));

const pool = require('../../../bd');
const { getAllUsers } = require('../../../services/users.service');

describe('Users Service - getAllUsers', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test('debe retornar lista de usuarios', async () => {
    const mockUsers = [
      { IdCliente: 1, NombreC: 'Juan', Correo: 'juan@example.com' },
      { IdCliente: 2, NombreC: 'María', Correo: 'maria@example.com' }
    ];

    pool.query.mockResolvedValue([mockUsers]);

    const result = await getAllUsers();

    expect(result).toHaveLength(2);
    expect(result[0].IdCliente).toBe(1);
  });

  test('debe retornar lista vacía si no hay usuarios', async () => {
    pool.query.mockResolvedValue([[]]); // 

    const result = await getAllUsers();

    expect(result).toHaveLength(0);
  });
});