const express = require('express');
const router = express.Router();
const { connectDB } = require('../config/database');
const { authenticateToken, isSupremeBoss } = require('../middleware/auth');

// GET - Obtener todas las tareas (con filtros según rol)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const pool = await connectDB();
    let query = '';

    if (req.user.isSupremeBoss) {
      // Jefe supremo ve TODAS las tareas
      query = `
        SELECT 
          t.*,
          LEFT(e.Nombres, CHARINDEX(' ', e.Nombres + ' ') - 1) + ' ' + e.ApellidoPaterno + ' ' + ISNULL(e.ApellidoMaterno, '') as NombreResponsable,
          (SELECT COUNT(*) FROM MensajesObservaciones m WHERE m.TareaId = t.Id AND m.Leido = 0 AND m.EmisorDNI != @userDNI) as MensajesNoLeidos,
          (SELECT COUNT(*) FROM MensajesObservaciones m WHERE m.TareaId = t.Id) as TotalMensajes
        FROM Tareas t
        LEFT JOIN PRI.Empleados e ON t.Responsable = e.DNI
        ORDER BY t.FechaCreacion DESC
      `;
    } else {
      // Trabajador ve SOLO sus tareas
      query = `
        SELECT 
          t.*,
          LEFT(e.Nombres, CHARINDEX(' ', e.Nombres + ' ') - 1) + ' ' + e.ApellidoPaterno + ' ' + ISNULL(e.ApellidoMaterno, '') as NombreResponsable,
          (SELECT COUNT(*) FROM MensajesObservaciones m WHERE m.TareaId = t.Id AND m.Leido = 0 AND m.EmisorDNI != @userDNI) as MensajesNoLeidos,
          (SELECT COUNT(*) FROM MensajesObservaciones m WHERE m.TareaId = t.Id) as TotalMensajes
        FROM Tareas t
        LEFT JOIN PRI.Empleados e ON t.Responsable = e.DNI
        WHERE t.Responsable = @userDNI
        ORDER BY t.FechaCreacion DESC
      `;
    }

    const result = await pool.request()
      .input('userDNI', req.user.dni)
      .query(query);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('❌ Error obteniendo tareas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Obtener estadísticas de tareas
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const pool = await connectDB();
    let query = '';

    if (req.user.isSupremeBoss) {
      // Jefe supremo ve estadísticas de TODAS las tareas
      query = `
        SELECT 
          COUNT(*) as TotalTareas,
          SUM(CASE WHEN Estado = 'Pendiente' THEN 1 ELSE 0 END) as Pendientes,
          SUM(CASE WHEN Estado = 'En Progreso' THEN 1 ELSE 0 END) as EnProgreso,
          SUM(CASE WHEN Estado = 'Terminado' THEN 1 ELSE 0 END) as Terminadas
        FROM Tareas
      `;
    } else {
      // Trabajador ve SOLO sus estadísticas
      query = `
        SELECT 
          COUNT(*) as TotalTareas,
          SUM(CASE WHEN Estado = 'Pendiente' THEN 1 ELSE 0 END) as Pendientes,
          SUM(CASE WHEN Estado = 'En Progreso' THEN 1 ELSE 0 END) as EnProgreso,
          SUM(CASE WHEN Estado = 'Terminado' THEN 1 ELSE 0 END) as Terminadas
        FROM Tareas
        WHERE Responsable = @userDNI
      `;
    }

    const result = await pool.request()
      .input('userDNI', req.user.dni)
      .query(query);

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST - Crear nueva tarea
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { titulo, responsable, fechaInicio, fechaFin, prioridad, estado, observaciones } = req.body;
    
    if (!titulo || !responsable || !fechaInicio || !fechaFin || !prioridad || !estado) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const pool = await connectDB();
    
    // Verificar que el responsable existe
    const userResult = await pool.request()
      .input('responsable', responsable)
      .query('SELECT * FROM PRI.Empleados WHERE DNI = @responsable AND CargoID IN (4, 8)');

    if (userResult.recordset.length === 0) {
      return res.status(400).json({ error: 'Responsable no encontrado' });
    }

    // Si no es jefe supremo, solo puede crear tareas para sí mismo
    if (!req.user.isSupremeBoss && responsable !== req.user.dni) {
      return res.status(403).json({ error: 'Solo puedes crear tareas para ti mismo' });
    }

    const result = await pool.request()
      .input('titulo', titulo)
      .input('responsable', responsable)
      .input('fechaInicio', fechaInicio)
      .input('fechaFin', fechaFin)
      .input('prioridad', prioridad)
      .input('estado', estado)
      .input('observaciones', observaciones || null)
      .query(`
        INSERT INTO Tareas (Titulo, Responsable, FechaInicio, FechaFin, Prioridad, Estado, Observaciones)
        VALUES (@titulo, @responsable, @fechaInicio, @fechaFin, @prioridad, @estado, @observaciones);
        SELECT SCOPE_IDENTITY() as Id;
      `);

    const newId = result.recordset[0].Id;
    
    res.status(201).json({
      message: 'Tarea creada exitosamente',
      id: newId
    });
  } catch (error) {
    console.error('❌ Error creando tarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT - Actualizar tarea
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, responsable, fechaInicio, fechaFin, prioridad, estado, observaciones } = req.body;
    
    if (!titulo || !responsable || !fechaInicio || !fechaFin || !prioridad || !estado) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const pool = await connectDB();
    
    let query = '';
    if (req.user.isSupremeBoss) {
      // Jefe supremo puede actualizar cualquier tarea
      query = `
        UPDATE Tareas 
        SET Titulo = @titulo, Responsable = @responsable, FechaInicio = @fechaInicio, FechaFin = @fechaFin, Prioridad = @prioridad, Estado = @estado, Observaciones = @observaciones
        WHERE Id = @id
      `;
    } else {
      // Trabajador solo puede actualizar sus tareas
      query = `
        UPDATE Tareas 
        SET Titulo = @titulo, FechaInicio = @fechaInicio, FechaFin = @fechaFin, Prioridad = @prioridad, Estado = @estado
        WHERE Id = @id AND Responsable = @userDNI
      `;
    }

    const result = await pool.request()
      .input('id', id)
      .input('titulo', titulo)
      .input('responsable', responsable)
      .input('fechaInicio', fechaInicio)
      .input('fechaFin', fechaFin)
      .input('prioridad', prioridad)
      .input('estado', estado)
      .input('observaciones', observaciones || null)
      .input('userDNI', req.user.dni)
      .query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada o sin permisos' });
    }

    res.json({ message: 'Tarea actualizada exitosamente' });
  } catch (error) {
    console.error('❌ Error actualizando tarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE - Eliminar tarea
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await connectDB();
    
    let query = '';
    if (req.user.isSupremeBoss) {
      // Jefe supremo puede eliminar cualquier tarea
      query = 'DELETE FROM Tareas WHERE Id = @id';
    } else {
      // Trabajador solo puede eliminar sus tareas
      query = 'DELETE FROM Tareas WHERE Id = @id AND Responsable = @userDNI';
    }
    
    const result = await pool.request()
      .input('id', id)
      .input('userDNI', req.user.dni)
      .query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada o sin permisos para eliminar' });
    }

    res.json({ message: 'Tarea eliminada exitosamente' });
  } catch (error) {
    console.error('❌ Error eliminando tarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Obtener mensajes del chat de una tarea
router.get('/:id/mensajes', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await connectDB();
    
    // Verificar que el usuario puede ver esta tarea
    let query = '';
    if (req.user.isSupremeBoss) {
      // Jefe supremo puede ver cualquier tarea
      query = 'SELECT * FROM Tareas WHERE Id = @id';
    } else {
      // Trabajador solo puede ver sus tareas
      query = 'SELECT * FROM Tareas WHERE Id = @id AND Responsable = @userDNI';
    }
    
    const tareaResult = await pool.request()
      .input('id', id)
      .input('userDNI', req.user.dni)
      .query(query);
    
    if (tareaResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    // Obtener los mensajes del chat - ESTRUCTURA SIMPLIFICADA
    const mensajesResult = await pool.request()
      .input('tareaId', id)
      .query(`
        SELECT 
          m.Id,
          m.TareaId,
          m.EmisorDNI,
          m.EmisorNombre,
          m.ReceptorDNI,
          m.ReceptorNombre,
          m.Mensaje,
          m.FechaCreacion,
          m.Leido
        FROM MensajesObservaciones m
        WHERE m.TareaId = @tareaId
        ORDER BY m.FechaCreacion ASC
      `);
    
    res.json(mensajesResult.recordset);
  } catch (error) {
    console.error('❌ Error obteniendo mensajes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST - Enviar mensaje en el chat
router.post('/:id/mensajes', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { mensaje } = req.body;
    
    console.log('🔍 BACKEND - Recibiendo mensaje:', {
      usuario: req.user.dni,
      nombre: req.user.nombre,
      isSupremeBoss: req.user.isSupremeBoss,
      mensaje: mensaje,
      tareaId: id
    });
    
    if (!mensaje || !mensaje.trim()) {
      return res.status(400).json({ error: 'El mensaje es requerido' });
    }
    
    const pool = await connectDB();
    
    // Verificar que la tarea existe y el usuario tiene acceso
    let query = '';
    if (req.user.isSupremeBoss) {
      // Jefe supremo puede enviar mensajes a cualquier tarea
      query = 'SELECT * FROM Tareas WHERE Id = @id';
    } else {
      // Trabajador solo puede enviar mensajes a sus tareas
      query = 'SELECT * FROM Tareas WHERE Id = @id AND Responsable = @userDNI';
    }
    
    const tareaResult = await pool.request()
      .input('id', id)
      .input('userDNI', req.user.dni)
      .query(query);
    
    if (tareaResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada o sin permisos' });
    }
    
    const tarea = tareaResult.recordset[0];
    let receptorDNI, receptorNombre, emisorNombre;
    
    // Obtener nombre del emisor desde PRI.Empleados
    const emisorResult = await pool.request()
      .input('emisorDNI', req.user.dni)
      .query(`
        SELECT LEFT(Nombres, CHARINDEX(' ', Nombres + ' ') - 1) + ' ' + ApellidoPaterno + ' ' + ISNULL(ApellidoMaterno, '') as NombreCompleto
        FROM PRI.Empleados 
        WHERE DNI = @emisorDNI
      `);
    
    emisorNombre = emisorResult.recordset[0]?.NombreCompleto || req.user.dni;
    
    if (req.user.isSupremeBoss) {
      // Jefe supremo envía mensaje al trabajador responsable
      receptorDNI = tarea.Responsable;
      
      // Obtener nombre del receptor (trabajador) desde PRI.Empleados
      const receptorResult = await pool.request()
        .input('receptorDNI', receptorDNI)
        .query(`
          SELECT LEFT(Nombres, CHARINDEX(' ', Nombres + ' ') - 1) + ' ' + ApellidoPaterno + ' ' + ISNULL(ApellidoMaterno, '') as NombreCompleto
          FROM PRI.Empleados 
          WHERE DNI = @receptorDNI
        `);
      
      receptorNombre = receptorResult.recordset[0]?.NombreCompleto || receptorDNI;
    } else {
      // Trabajador responde al jefe supremo
      receptorDNI = '44991089';
      
      // Obtener nombre del jefe supremo desde PRI.Empleados
      const receptorResult = await pool.request()
        .input('receptorDNI', receptorDNI)
        .query(`
          SELECT LEFT(Nombres, CHARINDEX(' ', Nombres + ' ') - 1) + ' ' + ApellidoPaterno + ' ' + ISNULL(ApellidoMaterno, '') as NombreCompleto
          FROM PRI.Empleados 
          WHERE DNI = @receptorDNI
        `);
      
      receptorNombre = receptorResult.recordset[0]?.NombreCompleto || receptorDNI;
    }
    
    console.log('🔍 BACKEND - Nombres asignados:', {
      emisorDNI: req.user.dni,
      emisorNombre: emisorNombre,
      receptorDNI: receptorDNI,
      receptorNombre: receptorNombre
    });
    
    // Insertar el mensaje con nombres directos
    const result = await pool.request()
      .input('tareaId', id)
      .input('emisorDNI', req.user.dni)
      .input('emisorNombre', emisorNombre)
      .input('receptorDNI', receptorDNI)
      .input('receptorNombre', receptorNombre)
      .input('mensaje', mensaje.trim())
      .query(`
        INSERT INTO MensajesObservaciones (TareaId, EmisorDNI, EmisorNombre, ReceptorDNI, ReceptorNombre, Mensaje)
        VALUES (@tareaId, @emisorDNI, @emisorNombre, @receptorDNI, @receptorNombre, @mensaje);
        SELECT SCOPE_IDENTITY() as Id;
      `);
    
    const mensajeId = result.recordset[0].Id;
    
    // Obtener el mensaje recién creado
    const mensajeCreado = await pool.request()
      .input('mensajeId', mensajeId)
      .query(`
        SELECT 
          m.Id,
          m.TareaId,
          m.EmisorDNI,
          m.EmisorNombre,
          m.ReceptorDNI,
          m.ReceptorNombre,
          m.Mensaje,
          m.FechaCreacion,
          m.Leido
        FROM MensajesObservaciones m
        WHERE m.Id = @mensajeId
      `);
    
    res.status(201).json(mensajeCreado.recordset[0]);
  } catch (error) {
    console.error('❌ Error enviando mensaje:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT - Marcar mensajes como leídos
router.put('/:id/mensajes/leer', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await connectDB();
    
    console.log('📖 BACKEND - Marcando mensajes como leídos:', {
      tareaId: id,
      usuario: req.user.dni,
      nombre: req.user.nombre,
      isSupremeBoss: req.user.isSupremeBoss
    });
    
    // Verificar que el usuario puede ver esta tarea
    let query = '';
    if (req.user.isSupremeBoss) {
      query = 'SELECT * FROM Tareas WHERE Id = @id';
    } else {
      query = 'SELECT * FROM Tareas WHERE Id = @id AND Responsable = @userDNI';
    }
    
    const tareaResult = await pool.request()
      .input('id', id)
      .input('userDNI', req.user.dni)
      .query(query);
    
    if (tareaResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    // Marcar mensajes como leídos
    const result = await pool.request()
      .input('tareaId', id)
      .input('userDNI', req.user.dni)
      .query(`
        UPDATE MensajesObservaciones 
        SET Leido = 1 
        WHERE TareaId = @tareaId 
        AND EmisorDNI != @userDNI 
        AND Leido = 0
      `);
    
    console.log('✅ BACKEND - Mensajes marcados como leídos:', {
      mensajesActualizados: result.rowsAffected[0],
      tareaId: id
    });
    
    res.json({ message: 'Mensajes marcados como leídos', mensajesActualizados: result.rowsAffected[0] });
  } catch (error) {
    console.error('❌ Error marcando mensajes como leídos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;