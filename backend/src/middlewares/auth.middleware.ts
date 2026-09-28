// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';
import { Role, ROLE_PERMISSION_SETS } from '../roles/roles.definition';
import logger from '../utils/logger';

// Validar que JWT_SECRET esté configurado al importar este módulo
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  logger.error('FATAL: La variable de entorno JWT_SECRET no está definida en .env');
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers && req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
  const correlationId = req.correlationId || (req.headers && (req.headers['x-correlation-id'] as string));

  if (!token) {
    res.status(401).json({ message: 'Token de acceso requerido', correlationId });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ message: 'Error interno: configuración de seguridad incompleta', correlationId });
      return;
    }
    const payload = jwt.verify(token, secret) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado', correlationId });
  }
}

// Guard que exige rol de administrador (envoltorio delgado sobre ROLE_PERMISSION_SETS)
export function adminGuard(req: Request, res: Response, next: NextFunction): void {
  const correlationId = req.correlationId;
  const role = req.user?.role as Role | undefined;
  if (!role || role !== 'admin') {
    res.status(403).json({ message: 'Acceso denegado: se requiere rol admin', correlationId });
    return;
  }
  next();
}

// Guard genérico para roles específicos utilizando la definición única de Role
export function roleGuard(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const correlationId = req.correlationId;
    const role = req.user?.role as Role | undefined;
    if (!role || !roles.some((r) => r === role && ROLE_PERMISSION_SETS[r])) {
      res.status(403).json({ message: `Acceso denegado: rol requerido [${roles.join(', ')}]`, correlationId });
      return;
    }
    next();
  };
}
