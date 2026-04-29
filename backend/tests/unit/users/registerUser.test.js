jest.mock('../../../bd', () => ({
  query: jest.fn()
}));

const pool = require('../../../bd');
const bcrypt = require('bcrypt');
const { registerUser } = require('../../../services/users.service');

jest.mock('bcrypt');

describe('Users Service - registerUser', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test('debe registrar nuevo usuario', async () => {
    pool.query
  .mockResolvedValueOnce([[]]) // SELECT (no existe usuario)
  .mockResolvedValueOnce([{ insertId: 1 }]); // INSERT 

    bcrypt.hash.mockResolvedValue('hashedPassword');

    const userData = {
      NombreC: 'Juan',
      Correo: 'juan@example.com',
      passwordRaw: 'pass123'
    };

    const result = await registerUser(userData);

    expect(result.id).toBe(1);
  });

  test('debe rechazar si correo existe', async () => {
    pool.query.mockResolvedValueOnce([[{ IdCliente: 1 }]]);

    const userData = {
      NombreC: 'Juan',
      Correo: 'juan@example.com',
      passwordRaw: 'pass123'
    };

    await expect(registerUser(userData))
      .rejects.toThrow('ya está registrado');
  });
});