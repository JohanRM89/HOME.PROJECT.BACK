const jwt               = require('jsonwebtoken');
const SessionRepository = require('../repositories/SessionRepository');
const ResponseView      = require('../views/responses/ResponseView');

// ── Middleware principal de autenticación ────────────────────
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return ResponseView.unauthorized(res, 'Token no proporcionado');
    }

    const token = header.slice(7);

    // 1. Verificar firma JWT (rápido, sin BD)
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return ResponseView.unauthorized(res, 'Token inválido o expirado');
    }

    // 2. Verificar que la sesión existe y no fue revocada (BD)
    const session = await SessionRepository.findByToken(token);
    if (!session) {
      return ResponseView.unauthorized(res, 'Sesión inválida o cerrada');
    }

    // Inyectar usuario y token en request para controladores
    req.user  = { id: session.user_id, name: session.name, email: session.email };
    req.token = token;

    next();
  } catch (err) {
    console.error('[Auth Middleware]', err.message);
    return ResponseView.error(res, 'Error de autenticación');
  }
};

// ── Middleware opcional (no falla si no hay token) ───────────
const optionalAuth = async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return next();
  return authenticate(req, res, next);
};

module.exports = { authenticate, optionalAuth };
