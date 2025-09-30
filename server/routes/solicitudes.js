const express = require('express');
const router = express.Router();
const { connectDB } = require('../config/database');
const { authenticateToken, obtenerNivelJerarquico } = require('../middleware/auth');

// Función para verificar si el usuario puede hacer solicitudes (solo nivel 1)
const puedeHacerSolicitudes = (nivel, cargoId, campaniaId) => {
  // Jefe Supremo (nivel 0) puede hacer solicitudes
  if (nivel === 0) return true;
  
  // Solo nivel 1: Jefes de Área y Analistas
  if (nivel === 1) return true;
  
  return false;
};

// Función para obtener usuarios que pueden recibir solicitudes (solo nivel 1)
const obtenerUsuariosElegibles = async (pool) => {
  const query = `
    SELECT 
      e.DNI,
      LEFT(e.Nombres, CHARINDEX(' ', e.Nombres + ' ') - 1) + ' ' + e.ApellidoPaterno + ' ' + ISNULL(e.ApellidoMaterno, '') as NombreCompleto,
      e.Nombres,
      e.ApellidoPaterno,
      e.ApellidoMaterno,
      e.CargoID,
      e.CampañaID,
      c.NombreCargo,
      CASE 
        WHEN e.DNI = '44991089' THEN 'Jefe Supremo'
        WHEN e.DNI IN ('002702515', '76157106', '46142691') THEN 'Jefe de Área'
        WHEN e.CargoID = 4 AND e.CampañaID = 5 THEN 'Analista'
        ELSE 'Otro'
      END as TipoUsuario
    FROM PRI.Empleados e
    LEFT JOIN PRI.Cargos c ON c.CargoID = e.CargoID
    WHERE e.EstadoEmpleado = 'Activo'
    AND (
      e.DNI = '44991089' OR -- Jefe Supremo
      e.DNI IN ('002702515', '76157106', '46142691') OR -- Jefes de Área
      (e.CargoID = 4 AND e.CampañaID = 5) -- Analistas
    )
    ORDER BY 
      CASE 
        WHEN e.DNI = '44991089' THEN 0
        WHEN e.DNI IN ('002702515', '76157106', '46142691') THEN 1
        ELSE 2
      END,
      e.Nombres
  `;
  
  const result = await pool.request().query(query);
  return result.recordset;
};

// GET - Obtener usuarios elegibles para solicitudes
router.get('/usuarios-elegibles', authenticateToken, async (req, res) => {
  try {
    const pool = await connectDB();
    const nivelUsuario = obtenerNivelJerarquico(req.user.cargoNombre, req.user.cargoId, req.user.campaniaId);
    
    if (!puedeHacerSolicitudes(nivelUsuario, req.user.cargoId, req.user.campaniaId)) {
      return res.status(403).json({ error: 'No tienes permisos para hacer solicitudes' });
    }
    
    const usuarios = await obtenerUsuariosElegibles(pool);
    
    // Filtrar el usuario actual de la lista
    const usuariosFiltrados = usuarios.filter(u => u.DNI !== req.user.dni);
    
    res.json(usuariosFiltrados);
  } catch (error) {
    console.error('❌ Error obteniendo usuarios elegibles:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST - Crear nueva solicitud
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { titulo, descripcion, solicitadoDNI, fechaInicio, fechaFin, prioridad } = req.body;
    
    console.log('🔍 CREANDO SOLICITUD:', {
      usuario: req.user.dni,
      nombre: req.user.nombre,
      cargo: req.user.cargoNombre,
      cargoId: req.user.cargoId,
      campaniaId: req.user.campaniaId,
      solicitadoDNI
    });
    
    if (!titulo || !descripcion || !solicitadoDNI) {
      return res.status(400).json({ error: 'Título, descripción y destinatario son requeridos' });
    }
    
    const pool = await connectDB();
    const nivelUsuario = obtenerNivelJerarquico(req.user.cargoNombre, req.user.cargoId, req.user.campaniaId);
    
    console.log('🔍 NIVEL USUARIO:', nivelUsuario);
    console.log('🔍 PUEDE HACER SOLICITUDES:', puedeHacerSolicitudes(nivelUsuario, req.user.cargoId, req.user.campaniaId));
    
    if (!puedeHacerSolicitudes(nivelUsuario, req.user.cargoId, req.user.campaniaId)) {
      return res.status(403).json({ error: 'No tienes permisos para hacer solicitudes' });
    }
    
    // Verificar que el destinatario existe y es elegible
    const usuariosElegibles = await obtenerUsuariosElegibles(pool);
    const destinatario = usuariosElegibles.find(u => u.DNI === solicitadoDNI);
    
    if (!destinatario) {
      return res.status(400).json({ error: 'Destinatario no válido o no elegible' });
    }
    
    // Crear la solicitud
    const result = await pool.request()
      .input('titulo', titulo)
      .input('descripcion', descripcion)
      .input('solicitanteDNI', req.user.dni)
      .input('solicitadoDNI', solicitadoDNI)
      .input('estado', 'Pendiente')
      .input('fechaInicio', fechaInicio || null)
      .input('fechaFin', fechaFin || null)
      .input('prioridad', prioridad || 'Media')
      .query(`
        INSERT INTO SolicitudesTareas (Titulo, Descripcion, SolicitanteDNI, SolicitadoDNI, Estado, FechaInicio, FechaFin, Prioridad)
        VALUES (@titulo, @descripcion, @solicitanteDNI, @solicitadoDNI, @estado, @fechaInicio, @fechaFin, @prioridad);
        SELECT SCOPE_IDENTITY() as Id;
      `);
    
    const solicitudId = result.recordset[0].Id;
    
    // Crear notificación para el destinatario
    await pool.request()
      .input('usuarioDNI', solicitadoDNI)
      .input('tipo', 'solicitud_tarea')
      .input('titulo', 'Nueva Solicitud de Tarea')
      .input('mensaje', `${req.user.nombre} te ha enviado una solicitud: "${titulo}"`)
      .input('solicitudId', solicitudId)
      .query(`
        INSERT INTO Notificaciones (UsuarioDNI, Tipo, Titulo, Mensaje, SolicitudId)
        VALUES (@usuarioDNI, @tipo, @titulo, @mensaje, @solicitudId)
      `);
    
    res.status(201).json({
      message: 'Solicitud enviada exitosamente',
      id: solicitudId
    });
  } catch (error) {
    console.error('❌ Error creando solicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Obtener solicitudes recibidas
router.get('/recibidas', authenticateToken, async (req, res) => {
  try {
    const pool = await connectDB();
    
    const query = `
      SELECT 
        s.*,
        LEFT(e.Nombres, CHARINDEX(' ', e.Nombres + ' ') - 1) + ' ' + e.ApellidoPaterno + ' ' + ISNULL(e.ApellidoMaterno, '') as SolicitanteNombre
      FROM SolicitudesTareas s
      LEFT JOIN PRI.Empleados e ON s.SolicitanteDNI = e.DNI
      WHERE s.SolicitadoDNI = @usuarioDNI
      ORDER BY s.FechaSolicitud DESC
    `;
    
    const result = await pool.request()
      .input('usuarioDNI', req.user.dni)
      .query(query);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('❌ Error obteniendo solicitudes recibidas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Obtener solicitudes enviadas
router.get('/enviadas', authenticateToken, async (req, res) => {
  try {
    const pool = await connectDB();
    
    const query = `
      SELECT 
        s.*,
        LEFT(e.Nombres, CHARINDEX(' ', e.Nombres + ' ') - 1) + ' ' + e.ApellidoPaterno + ' ' + ISNULL(e.ApellidoMaterno, '') as SolicitadoNombre
      FROM SolicitudesTareas s
      LEFT JOIN PRI.Empleados e ON s.SolicitadoDNI = e.DNI
      WHERE s.SolicitanteDNI = @usuarioDNI
      ORDER BY s.FechaSolicitud DESC
    `;
    
    const result = await pool.request()
      .input('usuarioDNI', req.user.dni)
      .query(query);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('❌ Error obteniendo solicitudes enviadas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT - Responder a una solicitud (aceptar/rechazar)
router.put('/:id/responder', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { accion, observaciones } = req.body; // accion: 'aceptar' o 'rechazar'
    
    if (!accion || !['aceptar', 'rechazar'].includes(accion)) {
      return res.status(400).json({ error: 'Acción inválida. Debe ser "aceptar" o "rechazar"' });
    }
    
    const pool = await connectDB();
    
    // Verificar que la solicitud existe y pertenece al usuario
    const solicitudResult = await pool.request()
      .input('id', id)
      .input('usuarioDNI', req.user.dni)
      .query(`
        SELECT * FROM SolicitudesTareas 
        WHERE Id = @id AND SolicitadoDNI = @usuarioDNI AND Estado = 'Pendiente'
      `);
    
    if (solicitudResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada o ya procesada' });
    }
    
    const solicitud = solicitudResult.recordset[0];
    const nuevoEstado = accion === 'aceptar' ? 'Aceptada' : 'Rechazada';
    
    // Actualizar la solicitud
    await pool.request()
      .input('id', id)
      .input('estado', nuevoEstado)
      .input('observaciones', observaciones || null)
      .input('fechaRespuesta', new Date().toISOString())
      .query(`
        UPDATE SolicitudesTareas 
        SET Estado = @estado, Observaciones = @observaciones, FechaRespuesta = @fechaRespuesta
        WHERE Id = @id
      `);
    
    // Si se acepta, crear la tarea automáticamente
    let tareaCreadaId = null;
    if (accion === 'aceptar') {
      const tareaResult = await pool.request()
        .input('titulo', solicitud.Titulo)
        .input('responsable', req.user.dni)
        .input('fechaInicio', solicitud.FechaInicio || new Date().toISOString().split('T')[0])
        .input('fechaFin', solicitud.FechaFin || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .input('prioridad', solicitud.Prioridad || 'Media')
        .input('estado', 'Pendiente')
        .input('observaciones', `Solicitud aceptada de ${solicitud.SolicitanteDNI}. ${solicitud.Descripcion}`)
        .query(`
          INSERT INTO Tareas (Titulo, Responsable, FechaInicio, FechaFin, Prioridad, Estado, Observaciones)
          VALUES (@titulo, @responsable, @fechaInicio, @fechaFin, @prioridad, @estado, @observaciones);
          SELECT SCOPE_IDENTITY() as Id;
        `);
      
      tareaCreadaId = tareaResult.recordset[0].Id;
      
      // Actualizar la solicitud con el ID de la tarea creada
      await pool.request()
        .input('id', id)
        .input('tareaCreadaId', tareaCreadaId)
        .query(`
          UPDATE SolicitudesTareas 
          SET TareaCreadaId = @tareaCreadaId
          WHERE Id = @id
        `);
    }
    
    // Crear notificación para el solicitante
    const mensajeNotificacion = accion === 'aceptar' 
      ? `${req.user.nombre} ha aceptado tu solicitud: "${solicitud.Titulo}"`
      : `${req.user.nombre} ha rechazado tu solicitud: "${solicitud.Titulo}"`;
    
    await pool.request()
      .input('usuarioDNI', solicitud.SolicitanteDNI)
      .input('tipo', accion === 'aceptar' ? 'solicitud_aceptada' : 'solicitud_rechazada')
      .input('titulo', accion === 'aceptar' ? 'Solicitud Aceptada' : 'Solicitud Rechazada')
      .input('mensaje', mensajeNotificacion)
      .input('solicitudId', id)
      .query(`
        INSERT INTO Notificaciones (UsuarioDNI, Tipo, Titulo, Mensaje, SolicitudId)
        VALUES (@usuarioDNI, @tipo, @titulo, @mensaje, @solicitudId)
      `);
    
    res.json({
      message: `Solicitud ${accion === 'aceptar' ? 'aceptada' : 'rechazada'} exitosamente`,
      tareaCreadaId: tareaCreadaId
    });
  } catch (error) {
    console.error('❌ Error respondiendo solicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
