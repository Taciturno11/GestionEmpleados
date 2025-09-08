const express = require('express');
const router = express.Router();
const { connectDB } = require('../config/database');
const { authenticateToken, isSupremeBoss } = require('../middleware/auth');

// POST - Crear feedback (solo jefe supremo)
router.post('/', authenticateToken, isSupremeBoss, async (req, res) => {
  try {
    const { tareaId, mensaje } = req.body;
    const emisor = req.user.dni; // Jefe supremo

    if (!tareaId || !mensaje) {
      return res.status(400).json({ error: 'Tarea ID y mensaje son requeridos' });
    }

    const pool = await connectDB();
    
    // Verificar que la tarea existe y obtener información del responsable
    const tareaResult = await pool.request()
      .input('tareaId', tareaId)
      .query(`
        SELECT t.*, 
               LEFT(e.Nombres, CHARINDEX(' ', e.Nombres + ' ') - 1) + ' ' + e.ApellidoPaterno as NombreResponsable
        FROM Tareas t
        LEFT JOIN PRI.Empleados e ON t.Responsable = e.DNI
        WHERE t.Id = @tareaId
      `);

    if (tareaResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    const tarea = tareaResult.recordset[0];

    // Crear feedback usando el esquema correcto
    const result = await pool.request()
      .input('tareaId', tareaId)
      .input('emisor', emisor)
      .input('mensaje', mensaje)
      .query(`
        INSERT INTO Feedback (TareaId, Emisor, Mensaje)
        VALUES (@tareaId, @emisor, @mensaje);
        SELECT SCOPE_IDENTITY() as Id;
      `);

    const feedbackId = result.recordset[0].Id;

    res.status(201).json({
      message: 'Feedback creado exitosamente',
      feedbackId,
      tarea: {
        id: tarea.Id,
        titulo: tarea.Titulo,
        responsable: tarea.Responsable,
        nombreResponsable: tarea.NombreResponsable
      }
    });

  } catch (error) {
    console.error('Error creando feedback:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Obtener feedback recibido por el usuario
router.get('/received', authenticateToken, async (req, res) => {
  try {
    const userDNI = req.user.dni;
    const pool = await connectDB();

    const result = await pool.request()
      .input('userDNI', userDNI)
      .query(`
        SELECT 
          f.Id,
          f.TareaId,
          f.Emisor,
          f.Mensaje,
          f.FechaCreacion,
          f.Leido,
          t.Titulo as TareaTitulo,
          LEFT(e.Nombres, CHARINDEX(' ', e.Nombres + ' ') - 1) + ' ' + e.ApellidoPaterno as EmisorNombre
        FROM Feedback f
        INNER JOIN Tareas t ON f.TareaId = t.Id
        LEFT JOIN PRI.Empleados e ON f.Emisor = e.DNI
        WHERE t.Responsable = @userDNI
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
    const emisor = req.user.dni;
    const pool = await connectDB();

    const result = await pool.request()
      .input('emisor', emisor)
      .query(`
        SELECT 
          f.Id,
          f.TareaId,
          f.Emisor,
          f.Mensaje,
          f.FechaCreacion,
          f.Leido,
          t.Titulo as TareaTitulo,
          t.Responsable as ReceptorDNI,
          LEFT(e.Nombres, CHARINDEX(' ', e.Nombres + ' ') - 1) + ' ' + e.ApellidoPaterno as ReceptorNombre
        FROM Feedback f
        INNER JOIN Tareas t ON f.TareaId = t.Id
        LEFT JOIN PRI.Empleados e ON t.Responsable = e.DNI
        WHERE f.Emisor = @emisor
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
    const userDNI = req.user.dni;
    const pool = await connectDB();

    const result = await pool.request()
      .input('id', id)
      .input('userDNI', userDNI)
      .query(`
        UPDATE Feedback 
        SET Leido = 1 
        WHERE Id = @id AND TareaId IN (
          SELECT Id FROM Tareas WHERE Responsable = @userDNI
        )
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
          rf.Emisor,
          rf.Mensaje,
          rf.FechaCreacion,
          rf.Leido,
          LEFT(e.Nombres, CHARINDEX(' ', e.Nombres + ' ') - 1) + ' ' + e.ApellidoPaterno as EmisorNombre
        FROM RespuestasFeedback rf
        LEFT JOIN PRI.Empleados e ON rf.Emisor = e.DNI
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
    const { mensaje } = req.body;
    const emisor = req.user.dni;

    if (!mensaje) {
      return res.status(400).json({ error: 'Mensaje es requerido' });
    }

    const pool = await connectDB();

    // Verificar que el feedback existe
    const feedbackResult = await pool.request()
      .input('feedbackId', id)
      .query('SELECT * FROM Feedback WHERE Id = @feedbackId');

    if (feedbackResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Feedback no encontrado' });
    }

    // Crear respuesta usando el esquema correcto
    const result = await pool.request()
      .input('feedbackId', id)
      .input('emisor', emisor)
      .input('mensaje', mensaje)
      .query(`
        INSERT INTO RespuestasFeedback (FeedbackId, Emisor, Mensaje)
        VALUES (@feedbackId, @emisor, @mensaje);
        SELECT SCOPE_IDENTITY() as Id;
      `);

    const respuestaId = result.recordset[0].Id;

    // Obtener la respuesta creada con el nombre del emisor
    const respuestaCreada = await pool.request()
      .input('respuestaId', respuestaId)
      .query(`
        SELECT 
          rf.Id,
          rf.FeedbackId,
          rf.Emisor,
          rf.Mensaje,
          rf.FechaCreacion,
          rf.Leido,
          LEFT(e.Nombres, CHARINDEX(' ', e.Nombres + ' ') - 1) + ' ' + e.ApellidoPaterno as EmisorNombre
        FROM RespuestasFeedback rf
        LEFT JOIN PRI.Empleados e ON rf.Emisor = e.DNI
        WHERE rf.Id = @respuestaId
      `);

    res.status(201).json(respuestaCreada.recordset[0]);

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
        FROM Feedback f
        INNER JOIN Tareas t ON f.TareaId = t.Id
        WHERE t.Responsable = @userDNI
      `;
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
