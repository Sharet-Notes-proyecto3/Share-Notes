// backend/src/__tests__/magic-bytes.upload.integration.test.ts
// Pruebas de integración para validación de Magic Bytes (H-02) en subida de apuntes
// Cubre: (a) archivo PDF legítimo (%PDF-) aceptado (201),
//        (b) archivo de texto plano disfrazado como PDF rechazado (400) y eliminado de disco.

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-magic-bytes-2026';
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

jest.mock('../utils/microservicesClient', () => ({
  ...jest.requireActual('../utils/microservicesClient'),
  sendEmailNotification: jest.fn().mockResolvedValue({ status: 'ok' }),
  checkMicroservicesHealth: jest.fn().mockResolvedValue({ pdf: true, email: true }),
}));

import request from 'supertest';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import pool from '../config/database';
import app from '../index';

const secret = process.env.JWT_SECRET;
const studentToken = jwt.sign(
  { userId: 10, email: 'estudiante@sharenotes.edu', role: 'student' },
  secret,
  { expiresIn: '1h' }
);

describe('🛡️ Hardening H-02: Validación de Magic Bytes en Subida de Archivos', () => {
  const createdFilesToClean: string[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Limpieza de cualquier archivo que haya quedado de la prueba exitosa
    for (const filePath of createdFilesToClean) {
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {
          // Ignorar error al limpiar archivos de prueba
        }
      }
    }
  });

  test('MB-01 | Acepta archivo con magic bytes legítimos de PDF (%PDF-) y mimetype correcto -> 201', async () => {
    // Mock 1: consulta para verificar si la materia existe
    (pool.query as jest.Mock).mockResolvedValueOnce([[{ id: 1, name: 'Cálculo I' }]]);
    // Mock 2: inserción de la nota en la BD
    (pool.query as jest.Mock).mockResolvedValueOnce([{ insertId: 777 }]);

    // Buffer con cabecera válida de PDF (%PDF-1.4)
    const validPdfBuffer = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');

    const res = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${studentToken}`)
      .field('title', 'Apunte Legítimo de Cálculo')
      .field('subjectId', '1')
      .attach('file', validPdfBuffer, {
        filename: 'apunte-valido.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(777);
    expect(res.body.message).toBe('Apunte subido correctamente');

    // Registrar archivo para limpieza posterior en uploads/
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      for (const f of files) {
        if (f.endsWith('.pdf')) {
          createdFilesToClean.push(path.join(uploadDir, f));
        }
      }
    }
  });

  test('MB-02 | Rechaza archivo de texto plano disfrazado con extensión .pdf y mimetype falso -> 400 y borra archivo de disco', async () => {
    // Contenido simulado: texto plano ASCII (sin cabecera binaria %PDF-)
    const fakePdfBuffer = Buffer.from('Este es un archivo de texto malicioso o payload simulado que no es un PDF.');

    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const initialFiles = fs.existsSync(uploadDir) ? fs.readdirSync(uploadDir) : [];

    const res = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${studentToken}`)
      .field('title', 'Apunte Malicioso Falso')
      .field('subjectId', '1')
      .attach('file', fakePdfBuffer, {
        filename: 'archivo-falso.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('El contenido del archivo no coincide con su extensión declarada');
    expect(res.body.correlationId).toBeDefined();

    // Confirmar que la base de datos no fue tocada
    expect(pool.query).not.toHaveBeenCalled();

    // Confirmar que NO quedó ningún archivo huérfano nuevo en el directorio uploads/
    const currentFiles = fs.existsSync(uploadDir) ? fs.readdirSync(uploadDir) : [];
    const newFiles = currentFiles.filter((f) => !initialFiles.includes(f));
    expect(newFiles.length).toBe(0);
  });
});
