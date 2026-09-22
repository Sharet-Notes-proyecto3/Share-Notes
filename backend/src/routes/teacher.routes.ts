// src/routes/teacher.routes.ts
import { Router } from 'express';
import * as teacherCtrl from '../controllers/teacher.controller';
import { authMiddleware, roleGuard } from '../middlewares/auth.middleware';
import { isTeacherOfCourse } from '../middlewares/teacher.middleware';

const router = Router();

// Todas las rutas de docentes requieren autenticación + rol teacher o admin
router.use(authMiddleware, roleGuard('teacher', 'admin'));

// GET /api/teacher/courses — obtener materias asignadas al docente autenticado
router.get('/teacher/courses', teacherCtrl.getMyCourses);

// POST /api/reports/pdf/course — generar reporte PDF del curso asignado
router.post('/reports/pdf/course', isTeacherOfCourse, teacherCtrl.generateCourseReport);

// Alias directo para rutas de conveniencia
router.put('/notes/:id/verify', isTeacherOfCourse, teacherCtrl.verifyNote);
router.put('/forum/answers/:id/mark-solution', isTeacherOfCourse, teacherCtrl.markSolution);
router.post('/forum/posts/:id/close', isTeacherOfCourse, teacherCtrl.closeThread);

export default router;
