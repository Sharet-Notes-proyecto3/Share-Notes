// backend/src/__tests__/admin.staff.integration.test.ts
// Suite de pruebas de integración para la provisión de personal (docentes/moderadores)
// y la restricción estricta de visibilidad de apuntes por materias asignadas

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-staff-admin-2026';
process.env.NODE_ENV = 'test';

const mockConn = {
  beginTransaction: jest.fn().mockResolvedValue(undefined),
  query: jest.fn().mockResolvedValue([{ insertId: 99 }]),
  commit: jest.fn().mockResolvedValue(undefined),
  rollback: jest.fn().mockResolvedValue(undefined),
  release: jest.fn().mockResolvedValue(undefined),
};

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
    getConnection: jest.fn().mockImplementation(() => Promise.resolve(mockConn)),
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

const adminToken = makeToken('admin', 1);
const teacherToken = makeToken('teacher', 20);
const studentToken = makeToken('student', 30);

describe('👔 Admin Staff Provisioning & Teacher Visibility Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConn.beginTransaction.mockResolvedValue(undefined);
    mockConn.query.mockResolvedValue([{ insertId: 99 }]);
    mockConn.commit.mockResolvedValue(undefined);
    mockConn.rollback.mockResolvedValue(undefined);
    mockConn.release.mockResolvedValue(undefined);
  });

  // ─── 1. Creación de Personal (Docente con Materias) ──────────────────────────
  test('STAFF-01 | Admin crea exitosamente una cuenta de docente con materias asignadas (POST /api/admin/users) -> 201', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[]]) // Verificación de email único
      .mockResolvedValueOnce([[{ id: 1 }, { id: 2 }]]); // Verificación de existencia de materias 1 y 2

    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Prof. Carlos Delgado',
        email: 'carlos.delgado@uniputumayo.edu.co',
        password: 'PasswordDocente123!',
        role: 'teacher',
        subjectIds: [1, 2],
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(99);
    expect(res.body.role).toBe('teacher');
    expect(res.body.assignedSubjects).toEqual([1, 2]);
    expect(mockConn.beginTransaction).toHaveBeenCalled();
    expect(mockConn.commit).toHaveBeenCalled();
    expect(mockConn.release).toHaveBeenCalled();

    // Verificación explícita del SQL del INSERT: valida que la columna sea password_hash y no password
    const userInsertCall = mockConn.query.mock.calls[0];
    const userInsertSql = userInsertCall[0];
    expect(userInsertSql).toContain('INSERT INTO users (name, email, password_hash, role, is_active)');
    expect(userInsertSql).toContain('password_hash');
    expect(userInsertSql).not.toContain('password,');

    // Verificación de columnas exactas de teacher_courses
    const courseInsertCall = mockConn.query.mock.calls[1];
    const courseInsertSql = courseInsertCall[0];
    expect(courseInsertSql).toContain('INSERT INTO teacher_courses (teacher_id, subject_id)');
  });

  // ─── 2. Creación de Moderador ───────────────────────────────────────────────
  test('STAFF-02 | Admin crea exitosamente una cuenta de moderador sin materias (POST /api/admin/users) -> 201', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[]]); // Verificación de email único

    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Mod. Laura Martinez',
        email: 'laura.mod@uniputumayo.edu.co',
        password: 'PasswordMod123!',
        role: 'moderator',
      });

    expect(res.status).toBe(201);
    expect(res.body.role).toBe('moderator');
    expect(mockConn.commit).toHaveBeenCalled();
    expect(mockConn.release).toHaveBeenCalled();

    // Verificación explícita del SQL del INSERT para moderador
    const userInsertCall = mockConn.query.mock.calls[0];
    const userInsertSql = userInsertCall[0];
    expect(userInsertSql).toContain('INSERT INTO users (name, email, password_hash, role, is_active)');
    expect(userInsertSql).toContain('password_hash');
  });

  // ─── 3. Rechazo de roles inválidos (admin o student) ───────────────────────
  test('STAFF-03 | Rechaza roles no permitidos como admin o student en POST /api/admin/users -> 400', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Hacker Intent',
        email: 'hacker@uniputumayo.edu.co',
        password: 'Password123!',
        role: 'admin',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Solo se pueden crear cuentas de docente o moderador');
  });

  // ─── 4. Rechazo a no-admin ──────────────────────────────────────────────────
  test('STAFF-04 | Usuario no-admin (docente o estudiante) es rechazado con 403 en POST /api/admin/users', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        name: 'Docente Falso',
        email: 'docente@uniputumayo.edu.co',
        password: 'Password123!',
        role: 'teacher',
      });

    expect(res.status).toBe(403);
  });

  // ─── 5. Actualización de materias asignadas ──────────────────────────────────
  test('STAFF-05 | Admin actualiza exitosamente las materias de un docente (PATCH /api/admin/users/:id/courses) -> 200', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[{ id: 20, role: 'teacher' }]]) // Verificación docente existe y es teacher
      .mockResolvedValueOnce([[{ id: 3 }, { id: 4 }]]); // Verificación de materias existentes

    const res = await request(app)
      .patch('/api/admin/users/20/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        subjectIds: [3, 4],
      });

    expect(res.status).toBe(200);
    expect(res.body.teacherId).toBe(20);
    expect(res.body.assignedSubjects).toEqual([3, 4]);
    expect(mockConn.commit).toHaveBeenCalled();
    expect(mockConn.release).toHaveBeenCalled();

    // Verificación explícita de queries DELETE e INSERT sobre teacher_courses
    const deleteCall = mockConn.query.mock.calls[0];
    expect(deleteCall[0]).toContain('DELETE FROM teacher_courses WHERE teacher_id = ?');

    const insertCall = mockConn.query.mock.calls[1];
    expect(insertCall[0]).toContain('INSERT INTO teacher_courses (teacher_id, subject_id)');
  });

  // ─── 6. Rechazo de asignación de materias a usuario no docente ──────────────
  test('STAFF-06 | Rechaza actualizar materias si el usuario no tiene rol teacher -> 400', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[{ id: 30, role: 'student' }]]); // Usuario es estudiante

    const res = await request(app)
      .patch('/api/admin/users/30/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        subjectIds: [1, 2],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('El usuario no tiene el rol de docente');
  });

  // ─── 7. Restricción de visibilidad de docente por materias asignadas ─────────
  test('STAFF-07 | Docente solo ve apuntes de sus materias asignadas en teacher_courses', async () => {
    // 1. Consulta teacher_courses para el docente userId=20
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[{ subject_id: 1 }, { subject_id: 2 }]])
      // 2. Consulta de apuntes restringida a subject_id IN (1, 2)
      .mockResolvedValueOnce([[
        { id: 101, title: 'Apunte Materia 1', subject_id: 1, is_active: 1 },
      ]]);

    const res = await request(app)
      .get('/api/notes')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Apunte Materia 1');

    // Verificar que la consulta SQL incluyó el filtro n.subject_id IN (?, ?)
    const secondCallSql = (pool.query as jest.Mock).mock.calls[1][0];
    expect(secondCallSql).toContain('AND n.subject_id IN (?, ?)');
  });

  // ─── 8. Docente sin materias asignadas recibe lista vacía ───────────────────
  test('STAFF-08 | Docente sin materias asignadas recibe array vacío [] inmediatamente', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[]]); // teacher_courses retorna vacío

    const res = await request(app)
      .get('/api/notes')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    // Solo debe haberse ejecutado 1 consulta (a teacher_courses)
    expect((pool.query as jest.Mock).mock.calls.length).toBe(1);
  });
});
