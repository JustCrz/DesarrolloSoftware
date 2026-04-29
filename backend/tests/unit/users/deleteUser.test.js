jest.mock('../../../bd', () => ({
  query: jest.fn()
}));

const pool = require('../../../bd');
const { deleteUser } = require('../../../services/users.service');

describe('Users Service - deleteUser', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test('debe eliminar usuario', async () => {
    pool.query.mockResolvedValue({ affectedRows: 1 });
    const result = await deleteUser(1);
    expect(result.message).toBe('Usuario eliminado');
  });
});
