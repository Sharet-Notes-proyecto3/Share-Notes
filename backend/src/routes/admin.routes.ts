// src/routes/admin.routes.ts
import { Router } from 'express';
import * as ctrl from '../controllers/admin.controller';
import { authMiddleware, adminGuard } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas de admin requieren autenticación + rol admin
router.use(authMiddleware, adminGuard);

// ─── Usuarios ──────────────────────────────────────────────────────────────
// GET    /api/admin/users           — listar todos los usuarios
router.get('/users', ctrl.listUsers);

// PATCH  /api/admin/users/:id/toggle — suspender / reactivar usuario
router.patch('/users/:id/toggle', ctrl.toggleUser);

// PATCH  /api/admin/users/:id/role   — cambiar rol de usuario
router.patch('/users/:id/role', ctrl.changeUserRole);

// ─── Reportes ──────────────────────────────────────────────────────────────
// GET    /api/admin/reports          — listar reportes (query: ?status=pending)
router.get('/reports', ctrl.listReports);

// PATCH  /api/admin/reports/:id      — resolver reporte
// Body: { status: 'reviewed' | 'dismissed' }
router.patch('/reports/:id', ctrl.resolveReport);

// ─── Eliminación de contenido ──────────────────────────────────────────────
// DELETE /api/admin/notes/:id        — eliminar apunte
router.delete('/notes/:id', ctrl.deleteNote);

// DELETE /api/admin/threads/:id      — eliminar hilo
router.delete('/threads/:id', ctrl.deleteThread);

// DELETE /api/admin/replies/:id      — eliminar respuesta
router.delete('/replies/:id', ctrl.deleteReply);

// ─── Sanciones ─────────────────────────────────────────────────────────────
// GET    /api/admin/sanctions        — listar sanciones (query: ?userId=5)
router.get('/sanctions', ctrl.listSanctions);

// POST   /api/admin/sanctions        — aplicar sanción
// Body: { userId, type: 'warning'|'temp_ban'|'perm_ban', reason, expiresAt? }
router.post('/sanctions', ctrl.applySanction);

// ─── QR ────────────────────────────────────────────────────────────────────
// GET    /api/admin/qr               — generar código QR de la plataforma
router.get('/qr', ctrl.generateQR);

export default router;
