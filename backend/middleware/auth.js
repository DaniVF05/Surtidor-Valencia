const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticación JWT
 * @param {...string} roles — roles permitidos (vacío = cualquier usuario autenticado)
 */
function auth(...roles) {
  return (req, res, next) => {
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token requerido' });
    }
    const token = header.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      if (roles.length && !roles.includes(decoded.rol)) {
        return res.status(403).json({ success: false, message: 'Sin permisos para esta acción' });
      }
      next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
    }
  };
}

module.exports = auth;
