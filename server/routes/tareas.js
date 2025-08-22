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
      query = 'SELECT * FROM Tareas ORDER BY FechaEntrega ASC';
    } else {
      // Usuario regular ve solo sus tareas (por responsable)
      query = `
        SELECT * FROM Tareas 
        WHERE Responsable = @userDNI 
        ORDER BY FechaEntrega ASC
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
    const { titulo, responsable, fechaEntrega, estado } = req.body;
    
    if (!titulo || !responsable || !fechaEntrega || !estado) {
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
      .input('fechaEntrega', fechaEntrega)
      .input('estado', estado)
      .query(`
        INSERT INTO Tareas (Titulo, Responsable, FechaEntrega, Estado)
        VALUES (@titulo, @responsable, @fechaEntrega, @estado);
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
    const { titulo, responsable, fechaEntrega, estado } = req.body;
    
    if (!titulo || !responsable || !fechaEntrega || !estado) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const pool = await connectDB();
    
    let query = '';
    let params = { id, titulo, responsable, fechaEntrega, estado };

    if (req.user.isSupremeBoss) {
      // Jefe supremo puede actualizar cualquier tarea
      query = `
        UPDATE Tareas 
        SET Titulo = @titulo, Responsable = @responsable, FechaEntrega = @fechaEntrega, Estado = @estado
        WHERE Id = @id
      `;
    } else {
      // Usuario regular solo puede actualizar sus tareas
      query = `
        UPDATE Tareas 
        SET Titulo = @titulo, Responsable = @responsable, FechaEntrega = @fechaEntrega, Estado = @estado
        WHERE Id = @id AND Responsable = @userDNI
      `;
      params = { id, titulo, responsable, fechaEntrega, estado, userDNI: req.user.dni };
    }

    const result = await pool.request()
      .input('id', id)
      .input('titulo', titulo)
      .input('responsable', responsable)
      .input('fechaEntrega', fechaEntrega)
      .input('estado', estado)
      .input('userDNI', req.user.dni)
      .query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada o sin permisos' });
    }

    res.json({ message: 'Tarea actualizada exitosamente' });
  } catch (error) {
    console.error('Error actualizando tarea:', error);
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

module.exports = router;
