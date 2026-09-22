// src/__tests__/teacher.rbac.test.ts
// Test suite unitario para el rol TEACHER con control de acceso RBAC + ABAC

import { roleGuard, adminGuard } from '../middlewares/auth.middleware';
import { isTeacherOfCourse } from '../middlewares/teacher.middleware';
import { TeacherService } from '../services/teacher.service';

// Mock del pool de la base de datos
jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

// Mock del servicio de auditoría
jest.mock('../services/audit.service', () => ({
  logAuditAction: jest.fn().mockResolvedValue(undefined),
}));

// Mock del cliente de microservicios
jest.mock('../utils/microservicesClient', () => ({
  generatePdfReport: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4 Fake PDF Content')),
}));

import pool from '../config/database';

function mockReq(userRole: 'student' | 'teacher' | 'admin', userId = 10, params = {}, body = {}, baseUrl = '/api/notes', path = '/1/verify') {
  return {
    user: { userId, email: `${userRole}@uni.edu.co`, role: userRole },
    params,
    body,
    query: {},
    baseUrl,
    path,
  } as any;
}

function mockRes() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  return { res: { status, json } as any, status, json };
}

describe('🧪 Suite de Pruebas Unitarias — Rol TEACHER (RBAC + ABAC)', () => {
  let teacherService: TeacherService;

  beforeEach(() => {
    jest.clearAllMocks();
    teacherService = new TeacherService();
  });

  // 1. Verificación exitosa de apunte por docente asignado a la asignatura
  test('TEA-01 | Debería permitir verificación de apunte a docente asignado a la asignatura', async () => {
    // Simular que el apunte existe y pertenece a subject_id = 5
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[{ id: 1, title: 'Cálculo Avanzado', subject_id: 5, verified: false }]]) // consulta apunte en middleware/service
      .mockResolvedValueOnce([[{ 1: 1 }]]) // consulta teacher_courses en middleware
      .mockResolvedValueOnce([[{ id: 1, title: 'Cálculo Avanzado', subject_id: 5 }]]) // consulta service verifyNote
      .mockResolvedValueOnce([{}]); // UPDATE query

    const req = mockReq('teacher', 10, { id: '1' }, {}, '/api/notes', '/1/verify');
    const { res } = mockRes();
    const next = jest.fn();

    // Ejecutar middleware ABAC isTeacherOfCourse
    await isTeacherOfCourse(req, res, next);
    expect(next).toHaveBeenCalled();

    // Ejecutar lógica de servicio
    const result = await teacherService.verifyNote(1, 10, 'teacher');
    expect(result).toHaveProperty('verified', true);
    expect(result).toHaveProperty('verifiedBy', 10);
  });

  // 2. Verificación denegada por no pertenecer al curso (403)
  test('TEA-02 | Debería denegar verificación (403) si el docente NO está asignado a la asignatura', async () => {
    // Simular apunte en subject_id = 99 y docente NO asignado en teacher_courses
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[{ id: 2, title: 'Química Orgánica', subject_id: 99 }]]) // consulta apunte
      .mockResolvedValueOnce([[]]); // sin asignación en teacher_courses

    const req = mockReq('teacher', 10, { id: '2' }, {}, '/api/notes', '/2/verify');
    const { res, status, json } = mockRes();
    const next = jest.fn();

    await isTeacherOfCourse(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Acceso denegado: no estás asignado a la asignatura de este recurso',
      })
    );
  });

  // 3. Cierre de hilo de discusión en materia asignada
  test('TEA-03 | Debería permitir cerrar un hilo de discusión a un docente de la asignatura', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[{ id: 3, title: 'Duda Ejercicio 4', subject_id: 5 }]]) // consulta hilo
      .mockResolvedValueOnce([[{ 1: 1 }]]) // teacher_courses asignado
      .mockResolvedValueOnce([[{ id: 3, title: 'Duda Ejercicio 4', is_closed: false }]]) // service closeThread
      .mockResolvedValueOnce([{}]); // UPDATE query

    const req = mockReq('teacher', 10, { id: '3' }, {}, '/api/forum/posts', '/3/close');
    const { res } = mockRes();
    const next = jest.fn();

    await isTeacherOfCourse(req, res, next);
    expect(next).toHaveBeenCalled();

    const result = await teacherService.closeThread(3, 10, 'teacher');
    expect(result).toHaveProperty('isClosed', true);
  });

  // 4. Generación de reporte PDF del curso
  test('TEA-04 | Debería generar el reporte PDF del curso para el docente asignado', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[{ id: 5, name: 'Cálculo I' }]]) // subjects
      .mockResolvedValueOnce([[{ name: 'Prof. Carlos' }]]) // users
      .mockResolvedValueOnce([[{ student_id: 1, student_name: 'Ana', notes_count: 3, verified_notes: 2 }]]) // notesStats
      .mockResolvedValueOnce([[{ total_verified: 2 }]]) // total verified
      .mockResolvedValueOnce([[{ student_id: 1, student_name: 'Ana', threads_count: 1, replies_count: 4 }]]); // forumStats

    const pdfBuffer = await teacherService.generateCourseReport(5, 10, 'teacher');
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  // 5. Denegación de acceso (403) a endpoints de administración (/api/admin/*)
  test('TEA-05 | Debería denegar acceso (403) al docente al intentar acceder a endpoints admin', () => {
    const req = mockReq('teacher', 10);
    const { res, status, json } = mockRes();
    const next = jest.fn();

    // Probar adminGuard
    adminGuard(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Acceso denegado: se requiere rol admin' })
    );

    // Probar roleGuard genérico que exige admin
    const guardSoloAdmin = roleGuard('admin');
    guardSoloAdmin(req, res, next);
    expect(status).toHaveBeenCalledWith(403);
  });
});
