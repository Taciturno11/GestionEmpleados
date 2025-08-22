const express = require('express');
const router = express.Router();
const { connectDB } = require('../config/database');
const { authenticateToken, isSupremeBoss } = require('../middleware/auth');

// POST - Crear feedback (solo jefe supremo)
router.post('/', authenticateToken, isSupremeBoss, async (req, res) => {
  try {
    const { tareaId, receptorDNI, comentario } = req.body;
    const emisorDNI = req.user.dni; // Jefe supremo

    if (!tareaId || !receptorDNI || !comentario) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const pool = await connectDB();
    
    // Verificar que la tarea existe
    const tareaResult = await pool.request()
      .input('tareaId', tareaId)
      .query('SELECT * FROM Tareas WHERE Id = @tareaId');

    if (tareaResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    // Verificar que el receptor existe
    const receptorResult = await pool.request()
      .input('receptorDNI', receptorDNI)
      .query('SELECT * FROM PRI.Empleados WHERE DNI = @receptorDNI AND CargoID IN (4, 8)');

    if (receptorResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario receptor no encontrado' });
    }

    // Crear feedback
    const result = await pool.request()
      .input('tareaId', tareaId)
      .input('emisorDNI', emisorDNI)
      .input('receptorDNI', receptorDNI)
      .input('comentario', comentario)
      .query(`
        INSERT INTO Feedback (TareaId, EmisorDNI, ReceptorDNI, Comentario)
        VALUES (@tareaId, @emisorDNI, @receptorDNI, @comentario);
        SELECT SCOPE_IDENTITY() as Id;
      `);

    const feedbackId = result.recordset[0].Id;

    res.status(201).json({
      message: 'Feedback creado exitosamente',
      feedbackId
    });

  } catch (error) {
    console.error('Error creando feedback:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Obtener feedback recibido por el usuario
router.get('/received', authenticateToken, async (req, res) => {
  try {
    const receptorDNI = req.user.dni;
    const pool = await connectDB();

    const result = await pool.request()
      .input('receptorDNI', receptorDNI)
      .query(`
        SELECT 
          f.Id,
          f.TareaId,
          f.EmisorDNI,
          f.ReceptorDNI,
          f.Comentario,
          f.FechaCreacion,
          f.Leido,
          t.Titulo as TareaTitulo,
          e.Nombre as EmisorNombre
        FROM Feedback f
        INNER JOIN Tareas t ON f.TareaId = t.Id
        INNER JOIN PRI.Empleados e ON f.EmisorDNI = e.DNI
        WHERE f.ReceptorDNI = @receptorDNI
        ORDER BY f.FechaCreacion DESC
      `);

    res.json(result.recordset);

  } catch (error) {
    console.error('Error obteniendo feedback recibido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Obtener feedback enviado por el jefe supremo
router.get('/sent', authenticateToken, isSupremeBoss, async (req, res) => {
  try {
    const emisorDNI = req.user.dni;
    const pool = await connectDB();

    const result = await pool.request()
      .input('emisorDNI', emisorDNI)
      .query(`
        SELECT 
          f.Id,
          f.TareaId,
          f.EmisorDNI,
          f.ReceptorDNI,
          f.Comentario,
          f.FechaCreacion,
          f.Leido,
          t.Titulo as TareaTitulo,
          e.Nombre as ReceptorNombre
        FROM Feedback f
        INNER JOIN Tareas t ON f.TareaId = t.Id
        INNER JOIN PRI.Empleados e ON f.ReceptorDNI = e.DNI
        WHERE f.EmisorDNI = @emisorDNI
        ORDER BY f.FechaCreacion DESC
      `);

    res.json(result.recordset);

  } catch (error) {
    console.error('Error obteniendo feedback enviado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT - Marcar feedback como leído
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const receptorDNI = req.user.dni;
    const pool = await connectDB();

    const result = await pool.request()
      .input('id', id)
      .input('receptorDNI', receptorDNI)
      .query(`
        UPDATE Feedback 
        SET Leido = 1 
        WHERE Id = @id AND ReceptorDNI = @receptorDNI
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Feedback no encontrado' });
    }

    res.json({ message: 'Feedback marcado como leído' });

  } catch (error) {
    console.error('Error marcando feedback como leído:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Obtener respuestas de un feedback específico
router.get('/:id/responses', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await connectDB();

    const result = await pool.request()
      .input('feedbackId', id)
      .query(`
        SELECT 
          rf.Id,
          rf.FeedbackId,
          rf.EmisorDNI,
          rf.Comentario,
          rf.FechaCreacion,
          rf.Leido,
          e.Nombre as EmisorNombre
        FROM RespuestasFeedback rf
        INNER JOIN PRI.Empleados e ON rf.EmisorDNI = e.DNI
        WHERE rf.FeedbackId = @feedbackId
        ORDER BY rf.FechaCreacion ASC
      `);

    res.json(result.recordset);

  } catch (error) {
    console.error('Error obteniendo respuestas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST - Crear respuesta a un feedback
router.post('/:id/responses', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { comentario } = req.body;
    const emisorDNI = req.user.dni;

    if (!comentario) {
      return res.status(400).json({ error: 'Comentario es requerido' });
    }

    const pool = await connectDB();

    // Verificar que el feedback existe
    const feedbackResult = await pool.request()
      .input('feedbackId', id)
      .query('SELECT * FROM Feedback WHERE Id = @feedbackId');

    if (feedbackResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Feedback no encontrado' });
    }

    // Crear respuesta
    const result = await pool.request()
      .input('feedbackId', id)
      .input('emisorDNI', emisorDNI)
      .input('comentario', comentario)
      .query(`
        INSERT INTO RespuestasFeedback (FeedbackId, EmisorDNI, Comentario)
        VALUES (@feedbackId, @emisorDNI, @comentario);
        SELECT SCOPE_IDENTITY() as Id;
      `);

    const respuestaId = result.recordset[0].Id;

    res.status(201).json({
      message: 'Respuesta creada exitosamente',
      respuestaId
    });

  } catch (error) {
    console.error('Error creando respuesta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Obtener estadísticas de feedback
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const pool = await connectDB();
    const userDNI = req.user.dni;

    let query = '';
    let params = {};

    if (req.user.isSupremeBoss) {
      // Jefe supremo ve estadísticas de todos
      query = `
        SELECT 
          COUNT(*) as TotalFeedback,
          SUM(CASE WHEN Leido = 0 THEN 1 ELSE 0 END) as NoLeidos,
          SUM(CASE WHEN Leido = 1 THEN 1 ELSE 0 END) as Leidos
        FROM Feedback
      `;
    } else {
      // Usuario regular ve solo sus estadísticas
      query = `
        SELECT 
          COUNT(*) as TotalFeedback,
          SUM(CASE WHEN Leido = 0 THEN 1 ELSE 0 END) as NoLeidos,
          SUM(CASE WHEN Leido = 1 THEN 1 ELSE 0 END) as Leidos
        FROM Feedback
        WHERE ReceptorDNI = @userDNI
      `;
      params = { userDNI };
    }

    const result = await pool.request()
      .input('userDNI', userDNI)
      .query(query);

    res.json(result.recordset[0]);

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
