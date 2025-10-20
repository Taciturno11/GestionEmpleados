const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { connectDB } = require('../config/database');
const { obtenerNivelJerarquico, obtenerSubordinados } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT;

// POST - Login
router.post('/login', async (req, res) => {
  try {
    const { dni } = req.body;
    
    if (!dni) {
      return res.status(400).json({ error: 'DNI es requerido' });
    }

    const pool = await connectDB();
    
    const result = await pool.request()
      .input('dni', dni)
      .query(`
        SELECT e.DNI, e.Nombres, e.ApellidoPaterno, e.ApellidoMaterno, e.CargoID, e.CampañaID, c.NombreCargo
        FROM PRI.Empleados e
        LEFT JOIN PRI.Cargos c ON c.CargoID = e.CargoID
        WHERE e.DNI = @dni AND e.EstadoEmpleado = 'Activo'
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.recordset[0];
    const nombreCompleto = `${user.Nombres} ${user.ApellidoPaterno} ${user.ApellidoMaterno || ''}`.trim();
    
    const token = jwt.sign(
      { 
        dni: user.DNI, 
        nombre: nombreCompleto, 
        cargoId: user.CargoID,
        campaniaId: user.CampañaID,
        cargoNombre: user.NombreCargo,
        isSupremeBoss: user.DNI === '44991089'
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        dni: user.DNI,
        nombre: nombreCompleto,
        cargoId: user.CargoID,
        campaniaId: user.CampañaID,
        cargoNombre: user.NombreCargo,
        isSupremeBoss: user.DNI === '44991089'
      }
    });
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Verificar token y obtener información del usuario
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const pool = await connectDB();
    const result = await pool.request()
      .input('dni', decoded.dni)
      .query(`
        SELECT DNI, Nombres, ApellidoPaterno, ApellidoMaterno, CargoID 
        FROM PRI.Empleados 
        WHERE DNI = @dni
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.recordset[0];
    const nombreCompleto = `${user.Nombres} ${user.ApellidoPaterno} ${user.ApellidoMaterno || ''}`.trim();

    res.json({
      dni: user.DNI,
      nombre: nombreCompleto,
      cargoId: user.CargoID,
      isSupremeBoss: user.DNI === '44991089'
    });
  } catch (error) {
    console.error('❌ Error verificando token:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
});

// GET - Obtener lista de usuarios
router.get('/users', async (req, res) => {
  try {
    const pool = await connectDB();
    
    const result = await pool.request()
      .query(`
        SELECT e.DNI, e.Nombres, e.ApellidoPaterno, e.ApellidoMaterno, e.CargoID, c.NombreCargo
        FROM PRI.Empleados e
        LEFT JOIN PRI.Cargos c ON c.CargoID = e.CargoID
        WHERE e.EstadoEmpleado = 'Activo'
        ORDER BY e.Nombres
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('❌ Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Obtener jerarquía del usuario
router.get('/jerarquia', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const pool = await connectDB();
    
    // Obtener información completa del usuario
    const userResult = await pool.request()
      .input('dni', decoded.dni)
      .query(`
        SELECT e.DNI, e.Nombres, e.ApellidoPaterno, e.ApellidoMaterno, e.CargoID, e.CampañaID, c.NombreCargo
        FROM PRI.Empleados e
        LEFT JOIN PRI.Cargos c ON c.CargoID = e.CargoID
        WHERE e.DNI = @dni
      `);

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = userResult.recordset[0];
    const nivelUsuario = obtenerNivelJerarquico(user.NombreCargo, user.CargoID, user.CampañaID);
    const subordinados = await obtenerSubordinados(user.DNI, nivelUsuario, user.CargoID, user.CampañaID, pool);
    
    res.json({
      usuario: {
        dni: user.DNI,
        nombre: `${user.Nombres} ${user.ApellidoPaterno} ${user.ApellidoMaterno || ''}`.trim(),
        cargoId: user.CargoID,
        campaniaId: user.CampañaID,
        cargoNombre: user.NombreCargo,
        nivel: nivelUsuario,
        isSupremeBoss: user.DNI === '44991089'
      },
      subordinados: subordinados,
      puedeAsignarTareas: subordinados.length > 0 || user.DNI === '44991089'
    });
  } catch (error) {
    console.error('❌ Error obteniendo jerarquía:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
});

module.exports = router;