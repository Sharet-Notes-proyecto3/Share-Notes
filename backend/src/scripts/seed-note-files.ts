import pool from '../config/database';
import { ensureNoteFileOnDisk } from '../utils/pdfFallback';
import logger from '../utils/logger';

async function seedNoteFiles() {
  try {
    const [notes]: any = await pool.query(
      'SELECT n.filename, n.title, n.description, s.name as subject_name FROM notes n LEFT JOIN subjects s ON n.subject_id = s.id'
    );
    logger.info(`Encontradas ${notes.length} notas en la base de datos.`);
    for (const n of notes) {
      if (n.filename) {
        ensureNoteFileOnDisk(n.filename, {
          title: n.title,
          description: n.description,
          subjectName: n.subject_name,
        });
      }
    }
    logger.info('✅ Todos los archivos PDF de notas semilla han sido creados correctamente en uploads/.');
  } catch (err) {
    logger.error('Error al generar archivos de notas:', err);
  } finally {
    process.exit(0);
  }
}

seedNoteFiles();

