// src/scripts/clean-orphaned-notes.ts
import pool from '../config/database';
import fs from 'fs';
import path from 'path';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import logger from '../utils/logger';

interface ActiveNoteRow extends RowDataPacket {
  id: number;
  title: string;
  filename: string;
  original_name: string;
  mimetype: string;
  uploader_id: number;
  created_at: Date;
}

async function cleanOrphanedNotes() {
  const uploadDir = process.env.UPLOAD_DIR || 'uploads';
  const resolvedUploadDir = path.resolve(uploadDir);

  console.log('='.repeat(75));
  console.log('🧹 AUDITORÍA Y LIMPIEZA DE APUNTES HUÉRFANOS - SHARENOTES');
  console.log(`📁 Directorio de almacenamiento: ${resolvedUploadDir}`);
  console.log('='.repeat(75));

  // 1. Obtener todos los apuntes actualmente activos en la base de datos
  const [activeNotes] = await pool.query<ActiveNoteRow[]>(
    'SELECT id, title, filename, original_name, mimetype, uploader_id, created_at FROM notes WHERE is_active = TRUE'
  );

  console.log(`\n🔍 Revisando apuntes activos en base de datos: ${activeNotes.length} encontrados.\n`);

  let deactivatedCount = 0;
  const deactivatedNotes: { id: number; title: string; filename: string }[] = [];
  const activeFilenamesInDb = new Set<string>();

  for (const note of activeNotes) {
    const filePath = path.join(resolvedUploadDir, note.filename);
    const exists = fs.existsSync(filePath);

    if (!exists) {
      // Marcar como inactivo en la base de datos (Soft Delete para preservar integridad referencial)
      await pool.query<ResultSetHeader>(
        'UPDATE notes SET is_active = FALSE WHERE id = ?',
        [note.id]
      );
      deactivatedCount++;
      deactivatedNotes.push({ id: note.id, title: note.title, filename: note.filename });
      logger.warn(`[DESACTIVADO] Apunte ID #${note.id} ("${note.title}") no tiene archivo en disco: ${note.filename}`);
      console.log(`   ❌ [ID #${note.id}] "${note.title}" -> Falta archivo: ${note.filename} (Desactivado: is_active = FALSE)`);
    } else {
      activeFilenamesInDb.add(note.filename);
      console.log(`   ✅ [ID #${note.id}] "${note.title}" -> Archivo OK (${note.filename})`);
    }
  }

  // 2. Verificación inversa: Archivos en disco huérfanos sin registro activo en la BD
  console.log('\n' + '-'.repeat(75));
  console.log('🔎 Verificación Inversa: Escaneando archivos en disco sin registro activo en BD...');
  console.log('-'.repeat(75));

  let diskOrphanCount = 0;
  if (fs.existsSync(resolvedUploadDir)) {
    const filesOnDisk = fs.readdirSync(resolvedUploadDir);
    for (const file of filesOnDisk) {
      // Ignorar archivos ocultos o de sistema
      if (file.startsWith('.')) continue;

      if (!activeFilenamesInDb.has(file)) {
        diskOrphanCount++;
        logger.info(`[HUÉRFANO EN DISCO] Archivo ${file} no está asociado a ningún apunte activo en la BD`);
        console.log(`   ⚠️ [Disco] Archivo huérfano detectado: ${file} (sin apunte activo en BD)`);
      }
    }
  }

  if (diskOrphanCount === 0) {
    console.log('   ✨ No se detectaron archivos huérfanos en disco.');
  }

  // 3. Resumen final
  console.log('\n' + '='.repeat(75));
  console.log('📊 RESUMEN FINAL DE LA EJECUCIÓN:');
  console.log(`   • Apuntes activos revisados en BD:  ${activeNotes.length}`);
  console.log(`   • Apuntes huérfanos desactivados:   ${deactivatedCount}`);
  console.log(`   • Apuntes con archivo válido en BD: ${activeNotes.length - deactivatedCount}`);
  console.log(`   • Archivos huérfanos en disco:      ${diskOrphanCount}`);
  console.log('='.repeat(75));

  if (deactivatedCount > 0) {
    console.log('\n📝 Detalle de apuntes desactivados por falta de archivo físico:');
    deactivatedNotes.forEach((n) => {
      console.log(`   - ID #${n.id}: "${n.title}" (${n.filename})`);
    });
  }
}

cleanOrphanedNotes()
  .then(() => {
    console.log('\n✅ Proceso de limpieza finalizado exitosamente.\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Error durante el proceso de limpieza:', err);
    process.exit(1);
  });
