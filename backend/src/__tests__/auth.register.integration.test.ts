// src/__tests__/auth.register.integration.test.ts
// Pruebas de integración para registro público: cierre de bypass, validaciones académicas y roleNotice

process.env.JWT_SECRET = 'test-jwt-secret-auth-register-2026';
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
import pool from '../config/database';
import app from '../index';

describe('🔐 Auth Register Integration Tests: Validación Académica y Prevención de Bypass', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('AUTH-REG-01 | Rechaza registro si falta el tipo de programa (HTTP 400)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Carlos Gomez',
        email: 'carlos@uniputumayo.edu.co',
        password: 'Password123!',
        semester: 3,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("El tipo de programa ('tecnologo' o 'ingenieria') y el semestre son requeridos");
  });

  test('AUTH-REG-02 | Rechaza registro si el semestre no corresponde al tipo de programa (HTTP 400)', async () => {
    // Tecnólogo solo acepta 1 a 6; semestre 8 debe ser rechazado
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Carlos Gomez',
        email: 'carlos@uniputumayo.edu.co',
        password: 'Password123!',
        programType: 'tecnologo',
        semester: 8,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Para Tecnólogo el semestre debe estar entre 1 y 6.');
  });

  test('AUTH-REG-03 | CIERRE DE BYPASS: Enviar role=teacher sin datos académicos es RECHAZADO (HTTP 400)', async () => {
    // Antes del fix, enviar role='teacher' saltaba la validación y creaba un estudiante con campos null.
    // Ahora debe ser rechazado inmediatamente con HTTP 400.
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Docente Falso',
        email: 'falso@uniputumayo.edu.co',
        password: 'Password123!',
        role: 'teacher',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("El tipo de programa ('tecnologo' o 'ingenieria') y el semestre son requeridos");
  });

  test('AUTH-REG-04 | Enviar role=teacher con datos académicos válidos crea cuenta como STUDENT y retorna roleNotice (HTTP 201)', async () => {
    // Simular que el usuario no existe en DB
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[]]) // SELECT existing email
      .mockResolvedValueOnce([{ insertId: 55 }]); // INSERT user

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Docente Aspirante',
        email: 'aspirante@uniputumayo.edu.co',
        password: 'Password123!',
        role: 'teacher',
        programType: 'ingenieria',
        semester: 7,
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Registro exitoso');
    expect(res.body.user.role).toBe('student');
    expect(res.body.roleNotice).toContain('El registro público solo crea cuentas de estudiante');
  });

  test('AUTH-REG-05 | Registro exitoso de estudiante legítimo con datos académicos correctos (HTTP 201)', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[]]) // SELECT existing email
      .mockResolvedValueOnce([{ insertId: 56 }]); // INSERT user

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Estudiante Nuevo',
        email: 'nuevo@uniputumayo.edu.co',
        password: 'Password123!',
        programType: 'tecnologo',
        semester: 2,
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Registro exitoso');
    expect(res.body.user.role).toBe('student');
    expect(res.body.roleNotice).toBeUndefined();
  });
});
