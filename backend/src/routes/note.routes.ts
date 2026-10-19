import { Router } from 'express';
import * as ctrl from '../controllers/note.controller';
import * as teacherCtrl from '../controllers/teacher.controller';
import { authMiddleware, optionalAuthMiddleware, adminGuard } from '../middlewares/auth.middleware';
import { requirePermission } from '../roles/roles.middleware';
import { isTeacherOfCourse } from '../middlewares/teacher.middleware';
import { uploadNote } from '../middlewares/upload.middleware';
import { uploadLimiter } from '../middlewares/rateLimit.middleware';

const router = Router();

// Rutas públicas / descarga (permiten autenticación opcional o descarga directa)
// GET  /api/notes/:id/download  — descargar archivo o vista previa
router.get('/:id/download', optionalAuthMiddleware, ctrl.downloadNote);

// A partir de aquí, las rutas requieren autenticación obligatoria
router.use(authMiddleware);

// GET  /api/notes/subjects  — lista de materias disponibles
router.get('/subjects', requirePermission('subjects:view'), ctrl.listSubjects);

// GET  /api/notes/report    — generar reporte PDF (vía MS-PDF) — EXCLUSIVO ADMINISTRADOR
router.get('/report', adminGuard, ctrl.generateReport);

// GET  /api/notes/microservices/status — estado de los microservicios (diagnóstico reservado a roles de gestión/auditoría: moderador y admin)
router.get('/microservices/status', requirePermission('moderation:view_logs'), ctrl.microservicesStatus);

// GET  /api/notes           — listar apuntes (con filtros opcionales)
// Query params: ?subjectId=1 &semester=3 &careerId=1 &search=calculo
router.get('/', requirePermission('notes:search'), ctrl.listNotes);

// POST /api/notes           — subir un apunte (con rate limit de 20 subidas/15min)
// Form-data: file, title, description (opcional), subjectId
router.post('/', requirePermission('notes:upload'), uploadLimiter, uploadNote, ctrl.uploadNote);

// PUT  /api/notes/:id/verify    — verificar apunte (docente asignado o admin)
router.put('/:id/verify', requirePermission('notes:verify'), isTeacherOfCourse, teacherCtrl.verifyNote);

// DELETE /api/notes/:id     — eliminar (dueño o admin)
router.delete('/:id', ctrl.deleteNote);

export default router;
