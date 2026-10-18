// src/routes/preferences.routes.ts
import { Router } from 'express';
import * as ctrl from '../controllers/preferences.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requirePermission } from '../roles/roles.middleware';

const router = Router();

// Todas las rutas de preferencias requieren autenticación
router.use(authMiddleware);

// GET /api/preferences — leer mis preferencias
router.get('/', requirePermission('auth:view_own_profile'), ctrl.getPreferences);

// PUT /api/preferences — guardar mis preferencias
// Body: { emailNotifications: boolean }
router.put('/', requirePermission('auth:edit_own_profile'), ctrl.updatePreferences);

export default router;