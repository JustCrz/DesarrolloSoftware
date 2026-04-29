jest.mock('../../../bd', () => ({
  query: jest.fn()
}));

const pool = require('../../../bd');
const bcrypt = require('bcrypt');
const { loginUser } = require('../../../services/auth.service');

jest.mock('bcrypt');

describe('Auth Service - loginUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debe autenticar usuario correctamente', async () => {
    const mockUser = {
      IdCliente: 1,
      NombreC: 'Juan Pérez',
      Correo: 'juan@example.com',
      Contraseña: 'hashedPassword'
    };

    pool.query.mockResolvedValue([[mockUser]]);
    bcrypt.compare.mockResolvedValue(true);

    const result = await loginUser('juan@example.com', 'password123');

    expect(result.IdCliente).toBe(1);
    expect(result.nombre).toBe('Juan Pérez');
    expect(result.role).toBe('cliente');
  });

  test('debe asignar rol de admin', async () => {
    const mockUser = {
      IdCliente: 2,
      NombreC: 'Admin User',
      Correo: 'admin@tienda.com',
      Contraseña: 'hashedPassword'
    };

    pool.query.mockResolvedValue([[mockUser]]);
    bcrypt.compare.mockResolvedValue(true);

    const result = await loginUser('admin@tienda.com', 'password123');
    expect(result.role).toBe('admin');
  });

  test('debe lanzar error si credenciales son vacías', async () => {
    await expect(loginUser('', '')).rejects.toThrow();
  });
});
