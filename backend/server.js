// backend/server.js
/**
 * @module ServerBackend
 */
require('dotenv').config(); //Local
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();
/** OrigenCondicion para determinar el ambiente de desarrollo
 * @type {string}
 */
const allowedOrigin = process.env.NODE_ENV === 'production'
  ? 'https://tiendamarjorie.unaux.com'
  : 'http://127.0.0.1:5500';

app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json()); // importante para leer req.body
app.use('/uploads', express.static('uploads'));

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * Registra los endpoints de la API y los vincula a sus routers correspondientes.
 * @param {import('express').Express} appInstance Instancia principal de Express.
 * @returns {Promise<void>}
 */
app.use('/api/products', require('./routes/products'));
app.use('/api/users', require('./routes/users'));
app.use('/api/providers', require('./routes/providers'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/pagos', require('./routes/pagos'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/auth', authRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.send('Servidor backend funcionando correctamente');
});

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
