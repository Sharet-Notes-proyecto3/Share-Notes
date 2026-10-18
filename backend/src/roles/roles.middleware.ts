import { Request, Response, NextFunction } from 'express';
import { Role, Permission } from './roles.definition';
import { hasPermission, hasAnyPermission, isRoleAtLeast } from './roles.utils';

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.user?.role as Role | undefined;
    if (!role || !hasPermission(role, permission)) {
      res.status(403).json({
        message: `Acceso denegado. Se requiere el permiso: ${permission}`,
        correlationId: req.correlationId,
      });
      return;
    }
    next();
  };
}

export function requireAnyPermission(permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.user?.role as Role | undefined;
    if (!role || !hasAnyPermission(role, permissions)) {
      res.status(403).json({
        message: `Acceso denegado. Se requiere uno de: ${permissions.join(', ')}`,
        correlationId: req.correlationId,
      });
      return;
    }
    next();
  };
}

export function requireRole(minimumRole: Role) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.user?.role as Role | undefined;
    if (!role || !isRoleAtLeast(role, minimumRole)) {
      res.status(403).json({
        message: `Acceso denegado. Se requiere rol: ${minimumRole} o superior`,
        correlationId: req.correlationId,
      });
      return;
    }
    next();
  };
}
