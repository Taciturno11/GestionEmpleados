const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura_2024';

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

module.exports = { authenticateToken, isSupremeBoss };
