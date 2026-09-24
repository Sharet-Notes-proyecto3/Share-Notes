// src/services/teacher.service.ts
import pool from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { RowDataPacket } from 'mysql2';
import { logAuditAction } from './audit.service';
import { generatePdfReport } from '../utils/microservicesClient';


export class TeacherService {
  /**
   * Marca un apunte como "Recurso Verificado / Oficial"
   */
  async verifyNote(noteId: number, teacherId: number, role: string) {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, title, subject_id, verified FROM notes WHERE id = ? AND is_active = TRUE',
      [noteId]
    );
    const note = rows[0];
    if (!note) {
      throw new AppError(404, 'Apunte no encontrado');
    }

    await pool.query(
      'UPDATE notes SET verified = TRUE, verified_by = ? WHERE id = ?',
      [teacherId, noteId]
    );

    // Registrar en auditoría
    await logAuditAction({
      userId: teacherId,
      userRole: role,
      action: 'VERIFY_NOTE',
      targetResource: 'note',
      targetId: noteId,
      details: { title: note.title, subjectId: note.subject_id },
    });

    return {
      message: 'Apunte verificado como recurso oficial exitosamente',
      noteId,
      verified: true,
      verifiedBy: teacherId,
    };
  }

  /**
   * Marca una respuesta del foro como "Solución Verificada por Docente"
   */
  async markAnswerSolution(replyId: number, teacherId: number, role: string) {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, thread_id FROM forum_replies WHERE id = ? AND is_active = TRUE',
      [replyId]
    );
    const reply = rows[0];
    if (!reply) {
      throw new AppError(404, 'Respuesta no encontrada');
    }

    await pool.query(
      'UPDATE forum_replies SET is_solution = TRUE WHERE id = ?',
      [replyId]
    );

    // Registrar en auditoría
    await logAuditAction({
      userId: teacherId,
      userRole: role,
      action: 'MARK_SOLUTION',
      targetResource: 'forum_reply',
      targetId: replyId,
      details: { threadId: reply.thread_id },
    });

    return {
      message: 'Respuesta marcada como solución verificada por docente exitosamente',
      replyId,
      isSolution: true,
    };
  }

  /**
   * Cierra un hilo de discusión en el foro
   */
  async closeThread(threadId: number, teacherId: number, role: string) {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, title, is_closed FROM forum_threads WHERE id = ? AND is_active = TRUE',
      [threadId]
    );
    const thread = rows[0];
    if (!thread) {
      throw new AppError(404, 'Hilo de discusión no encontrado');
    }

    await pool.query(
      'UPDATE forum_threads SET is_closed = TRUE WHERE id = ?',
      [threadId]
    );

    // Registrar en auditoría
    await logAuditAction({
      userId: teacherId,
      userRole: role,
      action: 'CLOSE_THREAD',
      targetResource: 'forum_thread',
      targetId: threadId,
      details: { title: thread.title },
    });

    return {
      message: 'Hilo de discusión cerrado por el docente exitosamente',
      threadId,
      isClosed: true,
    };
  }

  /**
   * Genera el reporte PDF con métricas analíticas del curso asignado al docente
   */
  async generateCourseReport(subjectId: number, teacherId: number, role: string): Promise<Buffer> {
    // 1. Obtener información de la materia
    const [subjRows] = await pool.query<RowDataPacket[]>(
      'SELECT id, name FROM subjects WHERE id = ?',
      [subjectId]
    );
    if (!subjRows[0]) {
      throw new AppError(404, 'Asignatura no encontrada');
    }
    const subjectName = subjRows[0].name;

    // 2. Obtener nombre del docente
    const [teacherRows] = await pool.query<RowDataPacket[]>(
      'SELECT name FROM users WHERE id = ?',
      [teacherId]
    );
    const teacherName = teacherRows[0]?.name || `Docente ID ${teacherId}`;

    // 3. Obtener métricas de apuntes por estudiante
    const [notesStats] = await pool.query<RowDataPacket[]>(
      `SELECT u.id AS student_id, u.name AS student_name,
              COUNT(n.id) AS notes_count,
              SUM(IF(n.verified = TRUE, 1, 0)) AS verified_notes
       FROM users u
       JOIN notes n ON n.uploader_id = u.id
       WHERE n.subject_id = ? AND n.is_active = TRUE
       GROUP BY u.id, u.name
       ORDER BY notes_count DESC`,
      [subjectId]
    );

    // 4. Total de apuntes verificados
    const [verifTotalRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total_verified FROM notes WHERE subject_id = ? AND verified = TRUE AND is_active = TRUE`,
      [subjectId]
    );
    const totalVerified = verifTotalRows[0]?.total_verified || 0;

    // 5. Participación en el foro por estudiante
    const [forumStats] = await pool.query<RowDataPacket[]>(
      `SELECT u.id AS student_id, u.name AS student_name,
              (SELECT COUNT(*) FROM forum_threads t WHERE t.author_id = u.id AND t.subject_id = ? AND t.is_active = TRUE) AS threads_count,
              (SELECT COUNT(*) FROM forum_replies r JOIN forum_threads t ON r.thread_id = t.id WHERE r.author_id = u.id AND t.subject_id = ? AND r.is_active = TRUE) AS replies_count
       FROM users u
       HAVING (threads_count > 0 OR replies_count > 0)
       ORDER BY (threads_count + replies_count) DESC`,
      [subjectId, subjectId]
    );

    // 6. Intentar generar PDF mediante microservicio MS-PDF
    const pdfData = {
      username: teacherName,
      subjectName,
      totalVerified,
      notes: notesStats.map((n: any) => ({
        title: `Estudiante: ${n.student_name} (${n.notes_count} apuntes, ${n.verified_notes} verificados)`,
        subject: subjectName,
        createdAt: new Date().toISOString(),
      })),
    };

    let pdfBuffer = await generatePdfReport(pdfData);

    // Fallback local en Buffer PDF estándar si MS-PDF no está disponible
    if (!pdfBuffer) {
      const pdfText = `%PDF-1.4\n1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj\n3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R>> endobj\n4 0 obj <</Length 120>> stream\nBT /F1 12 Tf 50 750 Td (Reporte Analitico del Curso: ${subjectName}) Tj 0 -20 Td (Docente: ${teacherName}) Tj 0 -20 Td (Apuntes Verificados: ${totalVerified}) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000216 00000 n \ntrailer <</Size 5 /Root 1 0 R>>\nstartxref\n386\n%%EOF`;
      pdfBuffer = Buffer.from(pdfText);
    }


    // Registrar en auditoría
    await logAuditAction({
      userId: teacherId,
      userRole: role,
      action: 'GENERATE_COURSE_PDF',
      targetResource: 'subject',
      targetId: subjectId,
      details: { subjectName },
    });

    return pdfBuffer;
  }

  /**
   * Obtiene la lista de asignaturas asignadas al docente (o todas si es admin)
   */
  async getTeacherCourses(teacherId: number, role: string) {
    if (role === 'admin') {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT s.id, s.name, s.semester, c.name AS career_name
         FROM subjects s
         JOIN careers c ON s.career_id = c.id
         ORDER BY s.semester, s.name`
      );
      return rows;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT s.id, s.name, s.semester, c.name AS career_name
       FROM teacher_courses tc
       JOIN subjects s ON tc.subject_id = s.id
       JOIN careers c ON s.career_id = c.id
       WHERE tc.teacher_id = ?
       ORDER BY s.semester, s.name`,
      [teacherId]
    );
    return rows;
  }
}
