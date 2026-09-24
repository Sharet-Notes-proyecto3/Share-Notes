// src/routes/moderator.routes.ts
import { Router } from 'express';
import * as ctrl from '../controllers/moderator.controller';
import { authMiddleware, roleGuard } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas de moderación requieren autenticación + rol moderator o admin
router.use(authMiddleware, roleGuard('moderator', 'admin'));

// ─── Reportes / Denuncias ──────────────────────────────────────────────────
// GET /api/reports — listar denuncias (query opcional: ?status=pending)
router.get('/reports', ctrl.listReports);

// PUT /api/reports/:id/resolve — marcar denuncia como atendida
router.put('/reports/:id/resolve', ctrl.resolveReport);

// PUT /api/reports/:id/dismiss — descartar denuncia sin acción
router.put('/reports/:id/dismiss', ctrl.dismissReport);

// ─── Moderación de Contenido ───────────────────────────────────────────────
// PUT /api/notes/:id/moderate-status — ocultar/bloquear apunte denunciado
router.put('/notes/:id/moderate-status', ctrl.moderateNoteStatus);

// DELETE /api/forum/posts/:id/moderate — eliminar publicación que viole términos
router.delete('/forum/posts/:id/moderate', ctrl.moderateDeletePost);

// ─── Gestión de Usuarios Infractores ───────────────────────────────────────
// PUT /api/users/:id/restrict — restricción temporal de participación en foro
router.put('/users/:id/restrict', ctrl.restrictUser);

// GET /api/moderation/logs — historial de logs de moderación
router.get('/moderation/logs', ctrl.getModerationLogs);

// GET /api/admin/moderation-logs — historial de logs de moderación (alias para compatibilidad)
router.get('/admin/moderation-logs', ctrl.getModerationLogs);

export default router;
