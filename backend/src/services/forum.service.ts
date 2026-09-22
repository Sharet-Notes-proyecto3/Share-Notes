// src/services/forum.service.ts
import pool from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { RowDataPacket } from 'mysql2';
import { logAuditAction } from './audit.service';

interface ThreadRow extends RowDataPacket {
  id: number;
  title: string;
  body: string;
  subject_id: number;
  subject_name: string;
  author_id: number;
  author_name: string;
  reply_count: number;
  created_at: Date;
}

export class ForumService {

  // ─── Hilos ────────────────────────────────────────────────────────────────

  async createThread(data: { title: string; body: string; subjectId: number; authorId: number }) {
    // 1. Verificar si el usuario tiene una restricción comunitaria activa
    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT restricted_until FROM users WHERE id = ?',
      [data.authorId]
    );
    if (userRows[0]?.restricted_until && new Date(userRows[0].restricted_until) > new Date()) {
      throw new AppError(403, `Tu participación en el foro está temporalmente restringida hasta ${new Date(userRows[0].restricted_until).toLocaleString()}`);
    }

    const [subj] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM subjects WHERE id = ?',
      [data.subjectId]
    );
    if (!subj[0]) throw new AppError(404, 'Materia no encontrada');

    const [result] = await pool.query(
      'INSERT INTO forum_threads (title, body, subject_id, author_id) VALUES (?, ?, ?, ?)',
      [data.title, data.body, data.subjectId, data.authorId]
    );
    return { id: (result as any).insertId, message: 'Hilo creado' };
  }

  async listThreads(subjectId?: number) {
    let query = `
      SELECT ft.id, ft.title, ft.body, ft.created_at,
             s.name AS subject_name, ft.subject_id,
             u.name AS author_name, ft.author_id,
             (SELECT COUNT(*) FROM forum_replies fr WHERE fr.thread_id = ft.id AND fr.is_active = TRUE) AS reply_count
      FROM forum_threads ft
      JOIN subjects s ON ft.subject_id = s.id
      JOIN users    u ON ft.author_id  = u.id
      WHERE ft.is_active = TRUE
    `;
    const params: number[] = [];
    if (subjectId) { query += ' AND ft.subject_id = ?'; params.push(subjectId); }
    query += ' ORDER BY ft.created_at DESC';

    const [rows] = await pool.query<ThreadRow[]>(query, params);
    return rows;
  }

  async getThread(threadId: number) {
    const [threads] = await pool.query<ThreadRow[]>(
      `SELECT ft.id, ft.title, ft.body, ft.created_at,
              s.name AS subject_name, u.name AS author_name
       FROM forum_threads ft
       JOIN subjects s ON ft.subject_id = s.id
       JOIN users    u ON ft.author_id  = u.id
       WHERE ft.id = ? AND ft.is_active = TRUE`,
      [threadId]
    );
    if (!threads[0]) throw new AppError(404, 'Hilo no encontrado');

    let replies: RowDataPacket[] = [];
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT fr.id, fr.body, fr.created_at, u.name AS author_name,
                fr.upvotes AS upvotes
         FROM forum_replies fr
         JOIN users u ON fr.author_id = u.id
         WHERE fr.thread_id = ? AND fr.is_active = TRUE
         ORDER BY fr.created_at ASC`,
        [threadId]
      );
      replies = rows;
    } catch {
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT fr.id, fr.body, fr.created_at, u.name AS author_name,
                0 AS upvotes
         FROM forum_replies fr
         JOIN users u ON fr.author_id = u.id
         WHERE fr.thread_id = ? AND fr.is_active = TRUE
         ORDER BY fr.created_at ASC`,
        [threadId]
      );
      replies = rows;
    }

    return { thread: threads[0], replies };
  }

  // ─── Respuestas ───────────────────────────────────────────────────────────

  async createReply(data: { body: string; threadId: number; authorId: number }) {
    // 1. Verificar si el usuario tiene restricción temporal activa
    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT restricted_until FROM users WHERE id = ?',
      [data.authorId]
    );
    if (userRows[0]?.restricted_until && new Date(userRows[0].restricted_until) > new Date()) {
      throw new AppError(403, `Tu participación en el foro está temporalmente restringida hasta ${new Date(userRows[0].restricted_until).toLocaleString()}`);
    }

    // 2. Verificar que el hilo exista, esté activo y no esté cerrado
    const [thread] = await pool.query<RowDataPacket[]>(
      'SELECT id, is_closed FROM forum_threads WHERE id = ? AND is_active = TRUE',
      [data.threadId]
    );
    if (!thread[0]) throw new AppError(404, 'Hilo no encontrado');
    if (thread[0].is_closed) {
      throw new AppError(400, 'Este debate ha sido cerrado por el docente y no admite nuevas respuestas');
    }

    const [result] = await pool.query(
      'INSERT INTO forum_replies (body, thread_id, author_id) VALUES (?, ?, ?)',
      [data.body, data.threadId, data.authorId]
    );
    return { id: (result as any).insertId, message: 'Respuesta publicada' };
  }

  // ─── Votación ─────────────────────────────────────────────────────────────

  async voteReply(replyId: number, action: 'vote' | 'unvote' = 'vote') {
    try {
      if (action === 'unvote') {
        await pool.query('UPDATE forum_replies SET upvotes = GREATEST(0, upvotes - 1) WHERE id = ?', [replyId]);
      } else {
        await pool.query('UPDATE forum_replies SET upvotes = upvotes + 1 WHERE id = ?', [replyId]);
      }
    } catch {
      // Ignorar en caso de esquema legacy sin columna upvotes
    }
    return { message: action === 'unvote' ? 'Voto retirado' : 'Voto registrado' };
  }

  // ─── Eliminación ──────────────────────────────────────────────────────────

  async deleteReply(replyId: number, userId: number, userRole: string) {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT author_id, thread_id FROM forum_replies WHERE id = ?',
      [replyId]
    );
    if (!rows[0]) throw new AppError(404, 'Respuesta no encontrada');

    if (rows[0].author_id !== userId && userRole !== 'admin' && userRole !== 'moderator') {
      throw new AppError(403, 'No tienes permiso para eliminar esta respuesta');
    }

    await pool.query('UPDATE forum_replies SET is_active = FALSE WHERE id = ?', [replyId]);

    // Registrar en auditoría si fue eliminada por moderador o administrador
    if (userRole === 'admin' || userRole === 'moderator') {
      await logAuditAction({
        userId,
        userRole,
        action: userRole === 'admin' ? 'ADMIN_DELETE_REPLY' : 'MODERATE_DELETE_REPLY',
        targetResource: 'forum_reply',
        targetId: replyId,
        details: { threadId: rows[0].thread_id, authorId: rows[0].author_id },
      });
    }

    return { message: 'Respuesta eliminada correctamente' };
  }

  async deleteThread(threadId: number, userId: number, userRole: string) {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, title, author_id FROM forum_threads WHERE id = ?',
      [threadId]
    );
    if (!rows[0]) throw new AppError(404, 'Hilo no encontrado');

    if (rows[0].author_id !== userId && userRole !== 'admin' && userRole !== 'moderator') {
      throw new AppError(403, 'No tienes permiso para eliminar este debate');
    }

    await pool.query('UPDATE forum_threads SET is_active = FALSE WHERE id = ?', [threadId]);

    // Registrar en auditoría si fue eliminado por moderador o administrador
    if (userRole === 'admin' || userRole === 'moderator') {
      await logAuditAction({
        userId,
        userRole,
        action: userRole === 'admin' ? 'ADMIN_DELETE_THREAD' : 'MODERATE_DELETE_THREAD',
        targetResource: 'forum_thread',
        targetId: threadId,
        details: { title: rows[0].title, authorId: rows[0].author_id },
      });
    }

    return { message: 'Debate eliminado correctamente' };
  }

  // ─── Reportes ─────────────────────────────────────────────────────────────

  async report(data: {
    reporterId: number;
    targetType: 'note' | 'thread' | 'reply';
    targetId: number;
    reason: string;
  }) {
    await pool.query(
      'INSERT INTO reports (reporter_id, target_type, target_id, reason) VALUES (?, ?, ?, ?)',
      [data.reporterId, data.targetType, data.targetId, data.reason]
    );
    return { message: 'Reporte enviado al administrador' };
  }
}
