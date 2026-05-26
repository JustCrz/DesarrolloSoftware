require('dotenv').config(); // <--- ESTA LÍNEA ES EL INTERRUPTOR QUE ACTIVA TU .env
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./bd'); // Importamos la conexión a la BD para las notificaciones
const { authenticate, requireRole, requireSelfOrAdmin } = require('./middleware/auth');
const app = express();

// --- MIDDLEWARES ---
const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "https://marjoriestore.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("No permitido por CORS"));
    }
  },
  credentials: true
})); // Permite la comunicación con el frontend (puerto 5500)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));
app.use(express.static(__dirname));

// --- IMPORTACIÓN DE RUTAS ---
const authRoutes = require('./routes/auth');
const stripeRoutes = require('./routes/stripe');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const salesRoutes = require('./routes/sales');
const providerRoutes = require('./routes/providers');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');

// --- CONFIGURACIÓN DE ENDPOINTS ---
app.use('/api/auth', authRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);

// --- NUEVO ENDPOINT PARA NOTIFICACIONES ---
// Este endpoint alimenta la campana de clientes y administrador
app.get('/api/notificaciones/:destino/:idUsuario', authenticate, (req, res, next) => {
  if (req.params.destino === 'admin') {
    return requireRole('admin')(req, res, next);
  }

  return requireSelfOrAdmin('idUsuario')(req, res, next);
}, async (req, res) => {
  const { destino, idUsuario } = req.params;
  try {
    let query = '';
    let params = [];

    if (destino === 'admin') {
      // El admin ve todas las notificaciones destinadas a 'admin'
      query = 'SELECT * FROM notificaciones WHERE destino = "admin" ORDER BY fecha DESC LIMIT 15';
    } else {
      // El cliente ve solo las suyas
      query = 'SELECT * FROM notificaciones WHERE destino = "cliente" AND id_usuario = ? ORDER BY fecha DESC LIMIT 15';
      params.push(idUsuario);
    }

    const [rows] = await pool.query(query, params);
    res.json({ ok: true, notificaciones: rows });
  } catch (err) {
    console.error("Error al obtener notificaciones:", err);
    res.status(500).json({ ok: false, message: 'Error en el servidor' });
  }
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('<h1>Marjorie Store API en línea</h1>');
});

// --- LANZAMIENTO DEL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\nServidor Marjorie Store corriendo en http://localhost:${PORT}`);
  console.log(`Sistema de Notificaciones y Gestión de Stock activado.\n`);
  console.log('Base de datos:', process.env.DB_NAME);
});
