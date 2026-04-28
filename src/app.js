require('dotenv').config();
const express  = require('express');
const cors     = require('cors');

const authRoutes = require('./routes/auth.routes');
const taskRoutes = require('./routes/task.routes');
const miscRoutes = require('./routes/misc.routes');
const { errorHandler, notFound } = require('./middlewares/error.middleware');
const NotificationObserver       = require('./patterns/NotificationObserver');

const app  = express();
const PORT = parseInt(process.env.PORT) || 3000;

// ── Middlewares globales ─────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cabeceras de seguridad básicas
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ── Rutas de la API ──────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api',       miscRoutes);

// ── Health check ─────────────────────────────────────────────
app.get('/health', (req, res) =>
  res.json({ ok: true, uptime: process.uptime(), env: process.env.NODE_ENV })
);

// ── Manejadores de error ─────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Registrar Observer de notificaciones ────────────────────
NotificationObserver.register();

// ── Inicio del servidor ──────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  Task Manager API corriendo en http://localhost:${PORT}`);
  console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health:  http://localhost:${PORT}/health\n`);
});

module.exports = app;
