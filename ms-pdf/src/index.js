require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const logger = require('./logger');
const { generatePDF } = require('./pdfGenerator');

const app = express();
const PORT = process.env.PORT || 4001;
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
        callback(new Error('CORS bloqueado: origen no autorizado para MS-PDF'));
      }
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'X-Internal-Secret', 'X-Correlation-ID'],
    exposedHeaders: ['Content-Disposition', 'Content-Length', 'X-Correlation-ID'],
  })
);

app.use(express.json({ limit: '10mb' }));

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
  res.status(200).json({ status: 'OK', service: 'MS-PDF', correlationId: req.correlationId });
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

// Endpoint principal para generar PDFs (protegido por X-Internal-Secret)
app.post('/generate', (req, res) => {
  const data = req.body;
  const correlationId = req.correlationId;

  if (!data || Object.keys(data).length === 0) {
    logger.warn('Petición recibida sin datos para generar PDF', { correlationId });
    return res.status(400).json({ error: 'Datos no proporcionados para generar el PDF', correlationId });
  }

  logger.info(`Iniciando generación de PDF para usuario: ${data.username || 'Desconocido'} (${(data.notes && data.notes.length) || 0} notas)`, {
    correlationId,
  });

  generatePDF(
    data,
    (pdfBuffer) => {
      logger.info(`PDF generado exitosamente (${pdfBuffer.length} bytes)`, { correlationId });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=reporte.pdf');
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    },
    (error) => {
      logger.error('Error interno al generar PDF', {
        correlationId,
        error: error.message || error,
      });
      res.status(500).json({ error: 'Error interno al generar el PDF', correlationId });
    }
  );
});

const server = app.listen(PORT, () => {
  logger.info(`MS-PDF (Microservicio de PDFs) corriendo en el puerto ${PORT}`);
  logger.info('Seguridad interna: X-Internal-Secret habilitado');
});

module.exports = app;
