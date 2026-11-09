// src/config/seed.ts
// Ejecutar con: npm run db:seed
import pool from './database';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';

function toAsciiSlug(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
}

async function ensureTwoNotesPerSubject(conn: any) {
  const [subjects]: any[] = await conn.query('SELECT id, name FROM subjects ORDER BY semester, id');
  const [rows]: any[] = await conn.query('SELECT subject_id, COUNT(*) AS note_count FROM notes GROUP BY subject_id');

  const existingCounts = new Map<number, number>(
    rows.map((row: any) => [Number(row.subject_id), Number(row.note_count)])
  );

  const noteRows: any[] = [];
  let nextId = 1000;

  for (const subject of subjects) {
    const count = existingCounts.get(Number(subject.id)) ?? 0;
    const missing = Math.max(0, 2 - count);

    for (let index = 0; index < missing; index += 1) {
      const label = index === 0 ? 'Resumen general' : 'Ejercicios y práctica';
      const description =
        index === 0
          ? `Conceptos clave y esquema de estudio para ${subject.name}.`
          : `Guía de ejercicios, casos y revisión práctica para ${subject.name}.`;

      noteRows.push({
        id: nextId++,
        title: `${subject.name} - ${label}`,
        description,
        filename: `${toAsciiSlug(subject.name)}_${index === 0 ? 'resumen' : 'practica'}.pdf`,
        original_name: `${subject.name.replace(/\s+/g, '_')}_${label.replace(/\s+/g, '_')}.pdf`,
        mimetype: 'application/pdf',
        file_size: index === 0 ? 512000 : 640000,
        subject_id: subject.id,
        uploader_id: index === 0 ? 4 : 7,
        verified: false,
        moderation_status: 'visible',
        is_active: true,
      });
    }
  }

  if (!noteRows.length) return;

  const placeholders = noteRows.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
  const params = noteRows.flatMap((row) => [
    row.id,
    row.title,
    row.description,
    row.filename,
    row.original_name,
    row.mimetype,
    row.file_size,
    row.subject_id,
    row.uploader_id,
    row.verified,
    row.moderation_status,
    row.is_active,
  ]);

  await conn.query(
    `INSERT IGNORE INTO notes (id, title, description, filename, original_name, mimetype, file_size, subject_id, uploader_id, verified, moderation_status, is_active) VALUES ${placeholders}`,
    params,
  );
}

async function seed() {
  const conn = await pool.getConnection();
  try {
    logger.info('🌱 Insertando datos de prueba (seeds) en ShareNotes...');
    const seedPath = path.resolve(__dirname, '../../seeds.sql');
    const sql = fs.readFileSync(seedPath, 'utf8');

    // Separar por punto y coma, ignorando comentarios y el comando USE
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter(
        (s) =>
          s.length > 0 &&
          !s.startsWith('--') &&
          !s.toLowerCase().startsWith('use ')
      );

    for (const stmt of statements) {
      if (stmt.length > 0) {
        await conn.query(stmt);
      }
    }

    await ensureTwoNotesPerSubject(conn);

    logger.info('✅ Datos semilla insertados exitosamente.');
    logger.info('👥 Cuentas de usuario listas para probar (Contraseña: password123):');
    logger.info('   • Admin:       admin@sharenotes.edu');
    logger.info('   • Docente:     teacher@sharenotes.edu');
    logger.info('   • Moderador:   moderator@sharenotes.edu');
    logger.info('   • Estudiante:  student@sharenotes.edu');
  } catch (err: any) {
    logger.error('❌ Error al ejecutar seeds:', err?.message || err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seed();
