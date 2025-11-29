// backend/server.js
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const pool = require('./bd'); // Conexión a MySQL
const authRoutes = require('./routes/auth');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerDocument = require('./swagger');

const app = express();

// Middleware
app.use(cors({
  origin: 'https://tiendamarjorie.unaux.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json()); // importante para leer req.body
app.use('/uploads', express.static('uploads'));

// Swagger
const specs = swaggerJsdoc({
  swaggerDefinition: swaggerDocument,
  apis: ['./swagger.js'],
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Rutas existentes
app.use('/api/products', require('./routes/products'));
app.use('/api/users', require('./routes/users'));
app.use('/api/providers', require('./routes/providers'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/pagos', require('./routes/pagos'));
app.use('/api/corteCaja', require('./routes/corteCaja'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/auth', authRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.send('Servidor backend funcionando correctamente');
});

// Puerto
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Documentación Swagger en http://localhost:${PORT}/api-docs`);
});
