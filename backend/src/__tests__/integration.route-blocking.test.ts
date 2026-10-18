// src/__tests__/integration.route-blocking.test.ts
// Pruebas de integración con Supertest para verificar el fin del bloqueo de rutas Express
// y validar la segregación correcta de roles (RBAC/ABAC)

process.env.JWT_SECRET = 'test-jwt-secret-route-blocking-2026';
process.env.NODE_ENV = 'test';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
    getConnection: jest.fn().mockResolvedValue({
      release: jest.fn(),
    }),
  },
}));

jest.mock('../services/audit.service', () => ({
  logAuditAction: jest.fn().mockResolvedValue(undefined),
}));

import request from 'supertest';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import app from '../index';

const secret = process.env.JWT_SECRET!;

const createToken = (role: string, userId = 1) =>
  jwt.sign({ userId, email: `${role}@sharenotes.edu`, role }, secret, { expiresIn: '1h' });

const moderatorToken = createToken('moderator', 3);
const studentToken = createToken('student', 4);
const teacherToken = createToken('teacher', 2);

describe('🚦 Verificación de Integración: Prevención de Bloqueo de Rutas y Matriz RBAC', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. moderador → GET /api/reports = 200
  test('TEST 1 | Moderador accede correctamente a GET /api/reports (200 OK) sin ser bloqueado por teacherRoutes', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce([
      [
        {
          id: 1,
          reporter_id: 4,
          reporter_name: 'Estudiante Juan',
          target_type: 'note',
          target_id: 10,
          reason: 'Contenido no académico',
          status: 'pending',
          created_at: new Date().toISOString(),
        },
      ],
    ]);

    const res = await request(app)
      .get('/api/reports')
      .set('Authorization', `Bearer ${moderatorToken}`)
      .set('X-Correlation-ID', 'test-cid-moderator-reports');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].id).toBe(1);
  });

  // 2. estudiante → GET /api/roles/my-permissions = 200
  test('TEST 2 | Estudiante accede a sus permisos en GET /api/roles/my-permissions (200 OK) sin ser bloqueado', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce([
      [{ role: 'student' }],
    ]);

    const res = await request(app)
      .get('/api/roles/my-permissions')
      .set('Authorization', `Bearer ${studentToken}`)
      .set('X-Correlation-ID', 'test-cid-student-permissions');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('role', 'student');
    expect(res.body).toHaveProperty('permissions');
    expect(Array.isArray(res.body.permissions)).toBe(true);
    expect(res.body.permissions).toContain('notes:upload');
  });

  // 3. estudiante → GET /api/teacher/courses = 403
  test('TEST 3 | Estudiante recibe 403 Forbidden al intentar acceder a GET /api/teacher/courses', async () => {
    const res = await request(app)
      .get('/api/teacher/courses')
      .set('Authorization', `Bearer ${studentToken}`)
      .set('X-Correlation-ID', 'test-cid-student-forbidden');

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/Acceso denegado/);
    expect(res.body).toHaveProperty('correlationId', 'test-cid-student-forbidden');
  });

  // 4. docente → PUT /api/notes/:id/verify = 200
  test('TEST 4 | Docente asignado verifica un apunte exitosamente en PUT /api/notes/:id/verify (200 OK)', async () => {
    // 1. isTeacherOfCourse consulta notes para obtener subject_id
    (pool.query as jest.Mock).mockResolvedValueOnce([
      [{ subject_id: 1 }],
    ]);
    // 2. isTeacherOfCourse consulta teacher_courses para validar asignación docente-materia
    (pool.query as jest.Mock).mockResolvedValueOnce([
      [{ '1': 1 }],
    ]);
    // 3. teacherService.verifyNote consulta notes
    (pool.query as jest.Mock).mockResolvedValueOnce([
      [{ id: 10, title: 'Apunte Álgebra', subject_id: 1, verified: false }],
    ]);
    // 4. teacherService.verifyNote actualiza notes con verified = TRUE
    (pool.query as jest.Mock).mockResolvedValueOnce([
      { affectedRows: 1 },
    ]);

    const res = await request(app)
      .put('/api/notes/10/verify')
      .set('Authorization', `Bearer ${teacherToken}`)
      .set('X-Correlation-ID', 'test-cid-teacher-verify');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('verified', true);
    expect(res.body).toHaveProperty('verifiedBy', 2);
    expect(res.body).toHaveProperty('noteId', 10);
  });
});
