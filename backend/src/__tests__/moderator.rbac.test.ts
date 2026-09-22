// src/__tests__/moderator.rbac.test.ts
// Test suite unitario para el rol MODERATOR (RBAC + Auditoría)

import { roleGuard, adminGuard } from '../middlewares/auth.middleware';
import { ModeratorService } from '../services/moderator.service';

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

describe('🧪 Suite de Pruebas Unitarias — Rol MODERATOR (RBAC + Auditoría)', () => {
  let moderatorService: ModeratorService;

  beforeEach(() => {
    jest.clearAllMocks();
    moderatorService = new ModeratorService();
  });

  // 1. Resolución exitosa de denuncia por moderador
  test('MOD-01 | Debería permitir a un moderador resolver una denuncia (status = resolved)', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[{ id: 1, target_type: 'note', target_id: 10 }]]) // SELECT report
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
});
