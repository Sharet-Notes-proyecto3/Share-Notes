import 'dotenv/config';
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import logger from "./utils/logger";
import { correlationMiddleware } from "./middlewares/correlation.middleware";

// Validación en producción: evitar que origin quede undefined en CORS
if (process.env.NODE_ENV === "production" && !process.env.APP_PUBLIC_URL) {
  logger.error("FATAL: APP_PUBLIC_URL no está definida en el entorno de producción para configurar CORS.");
  throw new Error("FATAL: APP_PUBLIC_URL no está definida en el entorno de producción para configurar CORS.");
}

// Importa rutas
import authRoutes from "./routes/auth.routes";
import noteRoutes from "./routes/note.routes";
import forumRoutes from "./routes/forum.routes";
import adminRoutes from "./routes/admin.routes";
import teacherRoutes from "./routes/teacher.routes";
import moderatorRoutes from "./routes/moderator.routes";
import { rolesRouter } from "./roles";

// Importar middleware de errores
import { errorHandler } from "./middlewares/error.middleware";

// Inicializar conexión a la DB (importar activa el pool y muestra el log)
import "./config/database";

const app = express();
const PORT = parseInt(process.env.PORT || "3000");

// Seguridad
app.use(helmet());

// Trazabilidad con Correlation ID en todas las peticiones
app.use(correlationMiddleware);

// Configuración de CORS segura con exposición de headers de descarga (sin exponer ni permitir secretos internos a clientes públicos)
const corsOrigin =
  process.env.NODE_ENV === "production"
    ? process.env.APP_PUBLIC_URL || "http://localhost:5173"
    : "*";

app.use(
  cors({
    origin: corsOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Correlation-ID"],
    exposedHeaders: ["Content-Disposition", "Content-Length", "X-Correlation-ID"],
  }),
);

const isProduction = process.env.NODE_ENV === "production";

// Rate limiting listo para producción y configurable por .env
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProduction ? parseInt(process.env.RATE_LIMIT_MAX || "5000") : 100000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Demasiadas solicitudes, intenta más tarde" },
  }),
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? parseInt(process.env.AUTH_LIMIT_MAX || "200") : 100000,
  message: {
    message: "Demasiados intentos de autenticación, espera 15 minutos",
  },
});

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Swagger UI
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "ShareNotes API Docs",
    customCss: ".topbar { display: none }",
    swaggerOptions: { persistAuthorization: true }, // recuerda el token entre recargas
  }),
);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    project: "ShareNotes API",
    version: "1.0.0",
    correlationId: req.correlationId,
    timestamp: new Date().toISOString(),
  });
});

// Rutas
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", teacherRoutes);
app.use("/api", moderatorRoutes);
app.use("/api/roles", rolesRouter);

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada", correlationId: req.correlationId });
});

// Manejo global de errores
app.use(errorHandler);

// Iniciar servidor solo si no estamos en entorno de pruebas
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`ShareNotes API corriendo en http://localhost:${PORT}/api`);
    logger.info(`Swagger UI disponible en http://localhost:${PORT}/api/docs`);
    logger.info(`Entorno: ${process.env.NODE_ENV || "development"}`);
  });
}

export default app;
