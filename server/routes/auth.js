const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { connectDB } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'holademar';

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
        SELECT DNI, Nombres, ApellidoPaterno, ApellidoMaterno, CargoID 
        FROM PRI.Empleados 
        WHERE DNI = @dni AND (CargoID IN (4, 8) OR DNI = '44991089')
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
        SELECT DNI, Nombres, ApellidoPaterno, ApellidoMaterno, CargoID 
        FROM PRI.Empleados 
        WHERE CargoID IN (4, 8) OR DNI = '44991089'
        ORDER BY Nombres
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('❌ Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;