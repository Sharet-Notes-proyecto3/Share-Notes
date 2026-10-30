// src/__tests__/moderator.rbac.test.ts
// Suite unitaria del rol MODERATOR: RBAC, reglas de negocio y auditoría.
// Exactamente 10 pruebas (MOD-01 … MOD-10).

import { roleGuard, adminGuard } from '../middlewares/auth.middleware';
import { ModeratorService } from '../services/moderator.service';
import {
  assertCanRestrictUser,
  computeRestrictedUntil,
  isRestrictionActive,
} from '../services/moderation.policy';

// Mock del pool de la base de datos
jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

// Mock del servicio de auditoría
jest.mock('../services/audit.service', () => ({
  logAuditAction: jest.fn().mockResolvedValue(undefined),
}));

import pool from '../config/database';

function mockReq(userRole: 'student' | 'teacher' | 'moderator' | 'admin', userId = 20, params = {}, body = {}) {
  return {
    user: { userId, email: `${userRole}@uni.edu.co`, role: userRole },
    params,
    body,
    query: {},
  } as any;
}

function mockRes() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  return { res: { status, json } as any, status, json };
}

describe('🧪 Suite de Pruebas Unitarias — Rol MODERATOR (RBAC + Reglas de Negocio)', () => {
  let moderatorService: ModeratorService;

  beforeEach(() => {
    jest.clearAllMocks();
    moderatorService = new ModeratorService();
  });

  // 1. Resolución exitosa de denuncia por moderador
  test('MOD-01 | Debería permitir a un moderador resolver una denuncia (status = resolved)', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[{ id: 1, target_type: 'note', target_id: 10, status: 'pending' }]]) // SELECT report
      .mockResolvedValueOnce([{}]); // UPDATE query

    const result = await moderatorService.resolveReport(1, 'resolved', 20, 'moderator');
    expect(result).toHaveProperty('status', 'resolved');
    expect(result).toHaveProperty('reportId', 1);
  });

  // 2. Ocultamiento de apunte denunciado (moderation_status = hidden/blocked)
  test('MOD-02 | Debería cambiar el estado de visibilidad de un apunte a hidden o blocked', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[{ id: 5, title: 'Apunte Sospechoso', uploader_id: 2 }]]) // SELECT note
      .mockResolvedValueOnce([{}]); // UPDATE query

    const result = await moderatorService.moderateNoteStatus(5, 'hidden', 20, 'moderator', 'Contenido engañoso');
    expect(result).toHaveProperty('moderationStatus', 'hidden');
    expect(result).toHaveProperty('noteId', 5);
  });

  // 3. Restricción temporal de participación en foro a un usuario infractor
  test('MOD-03 | Debería aplicar una restricción temporal de foro a un usuario', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[{ id: 15, name: 'Usuario Infractor', role: 'student' }]]) // SELECT user
      .mockResolvedValueOnce([{}]); // UPDATE query

    const untilDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const result = await moderatorService.restrictUser(15, untilDate, 20, 'moderator', 'Spam persistente en hilos');

    expect(result).toHaveProperty('userId', 15);
    expect(result).toHaveProperty('restrictedUntil', untilDate);
  });

  // 4. Denegación de acceso (403) a cambio de rol de usuario
  test('MOD-04 | Debería denegar el acceso (403) si un moderador intenta cambiar el rol de un usuario', () => {
    const req = mockReq('moderator', 20, { id: '15' }, { role: 'admin' });
    const { res, status, json } = mockRes();
    const next = jest.fn();

    // adminGuard exige estrictamente el rol 'admin'
    adminGuard(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Acceso denegado: se requiere rol admin' })
    );

    // roleGuard de solo admin
    const guardSoloAdmin = roleGuard('admin');
    guardSoloAdmin(req, res, next);
    expect(status).toHaveBeenCalledWith(403);
  });

  // 5. Validación del filtro de estado de la cola de denuncias
  test('MOD-05 | Debería rechazar (400) un filtro de estado inválido sin consultar la BD', async () => {
    await expect(moderatorService.listReports('aprobado')).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(pool.query).not.toHaveBeenCalled();
  });

  // 6. Una denuncia cerrada no puede volver a procesarse
  test('MOD-06 | Debería impedir (409) resolver una denuncia que ya estaba resuelta', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce([
      [{ id: 8, target_type: 'thread', target_id: 3, status: 'resolved' }],
    ]);

    await expect(
      moderatorService.resolveReport(8, 'dismissed', 20, 'moderator')
    ).rejects.toMatchObject({ statusCode: 409 });

    // Solo se ejecutó el SELECT; el UPDATE no debe ocurrir.
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  // 7. Cálculo de la fecha de restricción a partir de días
  test('MOD-07 | Debería calcular restrictedUntil sumando los días indicados y validar el rango', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const until = computeRestrictedUntil({ days: 3, now });

    expect(until.toISOString()).toBe('2026-01-04T00:00:00.000Z');
    expect(() => computeRestrictedUntil({ days: 0, now })).toThrow(
      'entre 1 y 365'
    );
    expect(() => computeRestrictedUntil({ days: 2.5, now })).toThrow(
      'entre 1 y 365'
    );
  });

  // 8. Vigencia de una restricción
  test('MOD-08 | Debería determinar correctamente si una restricción sigue activa', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');

    expect(isRestrictionActive(new Date('2026-01-02T00:00:00.000Z'), now)).toBe(true);
    expect(isRestrictionActive('2025-12-31T00:00:00.000Z', now)).toBe(false);
    expect(isRestrictionActive(null, now)).toBe(false);
    expect(isRestrictionActive('fecha-invalida', now)).toBe(false);
  });

  // 9. Jerarquía: un moderador no puede sancionar a otro moderador ni a sí mismo
  test('MOD-09 | Debería impedir que un moderador restrinja a otro moderador o a sí mismo', () => {
    expect(() =>
      assertCanRestrictUser({ actorId: 20, actorRole: 'moderator', targetId: 20, targetRole: 'student' })
    ).toThrow('ti mismo');

    expect(() =>
      assertCanRestrictUser({ actorId: 20, actorRole: 'moderator', targetId: 36, targetRole: 'moderator' })
    ).toThrow('mismo rol o superior');

    expect(() =>
      assertCanRestrictUser({ actorId: 20, actorRole: 'moderator', targetId: 1, targetRole: 'admin' })
    ).toThrow('administrador');

    expect(() =>
      assertCanRestrictUser({ actorId: 20, actorRole: 'moderator', targetId: 15, targetRole: 'student' })
    ).not.toThrow();
  });

  // 10. Métricas agregadas del panel de moderación
  test('MOD-10 | Debería agregar las métricas de denuncias, restricciones y apuntes moderados', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([
        [
          { status: 'pending', total: '4' },
          { status: 'resolved', total: 2 },
          { status: 'dismissed', total: 1 },
        ],
      ]) // GROUP BY status
      .mockResolvedValueOnce([[{ total: '3' }]]) // restricciones activas
      .mockResolvedValueOnce([[{ total: '1' }]]); // apuntes moderados

    const stats = await moderatorService.getModerationStats();

    expect(stats.reports).toEqual({
      pending: 4,
      reviewed: 0,
      resolved: 2,
      dismissed: 1,
      total: 7,
    });
    expect(stats.activeRestrictions).toBe(3);
    expect(stats.moderatedNotes).toBe(1);
  });
});
