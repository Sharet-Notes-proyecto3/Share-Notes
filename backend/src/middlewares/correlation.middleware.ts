// src/middlewares/correlation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

import '../types';

const CORRELATION_REGEX = /^[A-Za-z0-9._-]{8,64}$/;

export function correlationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingCorrelationId = req.headers['x-correlation-id'];
  const candidate = Array.isArray(incomingCorrelationId) ? incomingCorrelationId[0] : incomingCorrelationId;
  const correlationId =
    candidate && typeof candidate === 'string' && CORRELATION_REGEX.test(candidate)
      ? candidate
      : uuidv4();

  req.correlationId = correlationId;
  req.headers['x-correlation-id'] = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);

  // Registrar inicio de la solicitud con logger estructurado
  logger.info(`HTTP ${req.method} ${req.originalUrl || req.url}`, {
    correlationId,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  next();
}
