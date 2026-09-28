// src/routes/forum.routes.ts
import { Router } from 'express';
import * as ctrl from '../controllers/forum.controller';
import * as teacherCtrl from '../controllers/teacher.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requirePermission } from '../roles/roles.middleware';
import { isTeacherOfCourse } from '../middlewares/teacher.middleware';

const router = Router();

// Todas las rutas del foro requieren autenticación
router.use(authMiddleware);

// GET  /api/forum           — listar hilos (query: ?subjectId=1)
router.get('/', ctrl.listThreads);

// POST /api/forum           — crear hilo
// Body: { title, body, subjectId }
router.post('/', requirePermission('forum:create_thread'), ctrl.createThread);

// GET  /api/forum/:id       — ver hilo con sus respuestas
router.get('/:id', ctrl.getThread);

// POST /api/forum/:id/reply — responder a un hilo
// Body: { body }
router.post('/:id/reply', requirePermission('forum:reply'), ctrl.createReply);

// POST /api/forum/replies/:id/vote — votar respuesta
router.post('/replies/:id/vote', ctrl.voteReply);

// PUT  /api/forum/answers/:id/mark-solution — marcar respuesta como solución (docente asignado o admin)
router.put('/answers/:id/mark-solution', requirePermission('forum:mark_solution'), isTeacherOfCourse, teacherCtrl.markSolution);

// POST /api/forum/posts/:id/close — cerrar hilo de discusión (docente asignado o admin)
router.post('/posts/:id/close', requirePermission('forum:close_thread'), isTeacherOfCourse, teacherCtrl.closeThread);

// DELETE /api/forum/replies/:id — eliminar un comentario/respuesta
router.delete('/replies/:id', ctrl.deleteReply);

// DELETE /api/forum/:id         — eliminar un hilo de discusión
router.delete('/:id', ctrl.deleteThread);

// POST /api/forum/report    — reportar contenido
// Body: { targetType: 'note'|'thread'|'reply', targetId, reason }
router.post('/report', requirePermission('reports:create'), ctrl.reportContent);

export default router;
