// src/services/moderator.service.ts
import pool from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { RowDataPacket } from 'mysql2';
import { logAuditAction } from './audit.service';

export class ModeratorService {
  /**
   * Listar cola de denuncias/reportes con filtro por estado
   */
  async listReports(status?: string) {
    let query = `
      SELECT r.id, r.target_type, r.target_id, r.reason, r.status, r.created_at,
             r.resolved_by, r.resolved_at,
             u.name AS reporter_name, u.email AS reporter_email,
             mod_user.name AS resolver_name
      FROM reports r
      JOIN users u ON r.reporter_id = u.id
      LEFT JOIN users mod_user ON r.resolved_by = mod_user.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }
    query += ' ORDER BY r.created_at DESC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows;
  }

  /**
   * Resolver o descartar una denuncia
   */
  async resolveReport(reportId: number, status: 'resolved' | 'dismissed', moderatorId: number, role: string) {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, target_type, target_id FROM reports WHERE id = ?',
      [reportId]
    );
    const report = rows[0];
    if (!report) {
      throw new AppError(404, 'Denuncia no encontrada');
    }

    await pool.query(
      'UPDATE reports SET status = ?, resolved_by = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, moderatorId, reportId]
    );

    // Registrar en auditoría
    await logAuditAction({
      userId: moderatorId,
      userRole: role,
      action: status === 'resolved' ? 'RESOLVE_REPORT' : 'DISMISS_REPORT',
      targetResource: 'report',
      targetId: reportId,
      details: { targetType: report.target_type, targetId: report.target_id, status },
    });

    return {
      message: `Denuncia marcada como ${status === 'resolved' ? 'atendida' : 'descartada'} exitosamente`,
      reportId,
      status,
    };
  }

  /**
   * Moderar visibilidad de un apunte (visible, hidden, blocked)
   */
  async moderateNoteStatus(noteId: number, status: 'visible' | 'hidden' | 'blocked', moderatorId: number, role: string, reason?: string) {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, title, uploader_id FROM notes WHERE id = ?',
      [noteId]
    );
    const note = rows[0];
    if (!note) {
      throw new AppError(404, 'Apunte no encontrado');
    }

    await pool.query(
      'UPDATE notes SET moderation_status = ? WHERE id = ?',
      [status, noteId]
    );

    // Registrar en auditoría
    await logAuditAction({
      userId: moderatorId,
      userRole: role,
      action: 'MODERATE_NOTE_STATUS',
      targetResource: 'note',
      targetId: noteId,
      details: { title: note.title, uploaderId: note.uploader_id, moderationStatus: status, reason },
    });

    return {
      message: `Estado de moderación del apunte actualizado a "${status}"`,
      noteId,
      moderationStatus: status,
    };
  }

  /**
   * Eliminar/ocultar publicación del foro por infracción
   */
  async moderateDeletePost(threadId: number, moderatorId: number, role: string, reason: string = 'Violación de términos de uso') {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, title, author_id FROM forum_threads WHERE id = ?',
      [threadId]
    );
    const thread = rows[0];
    if (!thread) {
      throw new AppError(404, 'Publicación del foro no encontrada');
    }

    await pool.query(
      'UPDATE forum_threads SET is_active = FALSE, moderated_by = ?, moderation_reason = ? WHERE id = ?',
      [moderatorId, reason, threadId]
    );

    // Registrar en auditoría
    await logAuditAction({
      userId: moderatorId,
      userRole: role,
      action: 'MODERATE_DELETE_POST',
      targetResource: 'forum_thread',
      targetId: threadId,
      details: { title: thread.title, authorId: thread.author_id, reason },
    });

    return {
      message: 'Publicación eliminada por violar los términos de uso',
      threadId,
    };
  }

  /**
   * Aplicar restricción temporal de participación en el foro a un usuario
   */
  async restrictUser(userId: number, restrictedUntil: Date, moderatorId: number, role: string, reason: string = 'Infracción comunitaria') {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, name, role FROM users WHERE id = ?',
      [userId]
    );
    const user = rows[0];
    if (!user) {
      throw new AppError(404, 'Usuario no encontrado');
    }
    if (user.role === 'admin') {
      throw new AppError(403, 'No puedes aplicar restricciones a un administrador');
    }

    await pool.query(
      'UPDATE users SET restricted_until = ? WHERE id = ?',
      [restrictedUntil, userId]
    );

    // Registrar en auditoría
    await logAuditAction({
      userId: moderatorId,
      userRole: role,
      action: 'RESTRICT_USER_FORUM',
      targetResource: 'user',
      targetId: userId,
      details: { userName: user.name, restrictedUntil, reason },
    });

    return {
      message: 'Restricción temporal de participación en foro aplicada exitosamente',
      userId,
      restrictedUntil,
    };
  }

  /**
   * Obtener historial de logs de moderación
   */
  async getModerationLogs(userId?: number) {
    let query = `
      SELECT a.id, a.user_id, a.user_role, a.action, a.target_resource, a.target_id, a.details, a.created_at,
             u.name AS moderator_name, u.email AS moderator_email
      FROM audit_logs a
      JOIN users u ON a.user_id = u.id
      WHERE (a.action LIKE 'MODERATE_%' OR a.action LIKE 'RESTRICT_%' OR a.action LIKE 'RESOLVE_%' OR a.action LIKE 'DISMISS_%')
    `;
    const params: any[] = [];
    if (userId) {
      query += ' AND a.target_id = ?';
      params.push(userId);
    }
    query += ' ORDER BY a.created_at DESC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows;
  }
}
