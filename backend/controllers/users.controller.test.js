const { getAllUsers, registerUser, loginUser, deleteUser } = require('./users.controller');
//pruebas en users, register y login,
const pool = require('../bd');
const bcrypt = require('bcrypt');

// --- IMPLEMENTACIÓN DE MOCKS ---
jest.mock('../bd', () => ({
  query: jest.fn(),
  getConnection: jest.fn().mockResolvedValue({
    release: jest.fn()
  })
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

describe('Pruebas del Controlador de Usuarios', () => {
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ================= PRUEBA 1 =================
  test('getAllUsers debe devolver una lista de usuarios simulada', async () => {
    const mockUsers = [
      { IdCliente: 1, NombreC: 'Juan Perez', Correo: 'juan@test.com' }
    ];
    pool.query.mockResolvedValue([mockUsers]);

    const req = {}; 
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    await getAllUsers(req, res);

    expect(res.json).toHaveBeenCalledWith({ ok: true, users: mockUsers });
    expect(pool.query).toHaveBeenCalledTimes(1);
  });
  // AQUI TERMINA LA PRUEBA 1 


  // ================= PRUEBA 2 =================
  test('registerUser debe dar error (400) si faltan datos obligatorios', async () => {
    const req = {
      body: { NombreC: 'Ana', Correo: 'ana@test.com' } // Falta Contraseña
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ 
      ok: false, 
      message: 'Nombre, correo y contraseña son obligatorios' 
    });
  });
  // AQUI TERMINA LA PRUEBA 2


  // ================= PRUEBA 3 =================
  test('loginUser debe dar error (401) si el correo no existe en la BD', async () => {
    const req = {
      body: { Correo: 'fantasma@test.com', Contraseña: '123' }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    pool.query.mockResolvedValue([[]]); // BD responde vacío

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ 
      ok: false, 
      message: 'Usuario no encontrado' 
    });
  });
  // AQUI TERMINA LA PRUEBA 3
  // ================= PRUEBA 4 =================
  test('registerUser debe dar error (400) si el correo ya está registrado', async () => {
    const req = {
      body: { NombreC: 'Carlos', Correo: 'carlos@test.com', Contraseña: '123' }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // MOCK: Simulamos que la BD busca el correo y SÍ encuentra uno repetido
    pool.query.mockResolvedValue([[{ IdCliente: 2, Correo: 'carlos@test.com' }]]);

    await registerUser(req, res);

    // Verificamos que tu código lo detecte y no lo deje registrarse
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ 
      ok: false, 
      message: 'Este correo ya está registrado' 
    });
  });
  // AQUI TERMINA LA PRUEBA 4


  // ================= PRUEBA 5 =================
  test('deleteUser debe eliminar al usuario exitosamente', async () => {
    // Simulamos que el frontend manda a borrar al usuario con el ID 5
    const req = {
      params: { id: 5 }
    };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    // MOCK: Simulamos que la base de datos ejecuta el DELETE correctamente
    pool.query.mockResolvedValue([{ affectedRows: 1 }]);

    await deleteUser(req, res);

    // Verificamos que tu código mande el mensaje de éxito
    expect(res.json).toHaveBeenCalledWith({ 
      ok: true, 
      message: 'Usuario eliminado' 
    });
    // Verificamos que tu código sí haya intentado hacer un query
    expect(pool.query).toHaveBeenCalled();
  });
  // AQUI TERMINA LA PRUEBA 5

  // ================= PRUEBA 6: Registro Exitoso =================
  test('registerUser debe registrar al usuario correctamente (201)', async () => {
    const req = {
      body: { NombreC: 'Luis', Correo: 'luis@test.com', Contraseña: '123', Telefono: '123456', Direccion: 'Calle 1' }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // 1. Simulamos que el correo NO existe (arreglo vacío)
    pool.query.mockResolvedValueOnce([[]]); 
    // 2. Simulamos que bcrypt encripta la contraseña
    bcrypt.hash.mockResolvedValue('contraseña_encriptada');
    // 3. Simulamos que el INSERT en MySQL fue exitoso y nos da el ID 10
    pool.query.mockResolvedValueOnce([{ insertId: 10 }]);

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ 
      ok: true, 
      message: 'Usuario registrado exitosamente', 
      id: 10 
    });
  });

  // ================= PRUEBA 7: Login con contraseña incorrecta =================
  test('loginUser debe dar error (401) si la contraseña es incorrecta', async () => {
    const req = {
      body: { Correo: 'luis@test.com', Contraseña: 'mal' }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Simulamos que la BD SÍ encuentra al usuario
    pool.query.mockResolvedValue([[{ IdCliente: 1, Correo: 'luis@test.com', Contraseña: 'hash' }]]);
    // Simulamos que bcrypt compara la contraseña y dice que NO coinciden (false)
    bcrypt.compare.mockResolvedValue(false);

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ ok: false, message: 'Contraseña incorrecta' });
  });

  // ================= PRUEBA 8: Login Exitoso (Protegiendo la contraseña) =================
  test('loginUser debe iniciar sesión y ocultar la contraseña', async () => {
    const req = {
      body: { Correo: 'luis@test.com', Contraseña: '123' }
    };
    const res = {
      json: jest.fn()
    };

    const usuarioSimulado = { IdCliente: 1, NombreC: 'Luis', Correo: 'luis@test.com', Contraseña: 'hash' };
    
    // La BD encuentra al usuario
    pool.query.mockResolvedValue([[usuarioSimulado]]);
    // bcrypt confirma que la contraseña es correcta (true)
    bcrypt.compare.mockResolvedValue(true);

    await loginUser(req, res);

    // Verificamos que tu código haya borrado la contraseña antes de mandarla al frontend (Línea 64 de tu controlador)
    expect(res.json).toHaveBeenCalledWith({ 
      ok: true, 
      user: { IdCliente: 1, NombreC: 'Luis', Correo: 'luis@test.com' } 
    });
  });

  // ================= PRUEBA 9: Error al eliminar por historial =================
  test('deleteUser debe dar error (500) si tiene historial de compras', async () => {
    const req = { params: { id: 1 } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // STUB: Simulamos que la BD "explota" (arroja un error por intentar borrar a alguien con compras)
    pool.query.mockRejectedValue(new Error('Constraint violation'));

    await deleteUser(req, res);

    // Verificamos que tu "catch (err)" en la línea 75 haya funcionado
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ 
      ok: false, 
      message: 'No se puede eliminar un cliente con historial de compras' 
    });
  });
  
});