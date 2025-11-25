const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerDocument = require('./swagger');

const app = express();
app.use(cors());
app.use(express.json());
const specs = swaggerJsdoc({
  swaggerDefinition: swaggerDocument,
  apis: ['./swagger.js'],
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
// Rutas
app.use('/api/products', require('./routes/products'));
app.use('/api/users', require('./routes/users'));
app.use('/api/providers', require('./routes/providers'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/pagos', require('./routes/pagos'));
app.use('/api/corteCaja', require('./routes/corteCaja'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/auth', authRoutes);
app.use('/uploads', express.static('uploads'));


// Ruta raíz
app.get('/', (req, res) => {
  res.send('Servidor backend funcionando correctamente');
});

// Puerto
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Documentación Swagger en http://localhost:${PORT}/api-docs`);
});


