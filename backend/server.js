const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Importar rutas
const productsRoutes = require('./routes/products');
const providersRoutes = require('./routes/providers');
const usersRoutes = require('./routes/users');
const salesRoutes = require('./routes/sales');

// Usarlas
app.use('/api/products', productsRoutes);
app.use('/api/providers', providersRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/sales', salesRoutes);


app.get('/', (req, res) => {
  res.send('API de Tienda de Ropa corriendo correctamente');
});
// Iniciar servidor
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});
