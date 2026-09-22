import { Request, Response, NextFunction } from 'express';
import { RolesService } from './roles.service';
import { Role } from './roles.definition';

const service = new RolesService();

const VALID_ROLES: Role[] = ['student', 'teacher', 'moderator', 'admin'];

// PATCH /api/roles/:id  — asignar rol a un usuario
export const assignRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role } = req.body;
    if (!role || !VALID_ROLES.includes(role)) {
      res.status(400).json({
        message: `Rol inválido. Opciones válidas: ${VALID_ROLES.join(', ')}`,
      });
      return;
    }
    const result = await service.assignRole(
      parseInt(req.params.id),
      role as Role,
      req.user!.userId
    );
    res.json(result);
  } catch (err) { next(err); }
};

// GET /api/roles/users  — listar usuarios con sus roles
export const listUsersWithRoles = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await service.listUsersWithRoles();
    res.json(users);
  } catch (err) { next(err); }
};

// GET /api/roles/my-permissions  — ver permisos del usuario autenticado
export const getMyPermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.getUserPermissions(req.user!.userId);
    res.json(result);
  } catch (err) { next(err); }
};
