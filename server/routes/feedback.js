const express = require('express');
const router = express.Router();
const { connectDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET - Obtener feedback de una tarea
router.get('/:tareaId', authenticateToken, async (req, res) => {
  try {
    const { tareaId } = req.params;
    const pool = await connectDB();
    
    const result = await pool.request()
      .input('tareaId', tareaId)
      .query(`
        SELECT 
          f.Id,
          f.TareaId,
          f.EmisorDNI,
          f.EmisorNombre,
          f.Mensaje,
          f.FechaCreacion,
          f.Leido
        FROM Feedback f
        WHERE f.TareaId = @tareaId
        ORDER BY f.FechaCreacion DESC
      `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('❌ Error obteniendo feedback:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST - Crear feedback
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { tareaId, mensaje } = req.body;
    
    if (!tareaId || !mensaje || !mensaje.trim()) {
      return res.status(400).json({ error: 'TareaId y mensaje son requeridos' });
    }
    
    const pool = await connectDB();
    
    // Obtener nombre del emisor
    const emisorResult = await pool.request()
      .input('emisorDNI', req.user.dni)
      .query(`
        SELECT LEFT(Nombres, CHARINDEX(' ', Nombres + ' ') - 1) + ' ' + ApellidoPaterno + ' ' + ISNULL(ApellidoMaterno, '') as NombreCompleto
        FROM PRI.Empleados 
        WHERE DNI = @emisorDNI
      `);
    
    const emisorNombre = emisorResult.recordset[0]?.NombreCompleto || req.user.dni;
    
    const result = await pool.request()
      .input('tareaId', tareaId)
      .input('emisorDNI', req.user.dni)
      .input('emisorNombre', emisorNombre)
      .input('mensaje', mensaje.trim())
      .query(`
        INSERT INTO Feedback (TareaId, EmisorDNI, EmisorNombre, Mensaje)
        VALUES (@tareaId, @emisorDNI, @emisorNombre, @mensaje);
        SELECT SCOPE_IDENTITY() as Id;
      `);
    
    const feedbackId = result.recordset[0].Id;
    
    res.status(201).json({
      message: 'Feedback creado exitosamente',
      id: feedbackId
    });
  } catch (error) {
    console.error('❌ Error creando feedback:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST - Responder a feedback
router.post('/:feedbackId/respuestas', authenticateToken, async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { mensaje } = req.body;
    
    if (!mensaje || !mensaje.trim()) {
      return res.status(400).json({ error: 'Mensaje es requerido' });
    }
    
    const pool = await connectDB();
    
    // Obtener nombre del emisor
    const emisorResult = await pool.request()
      .input('emisorDNI', req.user.dni)
      .query(`
        SELECT LEFT(Nombres, CHARINDEX(' ', Nombres + ' ') - 1) + ' ' + ApellidoPaterno + ' ' + ISNULL(ApellidoMaterno, '') as NombreCompleto
        FROM PRI.Empleados 
        WHERE DNI = @emisorDNI
      `);
    
    const emisorNombre = emisorResult.recordset[0]?.NombreCompleto || req.user.dni;
    
    const result = await pool.request()
      .input('feedbackId', feedbackId)
      .input('emisorDNI', req.user.dni)
      .input('emisorNombre', emisorNombre)
      .input('mensaje', mensaje.trim())
      .query(`
        INSERT INTO RespuestasFeedback (FeedbackId, EmisorDNI, EmisorNombre, Mensaje)
        VALUES (@feedbackId, @emisorDNI, @emisorNombre, @mensaje);
        SELECT SCOPE_IDENTITY() as Id;
      `);
    
    const respuestaId = result.recordset[0].Id;
    
    res.status(201).json({
      message: 'Respuesta creada exitosamente',
      id: respuestaId
    });
  } catch (error) {
    console.error('❌ Error creando respuesta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Obtener respuestas de un feedback
router.get('/:feedbackId/respuestas', authenticateToken, async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const pool = await connectDB();
    
    const result = await pool.request()
      .input('feedbackId', feedbackId)
      .query(`
        SELECT 
          r.Id,
          r.FeedbackId,
          r.EmisorDNI,
          r.EmisorNombre,
          r.Mensaje,
          r.FechaCreacion,
          r.Leido
        FROM RespuestasFeedback r
        WHERE r.FeedbackId = @feedbackId
        ORDER BY r.FechaCreacion ASC
      `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('❌ Error obteniendo respuestas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
