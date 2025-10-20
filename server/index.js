const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./config/database');
const os = require('os');

const app = express();
const PORT = process.env.PORT;
const HOST = process.env.BACKEND_HOST;

// Función para obtener todas las IPs de la máquina
const getNetworkInterfaces = () => {
  const interfaces = os.networkInterfaces();
  const ips = [];
  
  Object.keys(interfaces).forEach((interfaceName) => {
    interfaces[interfaceName].forEach((iface) => {
      // Ignorar direcciones IPv6 y loopback
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push({
          interface: interfaceName,
          address: iface.address
        });
      }
    });
  });
  
  return ips;
};

// Debug: Mostrar variables de entorno
console.log('🔍 Variables de entorno cargadas:', {
  PORT: process.env.PORT,
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
  JWT_SECRET: process.env.JWT 
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
    app.listen(PORT, HOST, () => {
      const networkIPs = getNetworkInterfaces();
      
      console.log('\n🚀 Servidor corriendo en:');
      console.log('   📍 Local: http://localhost:' + PORT);
      
      if (networkIPs.length > 0) {
        console.log('\n   🌐 Red (IPs detectadas):');
        networkIPs.forEach((ip, index) => {
          const prefix = index === networkIPs.length - 1 ? '   └─' : '   ├─';
          console.log(`${prefix} http://${ip.address}:${PORT} (${ip.interface})`);
        });
      } else {
        console.log('   🌐 Red: No se detectaron IPs de red');
      }
      
      console.log('   🔧 Entorno: ' + (process.env.APP_ENV || 'development'));
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};

startServer();

