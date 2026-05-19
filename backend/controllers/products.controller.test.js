const { getAllProducts, getProductsWithProviders, addProduct, updateProduct, deleteProduct } = require('./products.controller');
const pool = require('../bd');
const fs = require('fs');

// --- MOCK DE LA BASE DE DATOS ---
jest.mock('../bd', () => ({
  query: jest.fn(),
  getConnection: jest.fn().mockResolvedValue({
    release: jest.fn()
  })
}));

// --- NUEVO MOCK: Sistema de archivos (Para no borrar fotos reales) ---
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  unlinkSync: jest.fn()
}));

describe('Pruebas del Controlador de Productos', () => {
  
  // Limpiar espías antes de cada prueba
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ================= PRUEBA 1: getAllProducts =================
  test('getAllProducts debe devolver todos los productos (Catálogo público)', async () => {
    const req = {};
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    
    // STUB: Simulamos un producto en la base de datos
    pool.query.mockResolvedValue([[{ IdProducto: 1, Nombre: 'Playera Negra' }]]);

    await getAllProducts(req, res);

    expect(res.json).toHaveBeenCalledWith({ ok: true, products: [{ IdProducto: 1, Nombre: 'Playera Negra' }] });
  });

  // ================= PRUEBA 2: getProductsWithProviders =================
  test('getProductsWithProviders debe devolver productos con su proveedor', async () => {
    const req = {};
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    
    pool.query.mockResolvedValue([[{ IdProducto: 1, Nombre: 'Tenis', NombreProveedor: 'Nike' }]]);

    await getProductsWithProviders(req, res);

    expect(res.json).toHaveBeenCalledWith({ ok: true, products: [{ IdProducto: 1, Nombre: 'Tenis', NombreProveedor: 'Nike' }] });
  });

  // ================= PRUEBA 3: addProduct (Error por falta de datos) =================
  test('addProduct debe dar error (400) si faltan datos obligatorios', async () => {
    const req = { 
      body: { Nombre: 'Gorra' } // Omitimos Precio y Stock
    }; 
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await addProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ ok: false, message: 'Nombre, Precio y Stock son obligatorios' });
  });

  // ================= PRUEBA 4: addProduct (Registro Exitoso) =================
  test('addProduct debe registrar el producto con su imagen (201)', async () => {
    const req = { 
      body: { Nombre: 'Gorra', Categoria: 'Accesorios', Precio: 200, Stock: 50 },
      file: { filename: 'foto_gorra.jpg' } // Simulamos Multer
    }; 
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    // Simulamos que el INSERT fue exitoso y nos da el ID 5
    pool.query.mockResolvedValueOnce([{ insertId: 5 }]);

    await addProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      message: 'Producto creado exitosamente',
      product: { IdProducto: 5, Nombre: 'Gorra', Imagen: 'foto_gorra.jpg' }
    });
  });

  // ================= PRUEBA 5: updateProduct (Reemplazar imagen) =================
  test('updateProduct debe actualizar los datos y borrar la imagen vieja', async () => {
    const req = { 
      params: { id: 1 },
      body: { Nombre: 'Playera Editada', Categoria: 'Ropa', Precio: 250, Stock: 10 },
      file: { filename: 'nueva_foto.jpg' } // Viene una foto nueva
    }; 
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    // 1. Simulamos el SELECT que busca la imagen vieja
    pool.query.mockResolvedValueOnce([[{ Imagen: 'vieja_foto.jpg' }]]);
    // 2. Simulamos el UPDATE
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    
    // MOCK FS: Simulamos que la foto vieja SÍ existe en la computadora
    fs.existsSync.mockReturnValue(true);

    await updateProduct(req, res);

    // Verificamos que tu código haya mandado a borrar la foto física
    expect(fs.unlinkSync).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ ok: true, message: 'Producto actualizado' });
  });

  // ================= PRUEBA 6: deleteProduct (Borrado exitoso) =================
  test('deleteProduct debe borrar el registro de la BD y la imagen física', async () => {
    const req = { params: { id: 2 } }; 
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    // 1. SELECT de la imagen
    pool.query.mockResolvedValueOnce([[{ Imagen: 'foto_a_borrar.jpg' }]]);
    // 2. DELETE exitoso
    pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    
    fs.existsSync.mockReturnValue(true);

    await deleteProduct(req, res);

    expect(fs.unlinkSync).toHaveBeenCalled(); // Verifica que se borró el archivo
    expect(res.json).toHaveBeenCalledWith({ ok: true, message: 'Producto e imagen eliminados correctamente' });
  });

  // ================= PRUEBA 7: deleteProduct (Producto no encontrado) =================
  test('deleteProduct debe devolver 404 si el ID no existe', async () => {
    const req = { params: { id: 999 } }; // ID que no existe
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    // 1. SELECT no encuentra foto
    pool.query.mockResolvedValueOnce([[]]);
    // 2. DELETE no afecta ninguna fila
    pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

    await deleteProduct(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ ok: false, message: 'Producto no encontrado' });
  });
});
