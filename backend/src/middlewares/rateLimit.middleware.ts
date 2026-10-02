// src/middlewares/rateLimit.middleware.ts
import rateLimit from 'express-rate-limit';
import { Request } from 'express';

/**
 * Limitador de tasa específico para subida de archivos (apuntes).
 * Ventana: 15 minutos.
 * Máximo: 20 peticiones (configurable vía UPLOAD_LIMIT_MAX).
 * Discriminación por req.user.userId para evitar bloqueos masivos en redes NAT universitarias.
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.UPLOAD_LIMIT_MAX || '20'),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.userId;
    return userId ? `upload_user_${userId}` : req.ip || 'unknown';
  },
  message: {
    message: 'Has alcanzado el límite de 20 subidas en 15 minutos. Intenta de nuevo más tarde.',
  },
});
