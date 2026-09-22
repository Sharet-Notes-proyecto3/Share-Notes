// src/__tests__/cross.rbac.test.ts
// Test suite cruzado: Detección y prevención de intentos de Bypass (RBAC + ABAC + Auditoría)

import { roleGuard, adminGuard } from '../middlewares/auth.middleware';
import { isTeacherOfCourse } from '../middlewares/teacher.middleware';
import { NoteService } from '../services/note.service';
import { ForumService } from '../services/forum.service';
import { AdminService } from '../services/admin.service';
import { RolesService } from '../roles/roles.service';
import { logAuditAction } from '../services/audit.service';

// Mock de base de datos
jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

// Mock del servicio de auditoría
jest.mock('../services/audit.service', () => ({
  logAuditAction: jest.fn().mockResolvedValue(undefined),
}));

import pool from '../config/database';

function mockReq(role: string, userId = 1, params = {}, body = {}, baseUrl = '/api', path = '/') {
  return {
    user: { userId, email: `${role}@sharenotes.edu`, role },
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

describe('🛡️ Auditoría RBAC/ABAC — Pruebas Cruzadas de Intento de Bypass', () => {
  let noteService: NoteService;
  let forumService: ForumService;
  let adminService: AdminService;
  let rolesService: RolesService;

  beforeEach(() => {
    jest.clearAllMocks();
    noteService = new NoteService();
    forumService = new ForumService();
    adminService = new AdminService();
    rolesService = new RolesService();
  });

  // ─── 1. BYPASS INTENTO POR ROL STUDENT ─────────────────────────────────────

  test('BYPASS-01 | Un STUDENT NO puede acceder a rutas de administración (/api/admin/*)', () => {
    const req = mockReq('student', 10);
    const { res, status, json } = mockRes();
    const next = jest.fn();

    adminGuard(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('se requiere rol admin') })
    );
  });

  test('BYPASS-02 | Un STUDENT NO puede verificar apuntes (roleGuard)', () => {
    const req = mockReq('student', 10);
    const { res, status } = mockRes();
    const next = jest.fn();

    const guard = roleGuard('teacher', 'admin');
    guard(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(403);
  });

  test('BYPASS-03 | Un STUDENT NO puede eliminar apuntes ajenos (ABAC Propiedad)', async () => {
    // Apunte pertenece al usuario 999
    (pool.query as jest.Mock).mockResolvedValueOnce([
      [{ id: 1, title: 'Apunte Ajeno', uploader_id: 999 }],
    ]);

    await expect(noteService.delete(1, 10, 'student')).rejects.toThrow(
      'No tienes permiso para eliminar este apunte'
    );
  });

  test('BYPASS-04 | Un STUDENT NO puede eliminar respuestas ajenas en el foro (ABAC Propiedad)', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce([
      [{ author_id: 999, thread_id: 5 }],
    ]);

    await expect(forumService.deleteReply(20, 10, 'student')).rejects.toThrow(
      'No tienes permiso para eliminar esta respuesta'
    );
  });

  // ─── 2. BYPASS INTENTO POR ROL TEACHER ─────────────────────────────────────

  test('BYPASS-05 | Un TEACHER NO puede verificar un apunte de un curso que no dicta', async () => {
    // Apunte está en materia 40, pero el docente no está asignado en teacher_courses
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[{ subject_id: 40 }]]) // consulta apunte
      .mockResolvedValueOnce([[]]); // sin registros en teacher_courses

    const req = mockReq('teacher', 5, { id: '12' }, {}, '/api/notes', '/12/verify');
    const { res, status, json } = mockRes();
    const next = jest.fn();

    await isTeacherOfCourse(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('no estás asignado') })
    );
  });

  test('BYPASS-06 | Un TEACHER NO puede cerrar un hilo de una materia no asignada', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[{ subject_id: 88 }]]) // consulta hilo
      .mockResolvedValueOnce([[]]); // sin registros en teacher_courses

    const req = mockReq('teacher', 5, { id: '33' }, {}, '/api/forum/posts', '/33/close');
    const { res, status } = mockRes();
    const next = jest.fn();

    await isTeacherOfCourse(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(403);
  });

  test('BYPASS-07 | Un TEACHER NO puede eliminar apuntes ajenos', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce([
      [{ id: 1, title: 'Apunte Estudiante', uploader_id: 999 }],
    ]);

    await expect(noteService.delete(1, 5, 'teacher')).rejects.toThrow(
      'No tienes permiso para eliminar este apunte'
    );
  });

  // ─── 3. BYPASS INTENTO POR ROL MODERATOR ───────────────────────────────────

  test('BYPASS-08 | Un MODERATOR NO puede cambiar el rol de un usuario (adminGuard)', () => {
    const req = mockReq('moderator', 7);
    const { res, status } = mockRes();
    const next = jest.fn();

    adminGuard(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(403);
  });

  test('BYPASS-09 | Un MODERATOR SÍ puede eliminar contenido ajeno por regla transversal ABAC', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[{ id: 5, title: 'Apunte Spam', uploader_id: 999 }]])
      .mockResolvedValueOnce([{}]); // UPDATE notes SET is_active = FALSE

    const result = await noteService.delete(5, 7, 'moderator');
    expect(result).toHaveProperty('message', 'Apunte eliminado');
    expect(logAuditAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'MODERATE_DELETE_NOTE' })
    );
  });

  // ─── 4. RESTRICCIÓN TEMPORAL Y HILOS CERRADOS ──────────────────────────────

  test('RESTRICT-01 | Usuario con restricción temporal no puede crear hilos en el foro', async () => {
    const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    (pool.query as jest.Mock).mockResolvedValueOnce([
      [{ restricted_until: futureDate }],
    ]);

    await expect(
      forumService.createThread({ title: 'Spam', body: 'Test', subjectId: 1, authorId: 50 })
    ).rejects.toThrow('Tu participación en el foro está temporalmente restringida');
  });

  test('RESTRICT-02 | No se puede responder a un hilo cerrado', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[{ restricted_until: null }]]) // usuario no restringido
      .mockResolvedValueOnce([[{ id: 10, is_closed: true }]]); // hilo cerrado

    await expect(
      forumService.createReply({ body: 'Respuesta tardía', threadId: 10, authorId: 50 })
    ).rejects.toThrow('Este debate ha sido cerrado por el docente');
  });

  // ─── 5. REGISTRO DE AUDITORÍA EN ACCIONES DE ADMIN ─────────────────────────

  test('AUDIT-01 | Cambio de rol por ADMIN debe registrarse en audit_logs', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[{ id: 12, role: 'student' }]]) // SELECT user
      .mockResolvedValueOnce([{}]); // UPDATE role

    await adminService.changeUserRole(12, 'teacher', 1);

    expect(logAuditAction).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        userRole: 'admin',
        action: 'CHANGE_USER_ROLE',
        targetId: 12,
        details: { previousRole: 'student', newRole: 'teacher' },
      })
    );
  });

  test('AUDIT-02 | Suspensión de usuario por ADMIN debe registrarse en audit_logs', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[{ id: 14, is_active: 1, role: 'student' }]]) // SELECT user
      .mockResolvedValueOnce([{}]); // UPDATE is_active

    await adminService.toggleUserStatus(14, 1);

    expect(logAuditAction).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        userRole: 'admin',
        action: 'SUSPEND_USER',
        targetId: 14,
      })
    );
  });
});
