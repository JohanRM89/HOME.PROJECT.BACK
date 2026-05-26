require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const taskRoutes = require("./routes/task.routes");
const miscRoutes = require("./routes/misc.routes");
const familyRoutes = require("./routes/family.routes");
const { errorHandler, notFound } = require("./middlewares/error.middleware");
const NotificationObserver = require("./patterns/NotificationObserver");
const runMigrations = require("./config/migrate");

const app = express();
const PORT = parseInt(process.env.PORT) || 3000;

// ── Middlewares globales ─────────────────────────────────────

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cabeceras de seguridad básicas
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// ── Rutas de la API ──────────────────────────────────────────
app.use("/api/family", familyRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api", miscRoutes);

// ── Health check ─────────────────────────────────────────────
app.get("/health", (req, res) =>
  res.json({ ok: true, uptime: process.uptime(), env: process.env.NODE_ENV }),
);

// ── Manejadores de error ─────────────────────────────────────
app.use(notFound);
app.use(errorHandler);
// ── Inicio del servidor ──────────────────────────────────────
async function startServer() {
  try {
    await runMigrations();
    //Manejo de notificaciones
    NotificationObserver.register();

    app.listen(PORT, () => {
      console.log(`\n Task Manager API corriendo en puerto ${PORT}`);
      console.log(`   Entorno: ${process.env.NODE_ENV || "development"}`);
      console.log(`   Health: /health\n`);
    });
  } catch (error) {
    console.error(" Error iniciando servidor:", error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
