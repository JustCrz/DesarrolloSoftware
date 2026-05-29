/**
 * @module SalesController
 * Manejo de ventas, transacciones, stock y notificaciones para Marjorie Store
 */
const pool = require('../bd');

/**
 *  Obtener historial de todas las ventas (Para el Mapa y Panel Admin)
 */
async function getAllSales(req, res) {
    try {
        const query = `
            SELECT p.*, c.NombreC 
            FROM pedido p 
            LEFT JOIN cliente c ON p.IdCliente = c.IdCliente 
            ORDER BY p.Fecha DESC
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (err) {
        console.error("Error en getAllSales:", err);
        res.status(500).json({ ok: false, message: 'Error al obtener ventas' });
    }
}

/**
 * Obtener pedidos de un cliente específico (Vista "Mis Pedidos")
 */
async function getSalesByUser(req, res) {
    const { idCliente } = req.params; 
    try {
        const [rows] = await pool.query(
            'SELECT * FROM pedido WHERE IdCliente = ? ORDER BY Fecha DESC', 
            [idCliente]
        );
        res.json({ ok: true, sales: rows }); 
    } catch (err) {
        console.error("Error en getSalesByUser:", err);
        res.status(500).json({ ok: false, message: 'Error al obtener historial' });
    }
}

/**
 * Obtener detalle de productos de una venta específica
 */
async function getSaleDetail(req, res) {
    const { id } = req.params;
    try {
        const [rows] = await pool.query(
            `SELECT dp.Cantidad, 
                    p.Precio as PrecioUnitario, 
                    p.Nombre, p.Imagen, 
                    ped.Estado, ped.Total as TotalPedido
             FROM pedidoproducto dp 
             JOIN producto p ON dp.IdProducto = p.IdProducto 
             JOIN pedido ped ON dp.IdPedido = ped.IdPedido
             WHERE dp.IdPedido = ?`, 
            [id]
        );

        if (rows.length === 0) {
            return res.json({ ok: false, message: 'No se encontraron productos para este pedido.' });
        }

        res.json({ ok: true, detail: rows });
    } catch (err) {
        console.error("Error en getSaleDetail:", err);
        res.status(500).json({ ok: false, message: 'Error al obtener el detalle del pedido' });
    }
}

/**
 *  Crear una venta manualmente
 */
async function createSale(req, res) {
    const { IdCliente, productos } = req.body;
    try {
        if (!productos || productos.length === 0) {
            return res.status(400).json({ ok: false, message: 'No hay productos en la venta' });
        }
        
        await processSaleInternally(IdCliente, productos);
        res.json({ ok: true, message: 'Venta creada correctamente' });
    } catch (err) {
        console.error("Error al crear venta:", err.message);
        res.status(500).json({ ok: false, message: err.message });
    }
}

/**
 * Lógica interna con Transacciones SQL y Notificación al Admin
 */
async function processSaleInternally(IdCliente, productos, latitud = null, longitud = null) {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        let totalVenta = 0;
        for (let item of productos) {
            const [prodRows] = await connection.query(
                'SELECT Precio, PrecioOferta, EnPromocion, Stock, Nombre FROM producto WHERE IdProducto = ? FOR UPDATE', 
                [item.IdProducto]
            );

            if (prodRows.length === 0) throw new Error(`Producto ID ${item.IdProducto} no existe.`);
            if (prodRows[0].Stock < item.Cantidad) throw new Error(`Stock insuficiente para: ${prodRows[0].Nombre}`);

            const precioAplicado = (prodRows[0].EnPromocion == 1 && prodRows[0].PrecioOferta > 0)
                                   ? prodRows[0].PrecioOferta
                                   : prodRows[0].Precio;

            totalVenta += precioAplicado * item.Cantidad;
        }

        const [pedidoRes] = await connection.query(
            'INSERT INTO pedido (IdCliente, Fecha, Total, Estado, Latitud, Longitud) VALUES (?, NOW(), ?, ?, ?, ?)',
[IdCliente, totalVenta, '1', latitud, longitud]
        );

        const idPedido = pedidoRes.insertId;

        // NOTIFICACIÓN AL ADMIN
        await connection.query(
            'INSERT INTO notificaciones (Mensaje, Destino) VALUES (?, ?)',
            [`¡Nuevo pedido recibido! Orden #MS-${idPedido}`, 'admin']
        );

        await connection.query(
            'INSERT INTO pago (IdPedido, MetodoPago, Monto, Fecha, Estado) VALUES (?, ?, ?, NOW(), ?)',
            [idPedido, 'Stripe', totalVenta, 'Completado']
        );

        for (let item of productos) {
            await connection.query(
                'INSERT INTO pedidoproducto (IdPedido, IdProducto, Cantidad) VALUES (?, ?, ?)', 
                [idPedido, item.IdProducto, item.Cantidad]
            );
            
            await connection.query(
                'UPDATE producto SET Stock = Stock - ? WHERE IdProducto = ?', 
                [item.Cantidad, item.IdProducto]
            );
        }

        await connection.commit();
    } catch (err) {
        if (connection) await connection.rollback();
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

/**
 *  Actualizar estado de envío (Admin) con Notificación al Cliente
 */
async function updateStatus(req, res) {
    const { id } = req.params;
    const { nuevoEstado, idCliente } = req.body; 
    
    try {
        const [result] = await pool.query(
            'UPDATE pedido SET Estado = ? WHERE IdPedido = ?', 
            [nuevoEstado, id]
        );
        
        if (result.affectedRows > 0) {
            // Diccionario de estados para el mensaje
            const estados = { "1": "Pagado", "2": "Preparando", "3": "En Camino", "4": "Entregado" };
            const textoEstado = estados[nuevoEstado] || "Actualizado";

            // NOTIFICACIÓN AL CLIENTE
            await pool.query(
                'INSERT INTO notificaciones (IdUsuario, Mensaje, Destino) VALUES (?, ?, ?)',
                [idCliente, `Tu pedido #MS-${id} ahora está: ${textoEstado}`, 'cliente']
            );

            res.json({ ok: true, message: 'Estado actualizado y cliente notificado' });
        } else {
            res.status(404).json({ ok: false, message: 'Pedido no encontrado' });
        }
    } catch (err) {
        console.error("Error en updateStatus:", err);
        res.status(500).json({ ok: false, message: 'Error en servidor' });
    }
}


async function adjustStockManual(req, res) {
    const { idProducto, cantidadNueva } = req.body;
    try {
        const [result] = await pool.query(
            'UPDATE producto SET Stock = ? WHERE IdProducto = ?', 
            [cantidadNueva, idProducto]
        );
        
        if (result.affectedRows > 0) {
            res.json({ ok: true, message: 'Stock ajustado correctamente' });
        } else {
            res.status(404).json({ ok: false, message: 'Producto no encontrado' });
        }
    } catch (err) {
        console.error("Error en adjustStockManual:", err);
        res.status(500).json({ ok: false, message: 'Error al ajustar inventario' });
    }
}

module.exports = {
    getAllSales,
    getSalesByUser,
    getSaleDetail,
    createSale,
    processSaleInternally,
    updateStatus,
    adjustStockManual
};