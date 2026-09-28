process.env.JWT_SECRET = 'test-jwt-secret-visibility-2026';
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
import { NoteService } from '../services/note.service';
import pool from '../config/database';
import app from '../index';

const secret = process.env.JWT_SECRET!;
const studentToken = jwt.sign(
  { userId: 10, email: 'student@sharenotes.edu', role: 'student' },
  secret
);
const teacherToken = jwt.sign(
  { userId: 2, email: 'teacher@sharenotes.edu', role: 'teacher' },
  secret
);

describe('Restricción de Visibilidad de Apuntes por Semestre para Estudiantes (Consulta en Tiempo Real)', () => {
  let service: NoteService;

  beforeEach(() => {
    service = new NoteService();
    jest.clearAllMocks();
  });

  test('Caso (1): NoteService.list — Estudiante con semestre 3 en BD que intenta consultar semestre 8 recibe solo semestre 3', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[{ semester: 3 }]]) // 1. Consulta en tiempo real a users
      .mockResolvedValueOnce([[]]); // 2. Consulta a notes

    await service.list(
      { semester: 8 }, // El cliente intenta inyectar/solicitar semestre 8
      { userId: 10, role: 'student' }
    );

    expect(pool.query).toHaveBeenCalledTimes(2);
    // Verificar primera consulta (tiempo real a users)
    expect((pool.query as jest.Mock).mock.calls[0][0]).toContain('SELECT semester FROM users WHERE id = ?');
    expect((pool.query as jest.Mock).mock.calls[0][1]).toEqual([10]);

    // Verificar segunda consulta (notes forzado a semestre 3)
    const [calledQuery, calledParams] = (pool.query as jest.Mock).mock.calls[1];
    expect(calledQuery).toContain('AND s.semester = ?');
    expect(calledParams).toContain(3);
    expect(calledParams).not.toContain(8);
  });

  test('Caso (2): NoteService.list — Docente, moderador o admin no consultan users y filtran libremente cualquier semestre', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce([[]]); // Solo consulta a notes

    await service.list(
      { semester: 8 },
      { userId: 2, role: 'teacher' }
    );

    expect(pool.query).toHaveBeenCalledTimes(1);
    const [calledQuery, calledParams] = (pool.query as jest.Mock).mock.calls[0];

    expect(calledQuery).toContain('AND s.semester = ?');
    expect(calledParams).toContain(8);
  });

  test('Caso (3): NoteService.list — Estudiante con semestre null en BD (onboarding incompleto) no es bloqueado y consulta libremente', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[{ semester: null }]]) // users retorna null
      .mockResolvedValueOnce([[]]); // notes

    await service.list(
      { semester: 5 },
      { userId: 20, role: 'student' }
    );

    expect(pool.query).toHaveBeenCalledTimes(2);
    const [calledQuery, calledParams] = (pool.query as jest.Mock).mock.calls[1];
    expect(calledQuery).toContain('AND s.semester = ?');
    expect(calledParams).toContain(5);
  });

  test('Caso (4): Actualización en BD en caliente — Si un admin actualiza el semestre de 3 a 4, la siguiente llamada refleja de inmediato semestre 4 sin cambiar de token', async () => {
    // Primera petición: el estudiante está en semestre 3
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[{ semester: 3 }]])
      .mockResolvedValueOnce([[]]);

    await service.list({}, { userId: 10, role: 'student' });
    expect((pool.query as jest.Mock).mock.calls[1][1]).toContain(3);

    // Un admin actualiza la base de datos a semestre 4 mientras el estudiante sigue activo
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[{ semester: 4 }]]) // BD ahora devuelve 4
      .mockResolvedValueOnce([[]]);

    await service.list({}, { userId: 10, role: 'student' });
    expect((pool.query as jest.Mock).mock.calls[3][1]).toContain(4);
    expect((pool.query as jest.Mock).mock.calls[3][1]).not.toContain(3);
  });

  test('Caso (5): HTTP GET /api/notes?semester=8 con Token de Estudiante ejecuta consulta con su semestre real de BD y descarta 8', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[{ semester: 3 }]]) // users
      .mockResolvedValueOnce([
        [
          {
            id: 101,
            title: 'Apunte Semestre 3',
            semester: 3,
            subject_name: 'Estructura de Datos',
          },
        ],
      ]); // notes

    const res = await request(app)
      .get('/api/notes?semester=8')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    const [calledQuery, calledParams] = (pool.query as jest.Mock).mock.calls[1];
    expect(calledQuery).toContain('AND s.semester = ?');
    expect(calledParams).toContain(3);
    expect(calledParams).not.toContain(8);
  });

  test('Caso (6): HTTP GET /api/notes?semester=8 con Token de Profesor ejecuta consulta con semestre 8 sin restricción', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce([
      [
        {
          id: 202,
          title: 'Apunte Semestre 8',
          semester: 8,
          subject_name: 'Proyecto de Software II',
        },
      ],
    ]);

    const res = await request(app)
      .get('/api/notes?semester=8')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    const [calledQuery, calledParams] = (pool.query as jest.Mock).mock.calls[0];
    expect(calledQuery).toContain('AND s.semester = ?');
    expect(calledParams).toContain(8);
  });
});
