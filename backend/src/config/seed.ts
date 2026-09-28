// src/config/seed.ts
// Ejecutar con: npm run db:seed
import pool from './database';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';

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
