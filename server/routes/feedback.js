const express = require('express');
const router = express.Router();
const { connectDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET - Obtener feedback semanal del empleado
router.get('/semanal', authenticateToken, async (req, res) => {
  try {
    const pool = await connectDB();
    const { semana } = req.query;
    const empleadoDNI = req.user.dni;

    // Si no se especifica semana, usar la semana actual
    let semanaInicio;
    if (semana) {
      semanaInicio = new Date(semana);
    } else {
      const hoy = new Date();
      const diaSemana = hoy.getDay();
      const lunes = new Date(hoy);
      lunes.setDate(hoy.getDate() - diaSemana + 1);
      semanaInicio = lunes;
    }

    const domingo = new Date(semanaInicio);
    domingo.setDate(semanaInicio.getDate() + 6);

    const result = await pool.request()
      .input('empleadoDNI', empleadoDNI)
      .input('semanaInicio', semanaInicio.toISOString().split('T')[0])
      .query(`
        SELECT * FROM FeedbackSemanal 
        WHERE EmpleadoDNI = @empleadoDNI 
        AND SemanaInicio = @semanaInicio
      `);

    if (result.recordset.length > 0) {
      res.json(result.recordset[0]);
    } else {
      // Crear feedback vacío para la semana
      const nuevoFeedback = {
        EmpleadoDNI: empleadoDNI,
        SemanaInicio: semanaInicio.toISOString().split('T')[0],
        SemanaFin: domingo.toISOString().split('T')[0],
        Empezar: '',
        Dejar: '',
        Mantener: '',
        Estado: 'Borrador'
      };

      res.json(nuevoFeedback);
    }
  } catch (error) {
    console.error('Error obteniendo feedback semanal:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST - Crear/actualizar feedback semanal
router.post('/semanal', authenticateToken, async (req, res) => {
  try {
    const pool = await connectDB();
    const { semanaInicio, semanaFin, empezar, dejar, mantener, estado } = req.body;
    const empleadoDNI = req.user.dni;

    // Verificar si ya existe feedback para esta semana
    const existe = await pool.request()
      .input('empleadoDNI', empleadoDNI)
      .input('semanaInicio', semanaInicio)
      .query(`
        SELECT Id FROM FeedbackSemanal 
        WHERE EmpleadoDNI = @empleadoDNI 
        AND SemanaInicio = @semanaInicio
      `);

    if (existe.recordset.length > 0) {
      // Actualizar feedback existente
      await pool.request()
        .input('id', existe.recordset[0].Id)
        .input('empezar', empezar || '')
        .input('dejar', dejar || '')
        .input('mantener', mantener || '')
        .input('estado', estado || 'Borrador')
        .input('fechaUltimaEdicion', new Date().toISOString())
        .query(`
          UPDATE FeedbackSemanal 
          SET Empezar = @empezar, 
              Dejar = @dejar, 
              Mantener = @mantener, 
              Estado = @estado,
              FechaUltimaEdicion = @fechaUltimaEdicion
          WHERE Id = @id
        `);

      res.json({ message: 'Feedback actualizado exitosamente' });
    } else {
      // Crear nuevo feedback
      await pool.request()
        .input('empleadoDNI', empleadoDNI)
        .input('semanaInicio', semanaInicio)
        .input('semanaFin', semanaFin)
        .input('empezar', empezar || '')
        .input('dejar', dejar || '')
        .input('mantener', mantener || '')
        .input('estado', estado || 'Borrador')
        .query(`
          INSERT INTO FeedbackSemanal 
          (EmpleadoDNI, SemanaInicio, SemanaFin, Empezar, Dejar, Mantener, Estado)
          VALUES (@empleadoDNI, @semanaInicio, @semanaFin, @empezar, @dejar, @mantener, @estado)
        `);

      res.json({ message: 'Feedback creado exitosamente' });
    }
  } catch (error) {
    console.error('Error guardando feedback semanal:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT - Enviar feedback al jefe
router.put('/semanal/enviar', authenticateToken, async (req, res) => {
  try {
    const pool = await connectDB();
    const { semanaInicio } = req.body;
    const empleadoDNI = req.user.dni;

    await pool.request()
      .input('empleadoDNI', empleadoDNI)
      .input('semanaInicio', semanaInicio)
      .input('fechaEnvio', new Date().toISOString())
      .query(`
        UPDATE FeedbackSemanal 
        SET Estado = 'Enviado', FechaEnvio = @fechaEnvio
        WHERE EmpleadoDNI = @empleadoDNI 
        AND SemanaInicio = @semanaInicio
      `);

    res.json({ message: 'Feedback enviado al jefe exitosamente' });
  } catch (error) {
    console.error('Error enviando feedback:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Obtener feedback del equipo (solo para jefe supremo)
router.get('/equipo', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isSupremeBoss) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const pool = await connectDB();
    const { semana } = req.query;
    
    // Si no se especifica semana, usar la semana actual
    let semanaInicio;
    if (semana) {
      semanaInicio = new Date(semana);
    } else {
      const hoy = new Date();
      const diaSemana = hoy.getDay();
      const lunes = new Date(hoy);
      lunes.setDate(hoy.getDate() - diaSemana + 1);
      semanaInicio = lunes;
    }

    const result = await pool.request()
      .input('semanaInicio', semanaInicio.toISOString().split('T')[0])
      .query(`
        SELECT 
          f.*,
          e.Nombres,
          e.ApellidoPaterno,
          e.ApellidoMaterno,
          LEFT(e.Nombres, CHARINDEX(' ', e.Nombres + ' ') - 1) + ' ' + e.ApellidoPaterno + ' ' + ISNULL(e.ApellidoMaterno, '') as NombreCompleto
        FROM FeedbackSemanal f
        INNER JOIN PRI.Empleados e ON f.EmpleadoDNI = e.DNI
        WHERE f.SemanaInicio = @semanaInicio
        ORDER BY f.FechaEnvio DESC, e.Nombres
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error obteniendo feedback del equipo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT - Comentar feedback (solo para jefe supremo)
router.put('/:id/comentar', authenticateToken, async (req, res) => {
  try {
    if (!req.user.isSupremeBoss) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const pool = await connectDB();
    const { id } = req.params;
    const { comentario } = req.body;

    await pool.request()
      .input('id', id)
      .input('comentario', comentario)
      .query(`
        UPDATE FeedbackSemanal 
        SET ComentarioJefe = @comentario, Estado = 'Revisado'
        WHERE Id = @id
      `);

    res.json({ message: 'Comentario agregado exitosamente' });
  } catch (error) {
    console.error('Error comentando feedback:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;