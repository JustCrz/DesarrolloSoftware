require('dotenv').config(); // <--- ESTA LÍNEA ES EL INTERRUPTOR QUE ACTIVA TU .env
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./bd'); // Importamos la conexión a la BD para las notificaciones
const app = express();

// --- MIDDLEWARES ---
const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://127.0.0.1:3000",
  "http://localhost:3000",
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
})); // Permite la comunicación con el frontend (puerto 3306)
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));


app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));
app.use(express.static(__dirname));

// --- IMPORTACIÓN DE RUTAS ---
const authRoutes = require('./routes/auth');      
const stripeRoutes = require('./routes/stripe');  
const productRoutes = require('./routes/products');
const cartRoutes    = require('./routes/cart');
const salesRoutes   = require('./routes/sales');
const providerRoutes = require('./routes/providers');
const reportRoutes  = require('./routes/reports');
const userRoutes    = require('./routes/users');
const entregasRoutes = require('./routes/entregas');

// --- CONFIGURACIÓN DE ENDPOINTS ---
app.use('/api/auth', authRoutes);         
app.use('/api/stripe', stripeRoutes);     
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/entregas', entregasRoutes);

// --- NUEVO ENDPOINT PARA NOTIFICACIONES ---
// Este endpoint alimenta la campana de clientes y administrador
app.get('/api/notificaciones/:destino/:idUsuario', async (req, res) => {
    const { destino, idUsuario } = req.params;
    try {
        let query = '';
        let params = [];

        if (destino === 'admin') {
            // El admin ve todas las notificaciones destinadas a 'admin'
            query = 'SELECT * FROM notificaciones WHERE Destino = "admin" ORDER BY Fecha DESC LIMIT 15';
        } else {
            // El cliente ve solo las suyas
            query = 'SELECT * FROM notificaciones WHERE Destino = "cliente" AND IdUsuario = ? ORDER BY Fecha DESC LIMIT 15';
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
  res.send('<h1>👗 Marjorie Store API en línea</h1>');
});
app.post('/api/notificaciones', async (req, res) => {
  const { IdUsuario, Mensaje, Destino } = req.body;
  try {
    await pool.query(
      'INSERT INTO notificaciones (IdUsuario, mensaje, Destino) VALUES (?, ?, ?)',
      [IdUsuario, Mensaje, Destino]
    );
    res.json({ ok: true });
  } catch(err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// --- LANZAMIENTO DEL SERVIDOR ---
const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor Marjorie Store corriendo en http://localhost:${PORT}`);
  console.log(`✅ Sistema de Notificaciones y Gestión de Stock activado.\n`);
});