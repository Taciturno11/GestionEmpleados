const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./config/database');

const app = express();
const PORT = process.env.PORT;

// Debug: Mostrar variables de entorno
console.log('🔍 Variables de entorno cargadas:', {
  PORT: process.env.PORT,
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
  JWT_SECRET: process.env.JWT_SECRET ? 'Configurado' : 'No configurado'
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tareas', require('./routes/tareas'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/solicitudes', require('./routes/solicitudes'));
app.use('/api/notificaciones', require('./routes/notificaciones'));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: 'Sistema de Gestión de Tareas - Partner Design Thinking',
    version: '1.0.0',
    status: 'running'
  });
});

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Iniciar servidor
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 Servidor corriendo en:');
      console.log('   📍 Local: http://localhost:' + PORT);
      console.log('   🌐 Red: http://10.182.18.74:' + PORT);
      console.log('📊 API disponible en:');
      console.log('   📍 Local: http://localhost:' + PORT + '/api');
      console.log('   🌐 Red: http://10.182.18.74:' + PORT + '/api');
      console.log('🔐 Auth: http://10.182.18.74:' + PORT + '/api/auth');
      console.log('💬 Feedback: http://10.182.18.74:' + PORT + '/api/feedback');
      console.log('📋 Tareas: http://10.182.18.74:' + PORT + '/api/tareas');
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};

startServer();

