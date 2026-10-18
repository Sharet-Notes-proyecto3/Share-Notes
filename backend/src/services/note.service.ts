// src/services/note.service.ts
import pool from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import fs from 'fs';
import path from 'path';
import 'multer';
import QRCode from 'qrcode';
import {
  sendEmailNotification,
  generatePdfReport,
} from '../utils/microservicesClient';
import { logAuditAction } from './audit.service';
import logger from '../utils/logger';

interface NoteRow extends RowDataPacket {
  id: number;
  title: string;
  description: string;
  filename: string;
  original_name: string;
  mimetype: string;
  file_size: number;
  subject_id: number;
  subject_name: string;
  semester: number;
  career_name: string;
  uploader_id: number;
  uploader_name: string;
  is_active: boolean;
  created_at: Date;
}

export class NoteService {
  async upload(data: {
    title: string;
    description?: string;
    subjectId: number;
    uploaderId: number;
    file: Express.Multer.File;
  }): Promise<{ id: number; message: string; subjectName: string }> {
    // Verificar que la materia existe y obtener su nombre
    const [subj] = await pool.query<RowDataPacket[]>(
      'SELECT id, name FROM subjects WHERE id = ?',
      [data.subjectId],
    );
    if (!subj[0]) throw new AppError(404, 'Materia no encontrada');

    const [insertResult] = await pool.query<ResultSetHeader>(
      `INSERT INTO notes (title, description, filename, original_name, mimetype, file_size, subject_id, uploader_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.description || null,
        data.file.filename,
        data.file.originalname,
        data.file.mimetype,
        data.file.size,
        data.subjectId,
        data.uploaderId,
      ],
    );

    const noteId = insertResult.insertId;

    return {
      id: noteId,
      message: 'Apunte subido correctamente',
      subjectName: subj[0].name,
    };
  }

  /**
   * Dispara una notificación por email al subir un apunte con reintentos y trazabilidad.
   * Si tras los reintentos falla, registra el evento en la tabla audit_logs para auditoría.
   */
  async notifyUpload(data: {
    uploaderName: string;
    noteTitle: string;
    subjectName: string;
    notifyTo: string;
    noteId?: number;
    uploaderId?: number;
    correlationId: string;
  }): Promise<void> {
    const correlationId = data.correlationId;

    try {
      const emailResult = await sendEmailNotification(
        {
          to: data.notifyTo,
          uploaderName: data.uploaderName,
          noteTitle: data.noteTitle,
          subjectName: data.subjectName,
        },
        correlationId,
        2,
      );

      if (!emailResult.success) {
        logger.error(
          `Notificación por email no pudo ser entregada tras ${emailResult.attempts} intentos. Registrando en auditoría...`,
          {
            correlationId,
            recipient: data.notifyTo,
            noteTitle: data.noteTitle,
          },
        );

        await logAuditAction({
          userId: data.uploaderId || 1,
          userRole: 'system',
          action: 'EMAIL_NOTIFICATION_FAILED',
          targetResource: 'note_notification',
          targetId: data.noteId || undefined,
          details: {
            recipient: data.notifyTo,
            noteTitle: data.noteTitle,
            subjectName: data.subjectName,
            attempts: emailResult.attempts,
            error: emailResult.error || 'MS-Email no disponible',
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        logger.info(
          `Notificación por email registrada exitosamente (MessageID: ${emailResult.messageId})`,
          {
            correlationId,
            messageId: emailResult.messageId,
            recipient: data.notifyTo,
          },
        );

        await logAuditAction({
          userId: data.uploaderId || 1,
          userRole: 'system',
          action: 'EMAIL_NOTIFICATION_SENT',
          targetResource: 'note_notification',
          targetId: data.noteId || undefined,
          details: {
            recipient: data.notifyTo,
            noteTitle: data.noteTitle,
            subjectName: data.subjectName,
            messageId: emailResult.messageId,
            attempts: emailResult.attempts,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (err: any) {
      logger.error('Error crítico al procesar notificación de email:', {
        correlationId,
        error: err?.message,
      });

      try {
        await logAuditAction({
          userId: data.uploaderId || 1,
          userRole: 'system',
          action: 'EMAIL_NOTIFICATION_FAILED',
          targetResource: 'note_notification',
          targetId: data.noteId || undefined,
          details: {
            recipient: data.notifyTo,
            noteTitle: data.noteTitle,
            error: err?.message || 'Excepción no controlada',
            timestamp: new Date().toISOString(),
          },
        });
      } catch (auditErr: any) {
        logger.error('Error al guardar log de auditoría:', {
          correlationId,
          error: auditErr?.message,
        });
      }
    }
  }

  async list(
    filters: {
      subjectId?: number;
      semester?: number;
      careerId?: number;
      search?: string;
    },
    user?: {
      userId?: number;
      role?: string;
      semester?: number | null;
      program_type?: string | null;
      programType?: string | null;
    }
  ) {
    let query = `
      SELECT n.id, n.title, n.description, n.original_name, n.mimetype,
             n.file_size, n.created_at, n.uploader_id,
             s.name AS subject_name, s.semester,
             c.name AS career_name,
             u.name AS uploader_name
      FROM notes n
      JOIN subjects s ON n.subject_id = s.id
      JOIN careers  c ON s.career_id  = c.id
      JOIN users    u ON n.uploader_id = u.id
      WHERE n.is_active = TRUE
    `;
    const params: (string | number)[] = [];

    // Determinar si el usuario es docente y consultar sus materias asignadas en tiempo real desde la BD
    if (user?.role === 'teacher' && user?.userId) {
      const [cRows] = await pool.query<RowDataPacket[]>(
        'SELECT subject_id FROM teacher_courses WHERE teacher_id = ?',
        [user.userId]
      );
      const assignedSubjectIds = cRows.map((r: any) => Number(r.subject_id));
      if (assignedSubjectIds.length === 0) {
        // Docente sin materias asignadas: no ve apuntes
        return [];
      }

      if (filters.subjectId && assignedSubjectIds.includes(Number(filters.subjectId))) {
        query += ' AND n.subject_id = ?';
        params.push(Number(filters.subjectId));
      } else {
        query += ` AND n.subject_id IN (${assignedSubjectIds.map(() => '?').join(', ')})`;
        params.push(...assignedSubjectIds);
      }
    } else {
      // Determinar si el usuario es estudiante y consultar SIEMPRE su semestre en tiempo real desde la BD
      let studentSemester: number | null = null;
      if (user?.role === 'student' && user?.userId) {
        const [uRows] = await pool.query<RowDataPacket[]>(
          'SELECT semester FROM users WHERE id = ?',
          [user.userId]
        );
        if (uRows[0] && uRows[0].semester !== null && uRows[0].semester !== undefined) {
          studentSemester = Number(uRows[0].semester);
        }
      }

      if (user?.role === 'student' && studentSemester) {
        // Regla estricta de seguridad en backend: el estudiante solo puede ver notas de su propio semestre.
        // Se ignora y sobreescribe cualquier intento de filtrar por otro semestre desde el cliente.
        query += ' AND s.semester = ?';
        params.push(studentSemester);
      } else if (filters.semester) {
        query += ' AND s.semester = ?';
        params.push(filters.semester);
      }

      if (filters.subjectId) {
        query += ' AND n.subject_id = ?';
        params.push(filters.subjectId);
      }
    }
    if (filters.careerId) {
      query += ' AND s.career_id = ?';
      params.push(filters.careerId);
    }
    if (filters.search) {
      query += ' AND (n.title LIKE ? OR n.description LIKE ?)';
      const like = `%${filters.search}%`;
      params.push(like, like);
    }

    query += ' ORDER BY n.created_at DESC';
    const [rows] = await pool.query<NoteRow[]>(query, params);
    return rows;
  }

  async getFilePath(
    noteId: number,
  ): Promise<{ filePath: string; originalName: string; mimetype: string }> {
    const [rows] = await pool.query<NoteRow[]>(
      'SELECT filename, original_name, mimetype FROM notes WHERE id = ? AND is_active = TRUE',
      [noteId],
    );
    const note = rows[0];
    if (!note) throw new AppError(404, 'Apunte no encontrado');

    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const filePath = path.join(uploadDir, note.filename);

    if (!fs.existsSync(filePath))
      throw new AppError(404, 'Archivo no disponible');

    return {
      filePath,
      originalName: note.original_name,
      mimetype: note.mimetype,
    };
  }

  /**
   * Genera el código QR para un apunte específico (apuntando a su descarga)
   */
  async generateNoteQR(noteId: number): Promise<{
    qrCodeDataUrl: string;
    downloadUrl: string;
    noteTitle: string;
  }> {
    const [rows] = await pool.query<NoteRow[]>(
      'SELECT id, title, filename FROM notes WHERE id = ? AND is_active = TRUE',
      [noteId],
    );
    const note = rows[0];
    if (!note) throw new AppError(404, 'Apunte no encontrado');

    const appPublicUrl = process.env.APP_PUBLIC_URL || 'http://localhost:3000';
    const downloadUrl = `${appPublicUrl}/api/notes/${noteId}/download`;

    // Generar código QR en Base64 Data URL usando la librería qrcode
    const qrCodeDataUrl = await QRCode.toDataURL(downloadUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    return {
      qrCodeDataUrl,
      downloadUrl,
      noteTitle: note.title,
    };
  }

  async delete(noteId: number, requesterId: number, requesterRole: string) {
    const [rows] = await pool.query<NoteRow[]>(
      'SELECT id, title, uploader_id FROM notes WHERE id = ? AND is_active = TRUE',
      [noteId],
    );
    const note = rows[0];
    if (!note) throw new AppError(404, 'Apunte no encontrado');

    // Regla transversal ABAC: Permitido <=> (usuario.id = recurso.autor_id) OR (usuario.rol in {admin, moderator})
    if (
      requesterRole !== 'admin' &&
      requesterRole !== 'moderator' &&
      note.uploader_id !== requesterId
    ) {
      throw new AppError(403, 'No tienes permiso para eliminar este apunte');
    }

    await pool.query('UPDATE notes SET is_active = FALSE WHERE id = ?', [
      noteId,
    ]);

    // Registrar en auditoría si fue eliminado por moderador o administrador
    if (requesterRole === 'admin' || requesterRole === 'moderator') {
      await logAuditAction({
        userId: requesterId,
        userRole: requesterRole,
        action:
          requesterRole === 'admin'
            ? 'ADMIN_DELETE_NOTE'
            : 'MODERATE_DELETE_NOTE',
        targetResource: 'note',
        targetId: noteId,
        details: { title: note.title, uploaderId: note.uploader_id },
      });
    }

    return { message: 'Apunte eliminado' };
  }

  async getSubjects() {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT s.id, s.name, s.semester, c.name AS career_name
       FROM subjects s JOIN careers c ON s.career_id = c.id
       ORDER BY s.semester, s.name`,
    );
    return rows;
  }

  /**
   * Obtiene los apuntes de un usuario en formato adecuado para el reporte PDF.
   */
  async getNotesForReport(userId: number) {
    // Obtener nombre del usuario
    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT name, email FROM users WHERE id = ?',
      [userId],
    );
    const user = userRows[0];
    if (!user) throw new AppError(404, 'Usuario no encontrado');

    // Obtener apuntes del usuario
    const [noteRows] = await pool.query<NoteRow[]>(
      `SELECT n.id, n.title, n.created_at, s.name AS subject_name
       FROM notes n
       JOIN subjects s ON n.subject_id = s.id
       WHERE n.uploader_id = ? AND n.is_active = TRUE
       ORDER BY n.created_at DESC`,
      [userId],
    );

    return {
      username: user.name,
      email: user.email,
      notes: noteRows.map((n) => ({
        title: n.title,
        subject: n.subject_name,
        createdAt: n.created_at,
      })),
    };
  }

  /**
   * Orquesta la generación de un reporte PDF a través del microservicio MS-PDF.
   * Retorna el Buffer del PDF o lanza un error si el servicio no está disponible.
   */
  async requestPdfReport(userId: number, correlationId: string): Promise<Buffer> {
    const reportData = await this.getNotesForReport(userId);
    const pdfBuffer = await generatePdfReport(reportData, correlationId);

    if (!pdfBuffer) {
      throw new AppError(
        503,
        'El servicio de generación de PDFs no está disponible en este momento. Intenta más tarde.',
      );
    }

    return pdfBuffer;
  }
}
