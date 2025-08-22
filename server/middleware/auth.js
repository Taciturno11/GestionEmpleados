const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'partner-design-thinking-secret-key';

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Middleware para verificar si es jefe supremo
const isSupremeBoss = (req, res, next) => {
  if (req.user.dni !== '44991089') {
    return res.status(403).json({ error: 'Acceso denegado. Solo el jefe supremo puede realizar esta acción.' });
  }
  next();
};

// Middleware para verificar si es jefe supremo o usuario regular
const isSupremeBossOrRegular = (req, res, next) => {
  // Cualquier usuario autenticado puede acceder
  next();
};

module.exports = {
  authenticateToken,
  isSupremeBoss,
  isSupremeBossOrRegular,
  JWT_SECRET
};
