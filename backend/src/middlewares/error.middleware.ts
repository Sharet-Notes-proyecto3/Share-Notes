// src/middlewares/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const correlationId = req?.correlationId || (req?.headers?.['x-correlation-id'] as string) || 'unknown-cid';

  if (err instanceof AppError) {
    logger.error(`AppError [${err.statusCode}]: ${err.message}`, {
      correlationId,
      status: err.statusCode,
      message: err.message,
      url: req?.originalUrl || req?.url,
      method: req?.method,
    });
    res.status(err.statusCode).json({ message: err.message, correlationId });
    return;
  }

  // Errores de multer (subida de archivos)
  if (err.name === 'MulterError') {
    const status = 400;
    const message = `Error de archivo: ${err.message}`;
    logger.error(`MulterError [${status}]: ${message}`, {
      correlationId,
      status,
      message,
      url: req?.originalUrl || req?.url,
      method: req?.method,
    });
    res.status(status).json({ message, correlationId });
    return;
  }

  // Error no controlado / interno
  const status = 500;
  const message = 'Error interno del servidor';
  logger.error(`Error no controlado [${status}]: ${err.message}`, {
    correlationId,
    status,
    message: err.message,
    stack: err.stack,
    url: req?.originalUrl || req?.url,
    method: req?.method,
  });

  res.status(status).json({ message, correlationId });
}
