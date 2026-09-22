// src/routes/note.routes.ts
import { Router } from 'express';
import * as ctrl from '../controllers/note.controller';
import * as teacherCtrl from '../controllers/teacher.controller';
import { authMiddleware, roleGuard } from '../middlewares/auth.middleware';
import { isTeacherOfCourse } from '../middlewares/teacher.middleware';
import { uploadNote } from '../middlewares/upload.middleware';

const router = Router();

// Todas las rutas de apuntes requieren autenticación
router.use(authMiddleware);

// GET  /api/notes/subjects  — lista de materias disponibles
router.get('/subjects', ctrl.listSubjects);

// GET  /api/notes/report    — generar reporte PDF de mis apuntes (vía MS-PDF)
router.get('/report', ctrl.generateReport);

// GET  /api/notes/microservices/status — estado de los microservicios
router.get('/microservices/status', ctrl.microservicesStatus);

// GET  /api/notes           — listar apuntes (con filtros opcionales)
// Query params: ?subjectId=1 &semester=3 &careerId=1 &search=calculo
router.get('/', ctrl.listNotes);

// POST /api/notes           — subir un apunte
// Form-data: file, title, description (opcional), subjectId
router.post('/', uploadNote, ctrl.uploadNote);

// GET  /api/notes/:id/download  — descargar archivo
router.get('/:id/download', ctrl.downloadNote);

// PUT  /api/notes/:id/verify    — verificar apunte (docente asignado o admin)
router.put('/:id/verify', roleGuard('teacher', 'admin'), isTeacherOfCourse, teacherCtrl.verifyNote);

// DELETE /api/notes/:id     — eliminar (dueño o admin)
router.delete('/:id', ctrl.deleteNote);

export default router;


