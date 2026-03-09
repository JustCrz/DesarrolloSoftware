require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerDocument = require('./swagger');

const app = express();

// 1. WEBHOOK ESPECIAL: Debe ir ANTES de cualquier otro middleware
// Stripe requiere el cuerpo de la petición en formato crudo para validar la firma.
app.post('/api/stripe/webhook', express.raw({type: 'application/json'}), require('./routes/stripe'));

// 2. Middlewares Globales: Se ejecutan para el resto de la aplicación
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'], credentials: true }));
app.use(express.json()); // Ahora sí, procesamos JSON para todas las demás rutas

// 3. Archivos Estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

// 4. Configuración de Swagger
const specs = swaggerJsdoc({
  swaggerDefinition: swaggerDocument,
  apis: ['./swagger.js'],
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// 5. Rutas de la API
app.use('/api/products', require('./routes/products'));
app.use('/api/users', require('./routes/users'));
app.use('/api/providers', require('./routes/providers'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/auth', require('./routes/auth'));
// Rutas de Stripe que NO son webhook (como la creación de sesión)
app.use('/api/stripe', require('./routes/stripe'));

// 6. Ruta Raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 7. Inicio del Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de Marjorie Store corriendo en http://localhost:${PORT}`);
  console.log(`📚 Documentación API: http://localhost:${PORT}/api-docs`);
});