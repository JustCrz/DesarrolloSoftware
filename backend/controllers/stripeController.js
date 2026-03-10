const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const salesController = require('./sales.controller');
const pool = require('../bd');

// 1. Crear sesión de pago y pasar metadatos
exports.createCheckoutSession = async (req, res) => {
    try {
        const { items, idUsuario } = req.body;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: items.map(item => ({
                price_data: {
                    currency: 'mxn',
                    product_data: { name: item.Nombre },
                    unit_amount: Math.round(item.Precio * 100),
                },
                quantity: item.Cantidad,
            })),
            mode: 'payment',
            // --- AQUÍ PASAMOS LOS DATOS AL WEBHOOK ---
            metadata: {
                items: JSON.stringify(items),
                idUsuario: idUsuario
            },
            success_url: 'http://localhost:3000/success.html',
            cancel_url: 'http://localhost:3000/cancel.html',
        });

        res.json({ id: session.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. Webhook para recibir notificación de éxito y descontar stock
exports.handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // Validación de firma de seguridad de Stripe
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Cuando el pago es procesado exitosamente
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // Recuperamos los datos que enviamos desde el frontend
        const itemsRaw = session.metadata?.items;
        const idUsuario = session.metadata?.idUsuario;

        if (!itemsRaw || !idUsuario) {
            console.error('Faltan metadatos en la sesión de Stripe:', session.id);
            return res.status(400).send('Metadata incompleta en la sesión');
        }

        const items = JSON.parse(itemsRaw);

        console.log('✅ Pago recibido, iniciando actualización de inventario...');
        
        try {
            // Llamamos a tu lógica de ventas para descontar stock en MySQL
            const { idPedido, totalVenta } = await salesController.processSaleInternally(idUsuario, items);
            console.log('📦 Inventario actualizado correctamente.');

            // Registrar pago en la tabla de pagos si aún no existe
            const [existing] = await pool.query(
                'SELECT IdPago FROM pago WHERE IdPedido = ? LIMIT 1',
                [idPedido]
            );

            if (existing.length === 0) {
                const paymentDate = session.created ? new Date(session.created * 1000) : new Date();
                await pool.query(
                    'INSERT INTO pago (IdPedido, MetodoPago, Monto, Fecha, Estado) VALUES (?, ?, ?, ?, ?)',
                    [idPedido, 'Stripe', totalVenta, paymentDate, 'Pagado']
                );
                await pool.query(
                    'UPDATE pedido SET Estado = ? WHERE IdPedido = ?',
                    ['Pagado', idPedido]
                );
                console.log('✅ Pago registrado en la tabla pago.');
            } else {
                console.log('ℹ️ Pago ya registrado para el pedido:', idPedido);
            }
        } catch (error) {
            console.error('❌ Error fatal al actualizar base de datos:', error);
            return res.status(500).send('Error interno en la BD');
        }
    }

    res.json({ received: true });
};
