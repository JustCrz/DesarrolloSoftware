/**
 * @module ProvidersController
 * Gestión de proveedores para Marjorie Store
 */
const pool = require('../bd');

/**
 * Obtener todos los proveedores registrados
 */
async function getProviders(req, res) {
    try {
        const sql = 'SELECT * FROM proveedores';
        const [rows] = await pool.query(sql);
        res.json({ ok: true, providers: rows });
    } catch (err) {
        console.error("Error en getProviders:", err);
        res.status(500).json({ ok: false, message: 'Error al obtener proveedores' });
    }
}

/**
 * Registrar un nuevo proveedor
 */
async function addProvider(req, res) {
    const { Nombre, Telefono, Correo, Direccion } = req.body;
    const Logo = req.file ? req.file.filename : null; 
    
    try {
        // 1. Validar si el correo ya existe (para evitar duplicados en producción)
        if (Correo) {
            const [existing] = await pool.query(
                'SELECT * FROM proveedores WHERE Correo = ?',
                [Correo]
            );

            if (existing.length > 0) {
                return res.status(400).json({ ok: false, message: 'El correo ya está registrado' });
            }
        }

        // 2. Insertar nuevo proveedor
        const [result] = await pool.query(
            'INSERT INTO proveedores (Nombre, Telefono, Correo, Direccion, Logo) VALUES (?, ?, ?, ?, ?)',
            [Nombre, Telefono || null, Correo || null, Direccion || null, Logo]
        );

        res.status(201).json({ 
            ok: true, 
            message: 'Proveedor registrado correctamente',
            id: result.insertId 
        });
    } catch (err) {
        console.error("Error en addProvider:", err);
        res.status(500).json({ ok: false, message: 'Error al registrar proveedor' });
    }
}

/**
 * Eliminar un proveedor por ID
 */
async function deleteProvider(req, res) {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM proveedores WHERE IdProveedor = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, message: 'Proveedor no encontrado' });
        }

        res.json({ ok: true, message: 'Proveedor eliminado exitosamente' });
    } catch (err) {
        console.error("Error en deleteProvider:", err);
        res.status(500).json({ ok: false, message: 'Error al eliminar proveedor' });
    }
}

/**
 * Actualizar datos de un proveedor 
 */
async function updateProvider(req, res) {
    const { id } = req.params;
    const { Nombre, Telefono, Correo, Direccion } = req.body;
    try {
        const [result] = await pool.query(
            'UPDATE proveedores SET Nombre=?, Telefono=?, Correo=?, Direccion=? WHERE IdProveedor=?',
            [Nombre, Telefono, Correo, Direccion, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, message: 'Proveedor no encontrado para actualizar' });
        }

        res.json({ ok: true, message: 'Proveedor actualizado correctamente' });
    } catch (err) {
        console.error("Error en updateProvider:", err);
        res.status(500).json({ ok: false, message: 'Error al actualizar proveedor' });
    }
}

// Exportación limpia para las rutas
module.exports = {
    getProviders,
    addProvider,
    deleteProvider,
    updateProvider
};