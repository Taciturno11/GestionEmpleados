const express = require('express');
const router = express.Router();
const { connectDB } = require('../config/database');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, authenticateToken, isSupremeBoss } = require('../middleware/auth');

// POST - Login
router.post('/login', async (req, res) => {
  try {
    const { dni, password } = req.body;

    // Validar que se proporcionen los datos
    if (!dni || !password) {
      return res.status(400).json({ error: 'DNI y contraseña son requeridos' });
    }

    // Validar que DNI y contraseña sean iguales
    if (dni !== password) {
      return res.status(401).json({ error: 'DNI y contraseña deben ser iguales' });
    }

    const pool = await connectDB();
    
    // Buscar usuario en la tabla PRI.Empleados
    const result = await pool.request()
      .input('dni', dni)
      .query(`
        SELECT DNI, Nombres, ApellidoPaterno, ApellidoMaterno, CargoID 
        FROM PRI.Empleados 
        WHERE DNI = @dni AND (CargoID IN (4, 8) OR DNI = '44991089')
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado o sin permisos' });
    }

    const user = result.recordset[0];
    
    // Crear nombre completo
    const nombreCompleto = `${user.Nombres} ${user.ApellidoPaterno} ${user.ApellidoMaterno || ''}`.trim();
    
    // Crear token JWT
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
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Verificar token y obtener información del usuario
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Token inválido' });
      }

      const pool = await connectDB();
      
      // Obtener información actualizada del usuario
      const result = await pool.request()
        .input('dni', decoded.dni)
        .query(`
          SELECT DNI, Nombres, ApellidoPaterno, ApellidoMaterno, CargoID 
          FROM PRI.Empleados 
          WHERE DNI = @dni AND (CargoID IN (4, 8) OR DNI = '44991089')
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const user = result.recordset[0];

      // Crear nombre completo
      const nombreCompleto = `${user.Nombres} ${user.ApellidoPaterno} ${user.ApellidoMaterno || ''}`.trim();

      res.json({
        user: {
          dni: user.DNI,
          nombre: nombreCompleto,
          cargoId: user.CargoID,
          isSupremeBoss: user.DNI === '44991089'
        }
      });
    });

  } catch (error) {
    console.error('Error obteniendo información del usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET - Obtener lista de usuarios (solo jefe supremo)
router.get('/users', authenticateToken, isSupremeBoss, async (req, res) => {
  try {
    const pool = await connectDB();
    
    const result = await pool.request()
      .query(`
        SELECT DNI, Nombres, ApellidoPaterno, ApellidoMaterno, CargoID,
               CASE 
                 WHEN DNI = '44991089' THEN 'Jefe Supremo'
                 WHEN CargoID = 8 THEN 'Jefe'
                 WHEN CargoID = 4 THEN 'Analista'
                 ELSE 'Otro'
               END as Rol
        FROM PRI.Empleados 
        WHERE (CargoID IN (4, 8) OR DNI = '44991089') AND EstadoEmpleado = 'Activo'
        ORDER BY CargoID DESC, Nombres ASC
      `);

    res.json(result.recordset);

  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
