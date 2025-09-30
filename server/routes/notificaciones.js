const express = require('express');
const router = express.Router();
const { connectDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET - Obtener notificaciones del usuario
router.get('/', authenticateToken, async (req, res) => {
  try {
    const pool = await connectDB();
    
    const query = `
      SELECT 
        n.*,
        s.Titulo as SolicitudTitulo,
        s.Estado as SolicitudEstado
      FROM Notificaciones n
      LEFT JOIN SolicitudesTareas s ON n.SolicitudId = s.Id
      WHERE n.UsuarioDNI = @usuarioDNI
      ORDER BY n.FechaCreacion DESC
    `;
    
    const result = await pool.request()
      .input('usuarioDNI', req.user.dni)
      .query(query);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('❌ Error obteniendo notificaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Obtener contador de notificaciones no leídas
router.get('/no-leidas', authenticateToken, async (req, res) => {
  try {
    const pool = await connectDB();
    
    const query = `
      SELECT COUNT(*) as TotalNoLeidas
      FROM Notificaciones
      WHERE UsuarioDNI = @usuarioDNI AND Leida = 0
    `;
    
    const result = await pool.request()
      .input('usuarioDNI', req.user.dni)
      .query(query);
    
    res.json({ totalNoLeidas: result.recordset[0].TotalNoLeidas });
  } catch (error) {
    console.error('❌ Error obteniendo contador de notificaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT - Marcar notificación como leída
router.put('/:id/leer', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await connectDB();
    
    const result = await pool.request()
      .input('id', id)
      .input('usuarioDNI', req.user.dni)
      .query(`
        UPDATE Notificaciones 
        SET Leida = 1 
        WHERE Id = @id AND UsuarioDNI = @usuarioDNI
      `);
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    
    res.json({ message: 'Notificación marcada como leída' });
  } catch (error) {
    console.error('❌ Error marcando notificación como leída:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT - Marcar todas las notificaciones como leídas
router.put('/marcar-todas-leidas', authenticateToken, async (req, res) => {
  try {
    const pool = await connectDB();
    
    const result = await pool.request()
      .input('usuarioDNI', req.user.dni)
      .query(`
        UPDATE Notificaciones 
        SET Leida = 1 
        WHERE UsuarioDNI = @usuarioDNI AND Leida = 0
      `);
    
    res.json({ 
      message: 'Todas las notificaciones marcadas como leídas',
      notificacionesActualizadas: result.rowsAffected[0]
    });
  } catch (error) {
    console.error('❌ Error marcando todas las notificaciones como leídas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;

