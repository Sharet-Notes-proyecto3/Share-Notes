// backend/src/__tests__/rbac.full-matrix.integration.test.ts
// Suite de pruebas de integración con Supertest para validar la matriz RBAC de los 4 roles
// Cubre: student (5 tests), teacher (3 tests), moderator (4 tests), admin (2 tests) = 14 tests

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-route-blocking-2026';
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

const secret = process.env.JWT_SECRET;

const makeToken = (role: string, userId = 1) =>
  jwt.sign({ userId, email: `${role}@sharenotes.edu`, role }, secret, { expiresIn: '1h' });

const tokens = {
  student: makeToken('student', 10),
  teacher: makeToken('teacher', 20),
  moderator: makeToken('moderator', 30),
  admin: makeToken('admin', 40),
};

describe('🔒 Matriz de Integración RBAC: Validación Sistemática de los 4 Roles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── 1. ROL ESTUDIANTE (student) ───────────────────────────────────────────
  describe('1. Estudiante (student)', () => {
    test('RBAC-01 | Puede acceder a sus notas (/api/notes) -> 200', async () => {
      // Mock 1: consulta del semestre del estudiante en tiempo real desde la BD
      (pool.query as jest.Mock).mockResolvedValueOnce([[{ semester: 3 }]]);
      // Mock 2: consulta SQL principal de notas
      (pool.query as jest.Mock).mockResolvedValueOnce([[]]);

      const res = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${tokens.student}`);

      expect(res.status).toBe(200);
    });

    test('RBAC-02 | NO puede acceder a rutas de administración (/api/admin/users) -> 403', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${tokens.student}`);

      expect(res.status).toBe(403);
    });

    test('RBAC-03 | NO puede resolver reportes (/api/reports/1/resolve) -> 403', async () => {
      const res = await request(app)
        .put('/api/reports/1/resolve')
        .set('Authorization', `Bearer ${tokens.student}`);

      expect(res.status).toBe(403);
    });

    test('RBAC-04 | NO puede verificar notas (/api/notes/1/verify) -> 403', async () => {
      const res = await request(app)
        .put('/api/notes/1/verify')
        .set('Authorization', `Bearer ${tokens.student}`);

      expect(res.status).toBe(403);
    });

    test('RBAC-05 | NO puede ver estado de microservicios (/api/notes/microservices/status) -> 403', async () => {
      const res = await request(app)
        .get('/api/notes/microservices/status')
        .set('Authorization', `Bearer ${tokens.student}`);

      expect(res.status).toBe(403);
    });
  });

  // ─── 2. ROL DOCENTE (teacher) ──────────────────────────────────────────────
  describe('2. Docente (teacher)', () => {
    test('RBAC-06 | Puede acceder a sus cursos asignados (/api/teacher/courses) -> 200', async () => {
      // Mock 1: consulta de cursos asignados al docente
      (pool.query as jest.Mock).mockResolvedValueOnce([
        [{ id: 1, name: 'Cálculo Diferencial', semester: 2, career_name: 'Ingeniería de Sistemas' }],
      ]);

      const res = await request(app)
        .get('/api/teacher/courses')
        .set('Authorization', `Bearer ${tokens.teacher}`);

      expect(res.status).toBe(200);
    });

    test('RBAC-07 | NO puede acceder a usuarios de administración (/api/admin/users) -> 403', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${tokens.teacher}`);

      expect(res.status).toBe(403);
    });

    test('RBAC-08 | NO puede aplicar sanciones disciplinarias (/api/admin/sanctions) -> 403', async () => {
      const res = await request(app)
        .post('/api/admin/sanctions')
        .set('Authorization', `Bearer ${tokens.teacher}`)
        .send({ userId: 10, type: 'warning', reason: 'Falta disciplinaria' });

      expect(res.status).toBe(403);
    });
  });

  // ─── 3. ROL MODERADOR (moderator) ──────────────────────────────────────────
  describe('3. Moderador (moderator)', () => {
    test('RBAC-09 | Puede listar la cola de denuncias (/api/reports) -> 200', async () => {
      // Mock 1: listar denuncias
      (pool.query as jest.Mock).mockResolvedValueOnce([[]]);

      const res = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${tokens.moderator}`);

      expect(res.status).toBe(200);
    });

    test('RBAC-10 | Puede moderar estado de un apunte (/api/notes/1/moderate-status) -> 200', async () => {
      // Mock 1: SELECT id, title, uploader_id FROM notes WHERE id = ?
      (pool.query as jest.Mock).mockResolvedValueOnce([[{ id: 1, title: 'Nota Prueba', uploader_id: 10 }]]);
      // Mock 2: UPDATE notes SET moderation_status = ? WHERE id = ?
      (pool.query as jest.Mock).mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await request(app)
        .put('/api/notes/1/moderate-status')
        .set('Authorization', `Bearer ${tokens.moderator}`)
        .send({ moderationStatus: 'hidden', reason: 'Contenido no apto' });

      expect(res.status).toBe(200);
    });

    test('RBAC-11 | NO puede cambiar roles de usuario (/api/admin/users/1/role) -> 403', async () => {
      const res = await request(app)
        .patch('/api/admin/users/1/role')
        .set('Authorization', `Bearer ${tokens.moderator}`)
        .send({ role: 'admin' });

      expect(res.status).toBe(403);
    });

    test('RBAC-12 | NO puede ver lista de usuarios con roles (/api/roles/users) -> 403', async () => {
      const res = await request(app)
        .get('/api/roles/users')
        .set('Authorization', `Bearer ${tokens.moderator}`);

      expect(res.status).toBe(403);
    });
  });

  // ─── 4. ROL ADMINISTRADOR (admin) ──────────────────────────────────────────
  describe('4. Administrador (admin)', () => {
    test('RBAC-13 | Tiene acceso total a gestión de usuarios (/api/admin/users) -> 200', async () => {
      // Mock 1: listar usuarios
      (pool.query as jest.Mock).mockResolvedValueOnce([[]]);

      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${tokens.admin}`);

      expect(res.status).toBe(200);
    });

    test('RBAC-14 | Puede crear materias en el catálogo académico (/api/admin/catalog/subjects) -> 201', async () => {
      // Mock 1: verificar existencia de carrera
      (pool.query as jest.Mock).mockResolvedValueOnce([[{ id: 1, name: 'Ingeniería de Sistemas' }]]);
      // Mock 2: INSERT en subjects
      (pool.query as jest.Mock).mockResolvedValueOnce([{ insertId: 5 }]);

      const res = await request(app)
        .post('/api/admin/catalog/subjects')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ name: 'Física I', semester: 2, careerId: 1 });

      expect(res.status).toBe(201);
    });
  });
});
