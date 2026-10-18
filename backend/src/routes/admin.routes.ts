// src/routes/admin.routes.ts
import { Router } from 'express';
import * as ctrl from '../controllers/admin.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requirePermission } from '../roles/roles.middleware';

const router = Router();

// Todas las rutas de admin requieren autenticación
router.use(authMiddleware);

// ─── Usuarios ──────────────────────────────────────────────────────────────
// GET    /api/admin/users           — listar todos los usuarios
router.get('/users', requirePermission('users:view_list'), ctrl.listUsers);

// PATCH  /api/admin/users/:id/toggle — suspender / reactivar usuario
router.patch('/users/:id/toggle', requirePermission('users:toggle_status'), ctrl.toggleUser);

// PATCH  /api/admin/users/:id/role   — cambiar rol de usuario
router.patch('/users/:id/role', requirePermission('users:assign_roles'), ctrl.changeUserRole);

// POST   /api/admin/users           — crear cuenta de personal (docente o moderador)
router.post('/users', requirePermission('users:create'), ctrl.createStaffUser);

// PATCH  /api/admin/users/:id/courses — asignar / editar materias a docente
router.patch('/users/:id/courses', requirePermission('users:assign_courses'), ctrl.updateTeacherCourses);

// ─── Reportes ──────────────────────────────────────────────────────────────
// GET    /api/admin/reports          — listar reportes (query: ?status=pending)
router.get('/reports', requirePermission('reports:view_all'), ctrl.listReports);

// PATCH  /api/admin/reports/:id      — resolver reporte
// Body: { status: 'reviewed' | 'dismissed' }
router.patch('/reports/:id', requirePermission('reports:resolve'), ctrl.resolveReport);

// ─── Eliminación de contenido ──────────────────────────────────────────────
// DELETE /api/admin/notes/:id        — eliminar apunte
router.delete('/notes/:id', requirePermission('notes:delete_any'), ctrl.deleteNote);

// DELETE /api/admin/threads/:id      — eliminar hilo
router.delete('/threads/:id', requirePermission('forum:delete_any'), ctrl.deleteThread);

// DELETE /api/admin/replies/:id      — eliminar respuesta
router.delete('/replies/:id', requirePermission('forum:delete_any'), ctrl.deleteReply);

// ─── Sanciones ─────────────────────────────────────────────────────────────
// GET    /api/admin/sanctions        — listar sanciones (query: ?userId=5)
router.get('/sanctions', requirePermission('sanctions:view_history'), ctrl.listSanctions);

// POST   /api/admin/sanctions        — aplicar sanción
// Body: { userId, type: 'warning'|'temp_ban'|'perm_ban', reason, expiresAt? }
router.post('/sanctions', requirePermission('sanctions:apply_warning'), ctrl.applySanction);

// ─── QR ────────────────────────────────────────────────────────────────────
// GET    /api/admin/qr               — generar código QR de la plataforma
router.get('/qr', requirePermission('qr:generate'), ctrl.generateQR);

// ─── Catálogo Académico ───────────────────────────────────────────────────
// GET    /api/admin/catalog           — obtener catálogo completo (carreras y materias)
router.get('/catalog', requirePermission('subjects:view'), ctrl.getCatalog);

// POST   /api/admin/catalog/careers   — crear carrera
router.post('/catalog/careers', requirePermission('careers:create'), ctrl.createCareer);

// POST   /api/admin/catalog/subjects  — crear materia
router.post('/catalog/subjects', requirePermission('subjects:create'), ctrl.createSubject);

// DELETE /api/admin/catalog/subjects/:id — eliminar materia
router.delete('/catalog/subjects/:id', requirePermission('subjects:create'), ctrl.deleteSubject);

// DELETE /api/admin/catalog/careers/:id  — eliminar carrera
router.delete('/catalog/careers/:id', requirePermission('careers:create'), ctrl.deleteCareer);

export default router;
