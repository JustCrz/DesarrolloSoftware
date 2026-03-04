const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, Preference } = require('mercadopago');

const client = new MercadoPagoConfig({ 
    accessToken: 'APP_USR-8119303574016133-022620-7157106c3b9c1647983526ec5268a933-3230831716' 
});

router.post('/create_preference', async (req, res) => {
  try {
    const preference = new Preference(client);

    // Definimos el cuerpo de la preferencia de forma ultra-explícita
    const preferenceData = {
      body: {
        items: req.body.items,
        back_urls: {
          success: "http://127.0.0.1:5500/frontend/index.html",
          failure: "http://127.0.0.1:5500/frontend/index.html",
          pending: "http://127.0.0.1:5500/frontend/index.html"
        },
        auto_return: "approved",
        binary_mode: true // Esto ayuda a procesar pagos de inmediato
      }
    };

    const response = await preference.create(preferenceData);

    console.log(" ¡ÉXITO! ID generado:", response.id);
    res.json({ id: response.id });

  } catch (error) {
    console.error(" ERROR CRÍTICO DE MERCADO PAGO:");
    // Esto nos dará el detalle exacto de qué campo está fallando
    if (error.response) {
        console.log("Status:", error.response.status);
        console.log("Detalle:", JSON.stringify(error.response, null, 2));
    } else {
        console.log(error);
    }
    res.status(500).json({ error: "Error al crear la preferencia" });
  }
});

module.exports = router;