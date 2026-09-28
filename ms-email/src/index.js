require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const logger = require('./logger');
const { sendNoteNotification } = require('./mailer');

const app = express();
const PORT = process.env.PORT || 4002;
const isProduction = process.env.NODE_ENV === 'production';

// Validación segura de secreto interno: sin valor hardcodeado por defecto
let internalSecret = process.env.INTERNAL_SERVICE_SECRET;
if (!internalSecret) {
  if (isProduction) {
    logger.error('FATAL: INTERNAL_SERVICE_SECRET no está definida en entorno de producción');
    process.exit(1);
  } else {
    logger.warn('⚠️ INTERNAL_SERVICE_SECRET no está definida en desarrollo. Usando secreto temporal insecure-dev-secret');
    internalSecret = 'insecure-dev-secret';
  }
}
const INTERNAL_SERVICE_SECRET = internalSecret;

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// Configurar CORS estricto para aceptar únicamente el origen del backend
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin === BACKEND_URL || origin === 'http://localhost:3000') {
        callback(null, true);
      } else {
        callback(new Error('CORS bloqueado: origen no autorizado para MS-Email'));
      }
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'X-Internal-Secret', 'X-Correlation-ID'],
    exposedHeaders: ['Content-Disposition', 'Content-Length', 'X-Correlation-ID'],
  })
);

app.use(express.json());

// Regex para validar formato seguro de X-Correlation-ID (8-64 caracteres alfanuméricos, guiones, puntos)
const CORRELATION_REGEX = /^[A-Za-z0-9._-]{8,64}$/;

function validateCorrelationId(rawId) {
  const candidate = Array.isArray(rawId) ? rawId[0] : rawId;
  if (candidate && typeof candidate === 'string' && CORRELATION_REGEX.test(candidate)) {
    return candidate;
  }
  return crypto.randomUUID();
}

// Middleware para extraer, validar, asignar y loguear X-Correlation-ID
app.use((req, res, next) => {
  const correlationId = validateCorrelationId(req.headers['x-correlation-id']);
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);

  logger.info(`Entrada de petición: ${req.method} ${req.url}`, {
    correlationId,
    ip: req.ip,
  });
  next();
});

// Endpoint de prueba de salud (público para monitoreo interno)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'MS-Email', correlationId: req.correlationId });
});

// Middleware de seguridad de servicio a servicio: exige X-Internal-Secret
const requireInternalSecret = (req, res, next) => {
  const secret = req.headers['x-internal-secret'];
  if (!secret || secret !== INTERNAL_SERVICE_SECRET) {
    logger.warn('Intento de acceso denegado: Cabecera X-Internal-Secret inválida o ausente', {
      correlationId: req.correlationId,
      ip: req.ip,
    });
    return res.status(403).json({
      error: 'Acceso denegado: Cabecera X-Internal-Secret inválida o ausente',
      correlationId: req.correlationId,
    });
  }
  next();
};

app.use(requireInternalSecret);

// Endpoint principal para enviar notificación de nuevo apunte (protegido)
app.post('/notify', async (req, res) => {
  const { to, uploaderName, noteTitle, subjectName } = req.body;
  const correlationId = req.correlationId;

  // Validar datos requeridos
  if (!to || !noteTitle) {
    logger.warn('Petición de notificación incompleta', {
      correlationId,
      missingFields: { to: !to, noteTitle: !noteTitle },
    });
    return res.status(400).json({
      error: 'Campos requeridos: "to" (email destino) y "noteTitle"',
      correlationId,
    });
  }

  // Validación básica de formato de correo
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    logger.warn(`Formato de correo inválido: ${to}`, { correlationId });
    return res.status(400).json({
      error: 'El campo "to" no tiene un formato de correo electrónico válido',
      correlationId,
    });
  }

  try {
    logger.info(`Enviando notificación por email a ${to}`, {
      correlationId,
      noteTitle,
      uploaderName,
    });

    const result = await sendNoteNotification({
      to,
      uploaderName: uploaderName || 'Un compañero',
      noteTitle,
      subjectName: subjectName || 'Sin especificar',
    });

    logger.info(`Email enviado exitosamente a ${to}`, {
      correlationId,
      messageId: result.messageId,
      previewUrl: result.previewUrl || null,
    });

    res.status(200).json({
      message: 'Notificación enviada exitosamente',
      correlationId,
      ...result,
    });
  } catch (error) {
    logger.error('Error al enviar email en MS-Email', {
      correlationId,
      errorMessage: error.message,
    });
    res.status(500).json({ error: 'Error interno al enviar la notificación', correlationId });
  }
});

const server = app.listen(PORT, () => {
  logger.info(`MS-Email (Microservicio de Notificaciones) corriendo en el puerto ${PORT}`);
  logger.info('Seguridad interna: X-Internal-Secret habilitado');
});

module.exports = app;
