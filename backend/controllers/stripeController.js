const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const salesController = require('./sales.controller'); 

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
        const items = JSON.parse(session.metadata.items);
        const idUsuario = session.metadata.idUsuario;

        console.log(' Pago recibido, iniciando actualización de inventario...');
        
        try {
            await salesController.processSaleInternally(idUsuario, items);
            console.log(' Inventario actualizado correctamente.');
        } catch (error) {
            console.error(' Error fatal al actualizar base de datos:', error);
            return res.status(500).send('Error interno en la BD');
        }
    }

    res.json({ received: true });
};