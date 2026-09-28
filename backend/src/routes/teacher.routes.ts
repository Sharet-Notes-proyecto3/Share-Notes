// src/routes/teacher.routes.ts
import { Router } from 'express';
import * as teacherCtrl from '../controllers/teacher.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requirePermission } from '../roles/roles.middleware';
import { isTeacherOfCourse } from '../middlewares/teacher.middleware';

const router = Router();

// GET /api/teacher/courses — obtener materias asignadas al docente autenticado
router.get(
  '/teacher/courses',
  authMiddleware,
  requirePermission('reports:course_pdf'),
  teacherCtrl.getMyCourses
);

// POST /api/reports/pdf/course — generar reporte PDF del curso asignado
router.post(
  '/reports/pdf/course',
  authMiddleware,
  requirePermission('reports:course_pdf'),
  isTeacherOfCourse,
  teacherCtrl.generateCourseReport
);

// Acciones contextuales sobre foro de la materia asignada
router.put(
  '/forum/answers/:id/mark-solution',
  authMiddleware,
  requirePermission('forum:mark_solution'),
  isTeacherOfCourse,
  teacherCtrl.markSolution
);

router.post(
  '/forum/posts/:id/close',
  authMiddleware,
  requirePermission('forum:close_thread'),
  isTeacherOfCourse,
  teacherCtrl.closeThread
);

export default router;
