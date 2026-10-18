import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requirePermission } from './roles.middleware';
import * as ctrl from './roles.controller';
import { changeUserRole } from '../controllers/admin.controller';

const router = Router();

// Todas las rutas requieren estar autenticado
router.use(authMiddleware);

// Cualquier usuario puede ver sus propios permisos
router.get('/my-permissions', ctrl.getMyPermissions);

// Solo administrador puede ver la lista de usuarios con roles
router.get('/users', requirePermission('users:view_list'), ctrl.listUsersWithRoles);

// Endpoint unificado para cambio de roles: delega directamente al controlador oficial de administración
// Fuente única de verdad: admin.service.changeUserRole
router.patch('/:id', requirePermission('users:assign_roles'), changeUserRole);

export default router;
