const ResponseView = require('../views/responses/ResponseView');

// ── Manejador global de errores (SOLID: SRP) ─────────────────
const errorHandler = (err, req, res, next) => {
  const status  = err.status  || err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Handler]', {
      status, message,
      stack: err.stack,
      path: req.path,
    });
  } else {
    console.error(`[Error] ${status} ${message} — ${req.method} ${req.path}`);
  }

  return ResponseView.error(res, message, status);
};

// ── 404 para rutas no encontradas ────────────────────────────
const notFound = (req, res) => {
  return ResponseView.notFound(res, `Ruta no encontrada: ${req.method} ${req.path}`);
};

module.exports = { errorHandler, notFound };
