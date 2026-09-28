// src/routes/moderator.routes.ts
import { Router } from 'express';
import * as ctrl from '../controllers/moderator.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requirePermission } from '../roles/roles.middleware';

const router = Router();

// ─── Reportes / Denuncias ──────────────────────────────────────────────────
// GET /api/reports — listar denuncias (query opcional: ?status=pending)
router.get(
  '/reports',
  authMiddleware,
  requirePermission('reports:view_all'),
  ctrl.listReports
);

// PUT /api/reports/:id/resolve — marcar denuncia como atendida
router.put(
  '/reports/:id/resolve',
  authMiddleware,
  requirePermission('reports:resolve'),
  ctrl.resolveReport
);

// PUT /api/reports/:id/dismiss — descartar denuncia sin acción
router.put(
  '/reports/:id/dismiss',
  authMiddleware,
  requirePermission('reports:dismiss'),
  ctrl.dismissReport
);

// ─── Moderación de Contenido ───────────────────────────────────────────────
// PUT /api/notes/:id/moderate-status — ocultar/bloquear apunte denunciado
router.put(
  '/notes/:id/moderate-status',
  authMiddleware,
  requirePermission('notes:moderate_status'),
  ctrl.moderateNoteStatus
);

// DELETE /api/forum/posts/:id/moderate — eliminar publicación que viole términos
router.delete(
  '/forum/posts/:id/moderate',
  authMiddleware,
  requirePermission('forum:moderate_delete'),
  ctrl.moderateDeletePost
);

// ─── Gestión de Usuarios Infractores ───────────────────────────────────────
// PUT /api/users/:id/restrict — restricción temporal de participación en foro
router.put(
  '/users/:id/restrict',
  authMiddleware,
  requirePermission('users:restrict'),
  ctrl.restrictUser
);

// GET /api/moderation/logs — historial de logs de moderación
router.get(
  '/moderation/logs',
  authMiddleware,
  requirePermission('moderation:view_logs'),
  ctrl.getModerationLogs
);

// GET /api/admin/moderation-logs — historial de logs de moderación (alias para compatibilidad)
router.get(
  '/admin/moderation-logs',
  authMiddleware,
  requirePermission('moderation:view_logs'),
  ctrl.getModerationLogs
);

export default router;
