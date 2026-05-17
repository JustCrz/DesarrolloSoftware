const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const salesController = require('./sales.controller'); 

/**
 * 1. Crear sesión de pago detectando ofertas
 */
async function createCheckoutSession(req, res) {
    try {
        const { items, idUsuario } = req.body;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: items.map(item => {
                const precioFinal = (item.EnPromocion == 1 && item.PrecioOferta > 0) 
                                    ? item.PrecioOferta 
                                    : item.Precio;

                return {
                    price_data: {
                        currency: 'mxn',
                        product_data: { 
                            name: item.Nombre,
                            description: item.EnPromocion == 1 ? 'Precio Especial de Oferta' : ''
                        },
                        unit_amount: Math.round(precioFinal * 100), 
                    },
                    quantity: item.Cantidad,
                };
            }),
            mode: 'payment',
            metadata: {
                items: JSON.stringify(items),
                idUsuario: idUsuario
            },
            success_url: 'http://localhost:3000/success.html',
            cancel_url: 'http://localhost:3000/cancel.html',
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error('❌ Error en Stripe Session:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * 2. Webhook para recibir notificación de éxito
 */
async function handleStripeWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('⚠️ Webhook Signature Error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        if (!session.metadata || !session.metadata.items) {
            return res.json({ received: true });
        }

        const items = JSON.parse(session.metadata.items);
        const idUsuario = session.metadata.idUsuario;

        try {
            await salesController.processSaleInternally(idUsuario, items);
        } catch (error) {
            console.error('❌ Error crítico al registrar la venta:', error);
            return res.status(500).send('Error interno al registrar la venta');
        }
    }
    res.json({ received: true });
}

// EXPORTACIÓN ÚNICA (Esto evita el ReferenceError)
module.exports = {
    createCheckoutSession,
    handleStripeWebhook
};