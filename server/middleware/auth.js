const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'holademar';

// Función para determinar el nivel jerárquico basado en el cargo
const obtenerNivelJerarquico = (cargo, cargoId, campaniaId) => {
  if (!cargo) return 4;
  
  const cargoLower = cargo.toLowerCase();
  
  // Jefe Supremo (nivel 0)
  if (cargoLower.includes('jefe') && cargoLower.includes('operaciones')) return 0;
  
  // Jefe de Área (nivel 1)
  if (cargoLower.includes('jefe') && !cargoLower.includes('operaciones')) return 1;
  
  // Analistas (nivel 1) - subordinados directos del jefe supremo
  if (cargoId === 4 && campaniaId === 5) return 1;
  
  // Coordinador (nivel 2)
  if (cargoLower.includes('coordinador')) return 2;
  
  // Supervisor (nivel 3)
  if (cargoLower.includes('supervisor')) return 3;
  
  // Capacitador y Monitor (nivel 4)
  if (cargoLower.includes('capacitador') || cargoLower.includes('monitor')) return 4;
  
  // Agente o nivel más bajo (nivel 4)
  return 4;
};

// Función para obtener subordinados según el nivel jerárquico
const obtenerSubordinados = async (dni, nivel, cargoId, campaniaId, pool) => {
  let query = '';
  
  if (nivel === 0) {
    // Jefe Supremo: buscar los 3 jefes de área + analistas
    query = `
      SELECT e.DNI, e.Nombres, e.ApellidoPaterno, e.ApellidoMaterno, e.CargoID, e.CampañaID, c.NombreCargo
      FROM PRI.Empleados e
      LEFT JOIN PRI.Cargos c ON c.CargoID = e.CargoID
      WHERE (e.DNI IN ('002702515', '76157106', '46142691') OR (e.CargoID = 4 AND e.CampañaID = 5))
      AND e.EstadoEmpleado = 'Activo'
    `;
  } else if (nivel === 1) {
    // Solo hay 3 jefes de área + analistas en nivel 1
    if (dni === '76157106') {
      // Jefa de Capacitación/Calidad: buscar empleados de sus campañas específicas
      console.log('🔍 Jefa de Capacitación/Calidad, buscando empleados de campañas 10 y 11');
      query = `
        SELECT e.DNI, e.Nombres, e.ApellidoPaterno, e.ApellidoMaterno, e.CargoID, e.CampañaID, c.NombreCargo
        FROM PRI.Empleados e
        LEFT JOIN PRI.Cargos c ON c.CargoID = e.CargoID
        WHERE e.EstadoEmpleado = 'Activo'
        AND e.CampañaID IN (10, 11)
      `;
    } else if (dni === '002702515') {
      // Jefe específico: buscar supervisores directamente (sin coordinadores)
      console.log('🔍 Jefe 002702515, buscando supervisores directamente');
      query = `
        SELECT e.DNI, e.Nombres, e.ApellidoPaterno, e.ApellidoMaterno, e.CargoID, e.CampañaID, c.NombreCargo
        FROM PRI.Empleados e
        LEFT JOIN PRI.Cargos c ON c.CargoID = e.CargoID
        WHERE e.JefeDNI = @dni 
        AND e.EstadoEmpleado = 'Activo'
        AND c.NombreCargo LIKE '%supervisor%'
      `;
    } else if (dni === '46142691') {
      // Tercer jefe: buscar coordinadores primero, luego supervisores si no hay coordinadores
      console.log('🔍 Tercer jefe 46142691, buscando coordinadores primero');
      query = `
        SELECT e.DNI, e.Nombres, e.ApellidoPaterno, e.ApellidoMaterno, e.CargoID, e.CampañaID, c.NombreCargo
        FROM PRI.Empleados e
        LEFT JOIN PRI.Cargos c ON c.CargoID = e.CargoID
        WHERE e.JefeDNI = @dni 
        AND e.EstadoEmpleado = 'Activo'
        AND c.NombreCargo LIKE '%coordinador%'
      `;
      
      // Ejecutar consulta de coordinadores
      const result = await pool.request().input('dni', dni).query(query);
      
      if (result.recordset.length > 0) {
        console.log('✅ Coordinadores encontrados para jefe 46142691:', result.recordset.length);
        return result.recordset;
      } else {
        // Si no hay coordinadores, buscar supervisores directamente
        console.log('⚠️ No se encontraron coordinadores, buscando supervisores directamente para jefe 46142691');
        query = `
          SELECT e.DNI, e.Nombres, e.ApellidoPaterno, e.ApellidoMaterno, e.CargoID, e.CampañaID, c.NombreCargo
          FROM PRI.Empleados e
          LEFT JOIN PRI.Cargos c ON c.CargoID = e.CargoID
          WHERE e.JefeDNI = @dni 
          AND e.EstadoEmpleado = 'Activo'
          AND c.NombreCargo LIKE '%supervisor%'
        `;
      }
    } else if (cargoId === 4 && campaniaId === 5) {
      // Analistas: NO tienen subordinados
      console.log('📋 Analista detectado, sin subordinados:', dni);
      return [];
    } else {
      // Cualquier otro empleado en nivel 1 que no sea jefe ni analista
      console.log('⚠️ Empleado nivel 1 no reconocido como jefe ni analista:', dni);
      return [];
    }
  } else if (nivel === 2) {
    // Coordinador: buscar supervisores
    query = `
      SELECT e.DNI, e.Nombres, e.ApellidoPaterno, e.ApellidoMaterno, e.CargoID, e.CampañaID, c.NombreCargo
      FROM PRI.Empleados e
      LEFT JOIN PRI.Cargos c ON c.CargoID = e.CargoID
      WHERE e.CoordinadorDNI = @dni 
      AND e.EstadoEmpleado = 'Activo'
      AND c.NombreCargo LIKE '%supervisor%'
    `;
  } else if (nivel === 3) {
    // Supervisor: buscar agentes
    query = `
      SELECT e.DNI, e.Nombres, e.ApellidoPaterno, e.ApellidoMaterno, e.CargoID, e.CampañaID, c.NombreCargo
      FROM PRI.Empleados e
      LEFT JOIN PRI.Cargos c ON c.CargoID = e.CargoID
      WHERE e.SupervisorDNI = @dni 
      AND e.EstadoEmpleado = 'Activo'
      AND (c.NombreCargo LIKE '%agente%' OR c.NombreCargo LIKE '%operador%' OR c.NombreCargo LIKE '%asesor%')
    `;
  }
  
  if (query) {
    const result = await pool.request().input('dni', dni).query(query);
    console.log(`🔍 Subordinados encontrados para ${dni} (nivel ${nivel}):`, result.recordset.length);
    return result.recordset;
  }
  
  return [];
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔍 BACKEND - Middleware auth:', {
    url: req.url,
    token: token ? token.substring(0, 20) + '...' : 'null',
    authHeader: authHeader ? authHeader.substring(0, 30) + '...' : 'null'
  });

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ BACKEND - Token inválido:', err.message);
      return res.status(403).json({ error: 'Token inválido' });
    }
    
    console.log('✅ BACKEND - Token válido, usuario:', {
      dni: user.dni,
      nombre: user.nombre,
      isSupremeBoss: user.isSupremeBoss
    });
    
    req.user = user;
    next();
  });
};

const isSupremeBoss = (req, res, next) => {
  if (req.user.dni !== '44991089') {
    return res.status(403).json({ error: 'Acceso denegado. Solo el jefe supremo puede realizar esta acción.' });
  }
  next();
};

module.exports = { 
  authenticateToken, 
  isSupremeBoss, 
  obtenerNivelJerarquico, 
  obtenerSubordinados 
};
