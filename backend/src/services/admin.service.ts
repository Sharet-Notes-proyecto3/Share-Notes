// src/services/admin.service.ts
import pool from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { RowDataPacket } from 'mysql2';
import QRCode from 'qrcode';

export class AdminService {

  // ─── Usuarios ─────────────────────────────────────────────────────────────

  async listUsers() {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC`
    );
    return rows;
  }

  async toggleUserStatus(userId: number, adminId: number) {
    if (userId === adminId) throw new AppError(400, 'No puedes suspenderte a ti mismo');

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, is_active, role FROM users WHERE id = ?',
      [userId]
    );
    const user = rows[0];
    if (!user) throw new AppError(404, 'Usuario no encontrado');
    if (user.role === 'admin') throw new AppError(403, 'No puedes suspender otro administrador');

    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [!user.is_active, userId]);
    return { message: user.is_active ? 'Usuario suspendido' : 'Usuario reactivado' };
  }

  async changeUserRole(userId: number, role: 'student' | 'teacher' | 'moderator' | 'admin', adminId: number) {
    if (userId === adminId) throw new AppError(400, 'No puedes cambiar tu propio rol');
    if (!['student', 'teacher', 'moderator', 'admin'].includes(role)) {
      throw new AppError(400, 'Rol inválido');
    }

    const [rows] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE id = ?', [userId]);
    if (!rows[0]) throw new AppError(404, 'Usuario no encontrado');

    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
    return { message: `Rol actualizado a ${role}` };
  }

  // ─── Reportes ─────────────────────────────────────────────────────────────

  async listReports(status?: string) {
    let query = `
      SELECT r.id, r.target_type, r.target_id, r.reason, r.status, r.created_at,
             u.name AS reporter_name, u.email AS reporter_email
      FROM reports r JOIN users u ON r.reporter_id = u.id
      WHERE 1=1
    `;
    const params: string[] = [];
    if (status) { query += ' AND r.status = ?'; params.push(status); }
    query += ' ORDER BY r.created_at DESC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows;
  }

  async resolveReport(reportId: number, status: 'reviewed' | 'dismissed') {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM reports WHERE id = ?',
      [reportId]
    );
    if (!rows[0]) throw new AppError(404, 'Reporte no encontrado');

    await pool.query('UPDATE reports SET status = ? WHERE id = ?', [status, reportId]);
    return { message: `Reporte marcado como: ${status}` };
  }

  // ─── Contenido ────────────────────────────────────────────────────────────

  async deleteNote(noteId: number) {
    await pool.query('UPDATE notes SET is_active = FALSE WHERE id = ?', [noteId]);
    return { message: 'Apunte eliminado por el administrador' };
  }

  async deleteThread(threadId: number) {
    await pool.query('UPDATE forum_threads SET is_active = FALSE WHERE id = ?', [threadId]);
    return { message: 'Hilo eliminado por el administrador' };
  }

  async deleteReply(replyId: number) {
    await pool.query('UPDATE forum_replies SET is_active = FALSE WHERE id = ?', [replyId]);
    return { message: 'Respuesta eliminada por el administrador' };
  }

  // ─── Sanciones ────────────────────────────────────────────────────────────

  async applySanction(data: {
    userId: number;
    adminId: number;
    type: 'warning' | 'temp_ban' | 'perm_ban';
    reason: string;
    expiresAt?: Date;
  }) {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, role FROM users WHERE id = ?',
      [data.userId]
    );
    if (!rows[0]) throw new AppError(404, 'Usuario no encontrado');
    if (rows[0].role === 'admin') throw new AppError(403, 'No puedes sancionar a un admin');

    await pool.query(
      'INSERT INTO sanctions (user_id, admin_id, type, reason, expires_at) VALUES (?, ?, ?, ?, ?)',
      [data.userId, data.adminId, data.type, data.reason, data.expiresAt || null]
    );

    // Si es ban permanente, desactivar la cuenta directamente
    if (data.type === 'perm_ban') {
      await pool.query('UPDATE users SET is_active = FALSE WHERE id = ?', [data.userId]);
    }

    return { message: `Sanción "${data.type}" aplicada al usuario` };
  }

  async listSanctions(userId?: number) {
    let query = `
      SELECT s.id, s.type, s.reason, s.expires_at, s.created_at,
             u.name AS user_name, a.name AS admin_name
      FROM sanctions s
      JOIN users u ON s.user_id  = u.id
      JOIN users a ON s.admin_id = a.id
      WHERE 1=1
    `;
    const params: number[] = [];
    if (userId) { query += ' AND s.user_id = ?'; params.push(userId); }
    query += ' ORDER BY s.created_at DESC';

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows;
  }

  // ─── QR ───────────────────────────────────────────────────────────────────

  async generateQR(): Promise<string> {
    const url = process.env.APP_PUBLIC_URL || 'http://localhost:3000';
    const qrDataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 });
    return qrDataUrl;
  }
}
