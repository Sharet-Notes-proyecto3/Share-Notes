// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, UserRole } from '../types';

// Validar que JWT_SECRET esté configurado al importar este módulo
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('⛔ FATAL: La variable de entorno JWT_SECRET no está definida.');
  console.error('   Configúrala en tu archivo .env antes de iniciar el servidor.');
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    res.status(401).json({ message: 'Token de acceso requerido' });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ message: 'Error interno: configuración de seguridad incompleta' });
      return;
    }
    const payload = jwt.verify(token, secret) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

// Guard que exige rol de administrador
export function adminGuard(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'Acceso denegado: se requiere rol admin' });
    return;
  }
  next();
}

// Guard genérico para roles específicos
export function roleGuard(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: `Acceso denegado: rol requerido [${roles.join(', ')}]` });
      return;
    }
    next();
  };
}
