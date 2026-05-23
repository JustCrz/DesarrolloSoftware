const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const salesController = require('./sales.controller'); 

async function createCheckoutSession(req, res) {
    try {
        const { items, idUsuario, latitud, longitud } = req.body;

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
                        },
                        unit_amount: Math.round(precioFinal * 100), 
                    },
                    quantity: item.Cantidad,
                };
            }),
            mode: 'payment',
            metadata: {
                items: JSON.stringify(items.map(i => ({
                    IdProducto: i.IdProducto,
                    Cantidad: i.Cantidad,
                    Precio: i.PrecioOferta > 0 && i.EnPromocion == 1 ? i.PrecioOferta : i.Precio
                }))),
                idUsuario: idUsuario,
                latitud: latitud || null,
                longitud: longitud || null
            },
           
            success_url: 'http://localhost:3000/success.html',
            cancel_url: 'http://localhost:3000/index.html', 
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error(' Error en Stripe Session:', error);
        res.status(500).json({ error: error.message });
    }
}

async function handleStripeWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(` Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }


    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
   
        const items = JSON.parse(session.metadata.items);
        const idUsuario = session.metadata.idUsuario;
        const latitud = session.metadata.latitud;
        const longitud = session.metadata.longitud;

        try {
            await salesController.processSaleInternally(idUsuario, items, latitud, longitud);
            console.log(` Venta procesada para el usuario ${idUsuario}`);
        } catch (error) {
            console.error(' Error al registrar venta en base de datos:', error);
        }
    }

    res.json({ received: true });
}

module.exports = { createCheckoutSession, handleStripeWebhook };