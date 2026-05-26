const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'marjorie-store-dev-secret';

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ ok: false, message: 'Token de autenticacion requerido' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: 'Token invalido o expirado' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ ok: false, message: 'Acceso denegado' });
    }

    next();
  };
}

function requireSelfOrAdmin(paramName = 'idCliente') {
  return (req, res, next) => {
    const requestedId = Number(req.params[paramName] || req.body[paramName]);
    const userId = Number(req.user && req.user.id);

    if (req.user && (req.user.role === 'admin' || requestedId === userId)) {
      return next();
    }

    return res.status(403).json({ ok: false, message: 'Acceso denegado' });
  };
}

module.exports = {
  JWT_SECRET,
  authenticate,
  requireRole,
  requireSelfOrAdmin
};
