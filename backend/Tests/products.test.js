import { describe, it, expect, vi } from 'vitest';
import pool from '../bd'; 
import * as products from '../controllers/products.controller.js';

describe('Controlador de Productos - Verificación de Mantenibilidad', () => {

  it('Debería validar el flujo utilizando un STUB para DB y un MOCK para la respuesta', async () => {
    

    const mockData = [{ IdProducto: 99, Nombre: 'Producto Stub Prueba', Precio: 100 }];
    const dbStub = vi.spyOn(pool, 'query').mockResolvedValue([mockData]);

    // --- EL MOCK ---
    const req = {}; 
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };

    // EJECUCIÓN
    await products.getAllProducts(req, res);

    // VERIFICACIÓN DEL STUB
    expect(dbStub).toHaveBeenCalled();

    // VERIFICACIÓN DEL MOCK
    const respuesta = res.json.mock.calls[0][0];
    expect(respuesta.ok).toBe(true);
    expect(respuesta.products[0].Nombre).toBe('Producto Stub Prueba');

    dbStub.mockRestore(); // Limpiamos el stub
    console.log(' Test exitoso: Stub y Mock validados correctamente.');
  });
});