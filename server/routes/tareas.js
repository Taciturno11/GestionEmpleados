const express = require('express');
const router = express.Router();
const { connectDB, sql } = require('../config/database');
const { authenticateToken, isSupremeBoss } = require('../middleware/auth');

// GET - Obtener todas las tareas (con filtros según rol)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const pool = await connectDB();
    let query = '';
    let params = {};

    if (req.user.isSupremeBoss) {
      // Jefe supremo ve todas las tareas
      query = `
        SELECT 
          t.*,
          LEFT(e.Nombres, CHARINDEX(' ', e.Nombres + ' ') - 1) + ' ' + e.ApellidoPaterno + ' ' + ISNULL(e.ApellidoMaterno, '') as NombreResponsable,
          (SELECT COUNT(*) FROM MensajesObservaciones m WHERE m.TareaId = t.Id AND m.Leido = 0 AND m.Emisor != @userDNI) as MensajesNoLeidos,
          (SELECT COUNT(*) FROM MensajesObservaciones m WHERE m.TareaId = t.Id) as TotalMensajes
        FROM Tareas t
        LEFT JOIN PRI.Empleados e ON t.Responsable = e.DNI
        ORDER BY t.FechaFin ASC
      `;
    } else {
      // Usuario regular ve solo sus tareas (por responsable)
      query = `
        SELECT 
          t.*,
          LEFT(e.Nombres, CHARINDEX(' ', e.Nombres + ' ') - 1) + ' ' + e.ApellidoPaterno + ' ' + ISNULL(e.ApellidoMaterno, '') as NombreResponsable,
          (SELECT COUNT(*) FROM MensajesObservaciones m WHERE m.TareaId = t.Id AND m.Leido = 0 AND m.Emisor != @userDNI) as MensajesNoLeidos,
          (SELECT COUNT(*) FROM MensajesObservaciones m WHERE m.TareaId = t.Id) as TotalMensajes
        FROM Tareas t
        LEFT JOIN PRI.Empleados e ON t.Responsable = e.DNI
        WHERE t.Responsable = @userDNI 
        ORDER BY t.FechaFin ASC
      `;
      params = { userDNI: req.user.dni };
    }

    const result = await pool.request()
      .input('userDNI', req.user.dni)
      .query(query);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error obteniendo tareas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Obtener reporte de empleados con tareas pendientes (solo jefe supremo)
// IMPORTANTE: Esta ruta debe estar ANTES de /:id para evitar conflictos
router.get('/reporte-empleados', authenticateToken, isSupremeBoss, async (req, res) => {
  try {
    const pool = await connectDB();
    
    const result = await pool.request()
      .query(`
        SELECT 
          e.DNI,
          LEFT(e.Nombres, CHARINDEX(' ', e.Nombres + ' ') - 1) + ' ' + e.ApellidoPaterno + ' ' + ISNULL(e.ApellidoMaterno, '') as Nombre,
          CASE 
            WHEN e.DNI = '44991089' THEN 'Jefe Supremo'
            WHEN e.CargoID = 8 THEN 'Jefe'
            WHEN e.CargoID = 4 THEN 'Analista'
            ELSE 'Otro'
          END as Rol,
          COUNT(t.Id) as TareasPendientes,
          STRING_AGG(
            '{"Id":' + CAST(t.Id AS VARCHAR) + ',"Titulo":"' + t.Titulo + '","FechaFin":"' + CAST(t.FechaFin AS VARCHAR) + '"}',
            ','
          ) WITHIN GROUP (ORDER BY t.FechaFin) as TareasJSON
        FROM PRI.Empleados e
        LEFT JOIN Tareas t ON e.DNI = t.Responsable AND t.Estado = 'Pendiente'
        WHERE e.CargoID IN (4, 8) AND e.EstadoEmpleado = 'Activo'
        GROUP BY e.DNI, e.Nombres, e.ApellidoPaterno, e.ApellidoMaterno, e.CargoID
        HAVING COUNT(t.Id) > 0
        ORDER BY TareasPendientes DESC, e.Nombres ASC
      `);

    // Procesar las tareas JSON para cada empleado
    const reporte = result.recordset.map(empleado => {
      let tareas = [];
      if (empleado.TareasJSON) {
        try {
          // Convertir el string JSON a array de objetos
          const tareasArray = empleado.TareasJSON.split(',').map(tareaStr => {
            const tareaObj = {};
            tareaStr.replace(/"([^"]+)":([^,}]+)/g, (match, key, value) => {
              tareaObj[key] = value.replace(/"/g, '');
            });
            return tareaObj;
          });
          tareas = tareasArray;
        } catch (error) {
          console.error('Error parsing tareas JSON:', error);
          tareas = [];
        }
      }

      return {
        DNI: empleado.DNI,
        Nombre: empleado.Nombre.trim(),
        Rol: empleado.Rol,
        TareasPendientes: empleado.TareasPendientes,
        Tareas: tareas
      };
    });

    res.json(reporte);
  } catch (error) {
    console.error('Error obteniendo reporte de empleados:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Obtener estadísticas de tareas
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const pool = await connectDB();
    let query = '';
    let params = {};

    if (req.user.isSupremeBoss) {
      // Jefe supremo ve estadísticas de todas las tareas
      query = `
        SELECT 
          COUNT(*) as TotalTareas,
          SUM(CASE WHEN Estado = 'Pendiente' THEN 1 ELSE 0 END) as Pendientes,
          SUM(CASE WHEN Estado = 'En Progreso' THEN 1 ELSE 0 END) as EnProgreso,
          SUM(CASE WHEN Estado = 'Terminado' THEN 1 ELSE 0 END) as Terminadas
        FROM Tareas
      `;
    } else {
      // Usuario regular ve solo sus estadísticas
      query = `
        SELECT 
          COUNT(*) as TotalTareas,
          SUM(CASE WHEN Estado = 'Pendiente' THEN 1 ELSE 0 END) as Pendientes,
          SUM(CASE WHEN Estado = 'En Progreso' THEN 1 ELSE 0 END) as EnProgreso,
          SUM(CASE WHEN Estado = 'Terminado' THEN 1 ELSE 0 END) as Terminadas
        FROM Tareas
        WHERE Responsable = @userDNI
      `;
      params = { userDNI: req.user.dni };
    }

    const result = await pool.request()
      .input('userDNI', req.user.dni)
      .query(query);

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Obtener tarea por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await connectDB();
    
    let query = '';
    let params = { id };

    if (req.user.isSupremeBoss) {
      // Jefe supremo puede ver cualquier tarea
      query = 'SELECT * FROM Tareas WHERE Id = @id';
    } else {
      // Usuario regular solo puede ver sus tareas
      query = 'SELECT * FROM Tareas WHERE Id = @id AND Responsable = @userDNI';
      params = { id, userDNI: req.user.dni };
    }

    const result = await pool.request()
      .input('id', id)
      .input('userDNI', req.user.dni)
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error obteniendo tarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST - Crear nueva tarea (jefe supremo y analistas)
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
    console.error('Error creando tarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT - Actualizar tarea
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, responsable, fechaInicio, fechaFin, prioridad, estado, observaciones } = req.body;
    
    console.log('🔄 Actualizando tarea:', { id, titulo, responsable, observaciones });
    console.log('📥 Body completo recibido:', req.body);
    console.log('👤 Usuario:', req.user.dni, 'isSupremeBoss:', req.user.isSupremeBoss);
    
    if (!titulo || !responsable || !fechaInicio || !fechaFin || !prioridad || !estado) {
      console.log('❌ Campos faltantes:', { titulo, responsable, fechaInicio, fechaFin, prioridad, estado });
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const pool = await connectDB();
    
    let query = '';
    let params = { id, titulo, responsable, fechaInicio, fechaFin, prioridad, estado };

    if (req.user.isSupremeBoss) {
      // Jefe supremo puede actualizar cualquier tarea
      query = `
        UPDATE Tareas 
        SET Titulo = @titulo, Responsable = @responsable, FechaInicio = @fechaInicio, FechaFin = @fechaFin, Prioridad = @prioridad, Estado = @estado, Observaciones = @observaciones
        WHERE Id = @id
      `;
      console.log('👑 Jefe Supremo actualizando tarea con observaciones:', observaciones);
    } else {
      // Usuario regular solo puede actualizar sus tareas (pero NO las observaciones)
      query = `
        UPDATE Tareas 
        SET Titulo = @titulo, Responsable = @responsable, FechaInicio = @fechaInicio, FechaFin = @fechaFin, Prioridad = @prioridad, Estado = @estado
        WHERE Id = @id AND Responsable = @userDNI
      `;
      params = { id, titulo, responsable, fechaInicio, fechaFin, prioridad, estado, userDNI: req.user.dni };
      console.log('👤 Usuario regular actualizando tarea (sin observaciones)');
    }

    console.log('🔍 Query a ejecutar:', query);
    console.log('🔍 Parámetros:', params);

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

    // Si el Jefe Supremo está agregando una observación, crear un mensaje en MensajesObservaciones
    if (req.user.isSupremeBoss && observaciones && observaciones.trim()) {
      console.log('👑 Jefe Supremo agregando observación, creando mensaje en chat');
      
      await pool.request()
        .input('tareaId', id)
        .input('emisor', req.user.dni)
        .input('mensaje', observaciones.trim())
        .query(`
          INSERT INTO MensajesObservaciones (TareaId, Emisor, Mensaje)
          VALUES (@tareaId, @emisor, @mensaje)
        `);
      
      console.log('✅ Mensaje creado en chat para la observación del Jefe Supremo');
    }

    console.log('✅ Tarea actualizada. Filas afectadas:', result.rowsAffected[0]);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada o sin permisos' });
    }

    res.json({ message: 'Tarea actualizada exitosamente' });
  } catch (error) {
    console.error('❌ Error actualizando tarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE - Eliminar tarea (solo jefe supremo)
router.delete('/:id', authenticateToken, isSupremeBoss, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await connectDB();
    
    const result = await pool.request()
      .input('id', id)
      .query('DELETE FROM Tareas WHERE Id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    res.json({ message: 'Tarea eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando tarea:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Obtener mensajes del chat de una tarea
router.get('/:id/mensajes', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📥 Obteniendo mensajes para tarea:', id, 'Usuario:', req.user.dni);
    
    const pool = await connectDB();
    
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
      console.log('❌ Tarea no encontrada para obtener mensajes');
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    console.log('✅ Tarea encontrada, obteniendo mensajes');
    
    // Obtener los mensajes del chat
    const mensajesResult = await pool.request()
      .input('tareaId', id)
             .query(`
         SELECT 
           m.Id,
           m.TareaId,
           m.Emisor,
           m.Mensaje,
           m.FechaCreacion,
           LEFT(e.Nombres, CHARINDEX(' ', e.Nombres + ' ') - 1) + ' ' + e.ApellidoPaterno as NombreEmisor
         FROM MensajesObservaciones m
         LEFT JOIN PRI.Empleados e ON m.Emisor = e.DNI
         WHERE m.TareaId = @tareaId
         ORDER BY m.FechaCreacion ASC
       `);
    
    console.log('✅ Mensajes obtenidos:', mensajesResult.recordset.length, 'mensajes');
    res.json(mensajesResult.recordset);
  } catch (error) {
    console.error('❌ Error obteniendo mensajes:', error);
    console.error('❌ Detalles del error:', {
      message: error.message,
      code: error.code,
      number: error.number,
      state: error.state
    });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT - Marcar mensajes como leídos
router.put('/:id/mensajes/leer', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('👁️ Marcando mensajes como leídos para tarea:', id, 'Usuario:', req.user.dni);
    
    const pool = await connectDB();
    
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
      console.log('❌ Tarea no encontrada para marcar mensajes como leídos');
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    console.log('✅ Tarea encontrada, marcando mensajes como leídos');
    
    // Marcar todos los mensajes no leídos de otros usuarios como leídos
    const result = await pool.request()
      .input('tareaId', id)
      .input('userDNI', req.user.dni)
      .query(`
        UPDATE MensajesObservaciones 
        SET Leido = 1 
        WHERE TareaId = @tareaId 
        AND Emisor != @userDNI 
        AND Leido = 0
      `);
    
    console.log('✅ Mensajes marcados como leídos. Filas afectadas:', result.rowsAffected[0]);
    res.json({ message: 'Mensajes marcados como leídos', mensajesActualizados: result.rowsAffected[0] });
  } catch (error) {
    console.error('❌ Error marcando mensajes como leídos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST - Enviar mensaje en el chat
router.post('/:id/mensajes', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { mensaje } = req.body;
    
    console.log('📨 Enviando mensaje:', { id, mensaje, user: req.user.dni });
    
    if (!mensaje || !mensaje.trim()) {
      return res.status(400).json({ error: 'El mensaje es requerido' });
    }
    
    const pool = await connectDB();
    
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
      console.log('❌ Tarea no encontrada o sin permisos');
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    console.log('✅ Tarea encontrada, procediendo a insertar mensaje');
    
    // Insertar el mensaje
    const result = await pool.request()
      .input('tareaId', id)
      .input('emisor', req.user.dni)
      .input('mensaje', mensaje.trim())
      .query(`
        INSERT INTO MensajesObservaciones (TareaId, Emisor, Mensaje)
        VALUES (@tareaId, @emisor, @mensaje);
        SELECT SCOPE_IDENTITY() as Id;
      `);
    
    const mensajeId = result.recordset[0].Id;
    console.log('✅ Mensaje insertado con ID:', mensajeId);
    
         // Obtener el mensaje recién creado con el nombre del emisor
     const mensajeCreado = await pool.request()
       .input('mensajeId', mensajeId)
       .query(`
         SELECT 
           m.Id,
           m.TareaId,
           m.Emisor,
           m.Mensaje,
           m.FechaCreacion,
           LEFT(e.Nombres, CHARINDEX(' ', e.Nombres + ' ') - 1) + ' ' + e.ApellidoPaterno as NombreEmisor
         FROM MensajesObservaciones m
         LEFT JOIN PRI.Empleados e ON m.Emisor = e.DNI
         WHERE m.Id = @mensajeId
       `);
    
    console.log('✅ Mensaje creado:', mensajeCreado.recordset[0]);
    res.status(201).json(mensajeCreado.recordset[0]);
  } catch (error) {
    console.error('❌ Error enviando mensaje:', error);
    console.error('❌ Detalles del error:', {
      message: error.message,
      code: error.code,
      number: error.number,
      state: error.state
    });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
