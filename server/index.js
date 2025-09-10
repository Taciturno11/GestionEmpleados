const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const LOCAL_IP = process.env.LOCAL_IP || 'localhost';
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;
const API_BASE_URL = process.env.API_BASE_URL || `${SERVER_URL}/api`;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tareas', require('./routes/tareas'));
app.use('/api/feedback', require('./routes/feedback'));

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
    app.listen(PORT, HOST, () => {
      console.log('🚀 Servidor corriendo en:');
      console.log('   📍 Local: http://localhost:' + PORT);
      console.log('   🌐 Red: ' + SERVER_URL);
      console.log('📊 API disponible en:');
      console.log('   📍 Local: http://localhost:' + PORT + '/api');
      console.log('   🌐 Red: ' + API_BASE_URL);
      console.log('🔐 Auth: ' + API_BASE_URL + '/auth');
      console.log('💬 Feedback: ' + API_BASE_URL + '/feedback');
      console.log('📋 Tareas: ' + API_BASE_URL + '/tareas');
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};

startServer();

