const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/tareas', require('./routes/tareas'));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: 'Partner Design Thinking API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      feedback: '/api/feedback',
      tareas: '/api/tareas'
    }
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal!' });
});

app.listen(PORT, () => {
  console.log('🚀 Servidor corriendo en http://localhost:' + PORT);
  console.log('📊 API disponible en http://localhost:' + PORT + '/api');
  console.log('🔐 Auth: http://localhost:' + PORT + '/api/auth');
  console.log('💬 Feedback: http://localhost:' + PORT + '/api/feedback');
  console.log('📋 Tareas: http://localhost:' + PORT + '/api/tareas');
});
