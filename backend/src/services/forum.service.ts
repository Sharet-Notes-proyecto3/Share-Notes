// src/services/forum.service.ts
import pool from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { RowDataPacket } from 'mysql2';

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

    const [replies] = await pool.query<RowDataPacket[]>(
      `SELECT fr.id, fr.body, fr.created_at, u.name AS author_name,
              IFNULL(fr.upvotes, 0) AS upvotes
       FROM forum_replies fr
       JOIN users u ON fr.author_id = u.id
       WHERE fr.thread_id = ? AND fr.is_active = TRUE
       ORDER BY fr.created_at ASC`,
      [threadId]
    );

    return { thread: threads[0], replies };
  }

  // ─── Respuestas ───────────────────────────────────────────────────────────

  async createReply(data: { body: string; threadId: number; authorId: number }) {
    const [thread] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM forum_threads WHERE id = ? AND is_active = TRUE',
      [data.threadId]
    );
    if (!thread[0]) throw new AppError(404, 'Hilo no encontrado');

    const [result] = await pool.query(
      'INSERT INTO forum_replies (body, thread_id, author_id) VALUES (?, ?, ?)',
      [data.body, data.threadId, data.authorId]
    );
    return { id: (result as any).insertId, message: 'Respuesta publicada' };
  }

  // ─── Votación ─────────────────────────────────────────────────────────────

  async voteReply(replyId: number) {
    try {
      await pool.query('UPDATE forum_replies SET upvotes = upvotes + 1 WHERE id = ?', [replyId]);
    } catch {
      // Ignorar en caso de esquema legacy sin columna upvotes
    }
    return { message: 'Voto registrado exitosamente' };
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
