import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

// Cargar variables de entorno lo primero
dotenv.config();

// Importa rutas
import authRoutes from "./routes/auth.routes";
import noteRoutes from "./routes/note.routes";
import forumRoutes from "./routes/forum.routes";
import adminRoutes from "./routes/admin.routes";
import { rolesRouter } from "./roles";

// Importar middleware de errores
import { errorHandler } from "./middlewares/error.middleware";

// Inicializar conexión a la DB (importar activa el pool y muestra el log)
import "./config/database";

const app = express();
const PORT = parseInt(process.env.PORT || "3000");

//Seguridad
app.use(helmet());

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production" ? process.env.APP_PUBLIC_URL : "*", // En desarrollo acepta cualquier origen
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
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

//Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    project: "ShareNotes API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

//Rutas
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/roles", rolesRouter);

//Ruta no encontrada
app.use((_req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

// Manejo global de errores
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log("");
  console.log("ShareNotes API corriendo");
  console.log(`http://localhost:${PORT}/api`);
  console.log(`Swagger UI: http://localhost:${PORT}/api/docs`);
  console.log(`Entorno: ${process.env.NODE_ENV || "development"}`);
  console.log("");
});

export default app;
