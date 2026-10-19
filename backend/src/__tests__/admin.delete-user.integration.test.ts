// backend/src/__tests__/admin.delete-user.integration.test.ts
// Pruebas de integración para DELETE /api/admin/users/:id y aserciones sobre SQL exacto

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-delete-user-2026';
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
import { logAuditAction } from '../services/audit.service';
import app from '../index';

const secret = process.env.JWT_SECRET;
const makeToken = (role: string, userId = 1) =>
  jwt.sign({ userId, email: `${role}@sharenotes.edu`, role }, secret, { expiresIn: '1h' });

const adminToken = makeToken('admin', 40);
const studentToken = makeToken('student', 10);
const teacherToken = makeToken('teacher', 20);
const moderatorToken = makeToken('moderator', 30);

describe('🗑️ DELETE /api/admin/users/:id — Eliminación y Anonimización de Cuentas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('DEL-01 | Usuario no-admin (student) recibe 403 Forbidden', async () => {
    const res = await request(app)
      .delete('/api/admin/users/15')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });

  test('DEL-02 | Usuario no-admin (teacher y moderator) recibe 403 Forbidden', async () => {
    const resTeacher = await request(app)
      .delete('/api/admin/users/15')
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(resTeacher.status).toBe(403);

    const resMod = await request(app)
      .delete('/api/admin/users/15')
      .set('Authorization', `Bearer ${moderatorToken}`);
    expect(resMod.status).toBe(403);
  });

  test('DEL-03 | Admin intenta eliminarse a sí mismo -> 400 Bad Request', async () => {
    const res = await request(app)
      .delete('/api/admin/users/40')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('No puedes eliminar tu propia cuenta');
  });

  test('DEL-04 | Admin intenta eliminar a otro admin -> 400 Bad Request', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce([
      [{ id: 99, name: 'Otro Admin', email: 'admin2@sharenotes.edu', role: 'admin' }],
    ]);

    const res = await request(app)
      .delete('/api/admin/users/99')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('No puedes eliminar a otro administrador');
  });

  test('DEL-05 | Usuario no existe -> 404 Not Found', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce([[]]);

    const res = await request(app)
      .delete('/api/admin/users/999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('Usuario no encontrado');
  });

  test('DEL-06 | Cuenta ya eliminada previamente -> 400 Bad Request', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce([
      [{ id: 15, name: 'Usuario Eliminado', email: 'deleted_15_123456@deleted.local', role: 'student' }],
    ]);

    const res = await request(app)
      .delete('/api/admin/users/15')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('ya ha sido eliminada');
  });

  test('DEL-07 | Eliminación exitosa de estudiante/docente -> 200 OK con SQL exacto', async () => {
    // 1. SELECT inicial
    (pool.query as jest.Mock).mockResolvedValueOnce([
      [{ id: 15, name: 'Juan Perez', email: 'juan@sharenotes.edu', role: 'student' }],
    ]);
    // 2. UPDATE users
    (pool.query as jest.Mock).mockResolvedValueOnce([{ affectedRows: 1 }]);
    // 3. DELETE FROM teacher_courses
    (pool.query as jest.Mock).mockResolvedValueOnce([{ affectedRows: 0 }]);

    const res = await request(app)
      .delete('/api/admin/users/15')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Cuenta de usuario eliminada correctamente');

    // Validación estricta del SQL ejecutado (columnas literales de migrate.ts)
    const updateCall = (pool.query as jest.Mock).mock.calls[1];
    const updateSql = updateCall[0];
    const updateParams = updateCall[1];

    expect(updateSql).toContain('UPDATE users SET');
    expect(updateSql).toContain("name = 'Usuario Eliminado'");
    expect(updateSql).toContain("email = CONCAT('deleted_', id, '_', UNIX_TIMESTAMP(), '@deleted.local')");
    expect(updateSql).toContain("password_hash = ''"); // Confirma password_hash, no password
    expect(updateSql).toContain('avatar_url = NULL');
    expect(updateSql).toContain('restricted_until = NULL');
    expect(updateSql).toContain('is_active = FALSE');
    expect(updateSql).toContain('WHERE id = ?');
    expect(updateParams).toEqual([15]);

    // Validación de limpieza de teacher_courses
    const deleteCoursesCall = (pool.query as jest.Mock).mock.calls[2];
    expect(deleteCoursesCall[0]).toContain('DELETE FROM teacher_courses WHERE teacher_id = ?');
    expect(deleteCoursesCall[1]).toEqual([15]);

    // Validación de auditoría
    expect(logAuditAction).toHaveBeenCalledWith({
      userId: 40,
      userRole: 'admin',
      action: 'DELETE_USER',
      targetResource: 'user',
      targetId: 15,
      details: {
        originalEmail: 'juan@sharenotes.edu',
        originalName: 'Juan Perez',
        originalRole: 'student',
      },
    });
  });

  test('DEL-08 | toggleUserStatus rechaza cambiar estado si la cuenta ya está eliminada -> 400', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce([
      [{ id: 18, is_active: 0, role: 'student', email: 'deleted_18_170000@deleted.local' }],
    ]);

    const res = await request(app)
      .patch('/api/admin/users/18/toggle')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('No se puede cambiar el estado de una cuenta eliminada');
  });
});
