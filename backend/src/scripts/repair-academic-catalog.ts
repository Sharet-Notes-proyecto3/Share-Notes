// src/scripts/repair-academic-catalog.ts
// Ejecutar con: npm run db:repair-catalog
//
// Repara el catálogo académico de una base de datos que fue sembrada varias
// veces sin IDs explícitos. El problema típico es que las materias de los
// semestres 7-10 no existen porque los IDs 9-28 ya estaban ocupados por
// duplicados de los semestres 1-6.
//
// El script es idempotente:
//   1. Asegura las carreras 1-4.
//   2. Consolida materias duplicadas conservando el ID más bajo.
//   3. Remapea las referencias (notas, hilos y asignaciones docente-materia).
//   4. Elimina los duplicados.
//   5. Inserta las materias faltantes de los semestres 7-10.
//   6. Agrega un índice único para evitar futuros duplicados.

import pool from '../config/database';
import logger from '../utils/logger';
import { RowDataPacket } from 'mysql2';

const CAREERS = [
  { id: 1, name: 'Ingeniería en Sistemas' },
  { id: 2, name: 'Ingeniería Electrónica' },
  { id: 3, name: 'Administración de Empresas' },
  { id: 4, name: 'Contaduría Pública' },
];

const SUBJECTS = [
  // Ingeniería en Sistemas (semestres 1-6 tecnólogo, 7-10 ingeniería)
  { name: 'Cálculo I', semester: 1, careerId: 1 },
  { name: 'Fundamentos de Progr.', semester: 1, careerId: 1 },
  { name: 'Álgebra Lineal', semester: 2, careerId: 1 },
  { name: 'Estructura de Datos', semester: 3, careerId: 1 },
  { name: 'Bases de Datos', semester: 4, careerId: 1 },
  { name: 'Redes de Computadores', semester: 5, careerId: 1 },
  { name: 'Proyecto de Software I', semester: 5, careerId: 1 },
  { name: 'Proyecto de Software II', semester: 6, careerId: 1 },
  { name: 'Arquitectura de Software', semester: 7, careerId: 1 },
  { name: 'Inteligencia Artificial', semester: 8, careerId: 1 },
  { name: 'Seguridad Informática', semester: 9, careerId: 1 },
  { name: 'Computación en la Nube', semester: 10, careerId: 1 },

  // Ingeniería Electrónica
  { name: 'Circuitos Eléctricos I', semester: 1, careerId: 2 },
  { name: 'Electrónica Analógica', semester: 2, careerId: 2 },
  { name: 'Electrónica Digital', semester: 3, careerId: 2 },
  { name: 'Microcontroladores', semester: 4, careerId: 2 },
  { name: 'Señales y Sistemas', semester: 5, careerId: 2 },
  { name: 'Comunicaciones', semester: 6, careerId: 2 },
  { name: 'Sistemas Embebidos', semester: 7, careerId: 2 },
  { name: 'Control Automático', semester: 8, careerId: 2 },
  { name: 'Procesamiento Digital de Señales', semester: 9, careerId: 2 },
  { name: 'Telecomunicaciones Avanzadas', semester: 10, careerId: 2 },

  // Administración de Empresas
  { name: 'Introducción a la Administración', semester: 1, careerId: 3 },
  { name: 'Contabilidad Básica', semester: 2, careerId: 3 },
  { name: 'Mercadeo', semester: 3, careerId: 3 },
  { name: 'Recursos Humanos', semester: 4, careerId: 3 },
  { name: 'Emprendimiento', semester: 5, careerId: 3 },
  { name: 'Gestión de Operaciones', semester: 6, careerId: 3 },
  { name: 'Finanzas Corporativas', semester: 7, careerId: 3 },
  { name: 'Dirección Estratégica', semester: 8, careerId: 3 },
  { name: 'Gestión de Proyectos', semester: 9, careerId: 3 },
  { name: 'Negocios Internacionales', semester: 10, careerId: 3 },

  // Contaduría Pública
  { name: 'Contabilidad Financiera I', semester: 1, careerId: 4 },
  { name: 'Auditoría Financiera', semester: 2, careerId: 4 },
  { name: 'Tributación', semester: 3, careerId: 4 },
  { name: 'Costos', semester: 4, careerId: 4 },
  { name: 'Control Interno', semester: 5, careerId: 4 },
  { name: 'Presupuestos', semester: 6, careerId: 4 },
  { name: 'Auditoría de Sistemas', semester: 7, careerId: 4 },
  { name: 'Finanzas Públicas', semester: 8, careerId: 4 },
  { name: 'Normas Internacionales de Información Financiera', semester: 9, careerId: 4 },
  { name: 'Revisoría Fiscal', semester: 10, careerId: 4 },
];

interface DuplicateGroup extends RowDataPacket {
  name: string;
  semester: number;
  career_id: number;
  canonical_id: number;
  duplicate_ids: string;
}

async function repairAcademicCatalog() {
  const conn = await pool.getConnection();

  try {
    logger.info('🔄 Reparando catálogo académico...');
    await conn.beginTransaction();

    // 1. Carreras
    for (const career of CAREERS) {
      await conn.query(
        'INSERT IGNORE INTO careers (id, name) VALUES (?, ?)',
        [career.id, career.name],
      );
    }

    // 2. Detectar grupos de materias duplicadas (mismo nombre, semestre y carrera)
    const [groups] = await conn.query<DuplicateGroup[]>(
      `SELECT name, semester, career_id,
              MIN(id) AS canonical_id,
              GROUP_CONCAT(id ORDER BY id) AS duplicate_ids
       FROM subjects
       GROUP BY name, semester, career_id
       HAVING COUNT(*) > 1`,
    );

    let removedDuplicates = 0;

    for (const group of groups) {
      const allIds = String(group.duplicate_ids)
        .split(',')
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id));
      const duplicateIds = allIds.filter((id) => id !== group.canonical_id);

      if (duplicateIds.length === 0) continue;

      const placeholders = duplicateIds.map(() => '?').join(', ');

      // 3. Remapear referencias al ID canónico
      await conn.query(
        `UPDATE notes SET subject_id = ? WHERE subject_id IN (${placeholders})`,
        [group.canonical_id, ...duplicateIds],
      );
      await conn.query(
        `UPDATE forum_threads SET subject_id = ? WHERE subject_id IN (${placeholders})`,
        [group.canonical_id, ...duplicateIds],
      );

      // teacher_courses tiene PK compuesta: primero aseguramos la fila canónica
      // y después eliminamos las filas que apuntaban a los duplicados.
      await conn.query(
        `INSERT IGNORE INTO teacher_courses (teacher_id, subject_id)
         SELECT DISTINCT teacher_id, ? FROM teacher_courses
         WHERE subject_id IN (${placeholders})`,
        [group.canonical_id, ...duplicateIds],
      );
      await conn.query(
        `DELETE FROM teacher_courses WHERE subject_id IN (${placeholders})`,
        duplicateIds,
      );

      // 4. Eliminar materias duplicadas
      await conn.query(
        `DELETE FROM subjects WHERE id IN (${placeholders})`,
        duplicateIds,
      );

      removedDuplicates += duplicateIds.length;
    }

    // 5. Insertar las materias canónicas que falten (incluidas las de 7-10)
    let insertedSubjects = 0;
    for (const subject of SUBJECTS) {
      const [result]: any = await conn.query(
        `INSERT INTO subjects (name, semester, career_id)
         SELECT ?, ?, ? FROM DUAL
         WHERE NOT EXISTS (
           SELECT 1 FROM subjects
           WHERE name = ? AND semester = ? AND career_id = ?
         )`,
        [
          subject.name,
          subject.semester,
          subject.careerId,
          subject.name,
          subject.semester,
          subject.careerId,
        ],
      );
      insertedSubjects += result.affectedRows || 0;
    }

    // 6. Índice único para impedir que el catálogo se vuelva a duplicar
    const [indexes] = await conn.query<RowDataPacket[]>(
      `SELECT 1 FROM information_schema.statistics
       WHERE table_schema = DATABASE()
         AND table_name = 'subjects'
         AND index_name = 'uq_subject_catalog'
       LIMIT 1`,
    );

    if (indexes.length === 0) {
      await conn.query(
        'ALTER TABLE subjects ADD UNIQUE KEY uq_subject_catalog (name, semester, career_id)',
      );
    }

    await conn.commit();

    const [summary] = await conn.query<RowDataPacket[]>(
      `SELECT semester, COUNT(*) AS total
       FROM subjects
       GROUP BY semester
       ORDER BY semester`,
    );

    logger.info(
      `✅ Catálogo reparado: ${removedDuplicates} duplicados eliminados, ${insertedSubjects} materias insertadas.`,
    );
    logger.info(
      `📚 Materias por semestre: ${summary
        .map((row: any) => `${row.semester}=${row.total}`)
        .join(', ')}`,
    );
  } catch (err: any) {
    await conn.rollback();
    logger.error('❌ Error al reparar el catálogo académico:', err?.message || err);
    throw err;
  } finally {
    conn.release();
    await pool.end();
  }
}

repairAcademicCatalog().catch(() => process.exit(1));
