// src/services/admin.service.ts
import pool from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { RowDataPacket } from 'mysql2';
import QRCode from 'qrcode';
import { logAuditAction } from './audit.service';

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

    await logAuditAction({
      userId: adminId,
      userRole: 'admin',
      action: user.is_active ? 'SUSPEND_USER' : 'REACTIVATE_USER',
      targetResource: 'user',
      targetId: userId,
      details: { previousStatus: user.is_active, newStatus: !user.is_active },
    });

    return { message: user.is_active ? 'Usuario suspendido' : 'Usuario reactivado' };
  }

  async changeUserRole(userId: number, role: 'student' | 'teacher' | 'moderator' | 'admin', adminId: number) {
    if (userId === adminId) throw new AppError(400, 'No puedes cambiar tu propio rol');
    if (!['student', 'teacher', 'moderator', 'admin'].includes(role)) {
      throw new AppError(400, 'Rol inválido');
    }

    const [rows] = await pool.query<RowDataPacket[]>('SELECT id, role FROM users WHERE id = ?', [userId]);
    if (!rows[0]) throw new AppError(404, 'Usuario no encontrado');

    const oldRole = rows[0].role;
    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);

    await logAuditAction({
      userId: adminId,
      userRole: 'admin',
      action: 'CHANGE_USER_ROLE',
      targetResource: 'user',
      targetId: userId,
      details: { previousRole: oldRole, newRole: role },
    });

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

  async deleteNote(noteId: number, adminId: number = 1) {
    await pool.query('UPDATE notes SET is_active = FALSE WHERE id = ?', [noteId]);
    await logAuditAction({
      userId: adminId,
      userRole: 'admin',
      action: 'ADMIN_DELETE_NOTE',
      targetResource: 'note',
      targetId: noteId,
    });
    return { message: 'Apunte eliminado por el administrador' };
  }

  async deleteThread(threadId: number, adminId: number = 1) {
    await pool.query('UPDATE forum_threads SET is_active = FALSE WHERE id = ?', [threadId]);
    await logAuditAction({
      userId: adminId,
      userRole: 'admin',
      action: 'ADMIN_DELETE_THREAD',
      targetResource: 'forum_thread',
      targetId: threadId,
    });
    return { message: 'Hilo eliminado por el administrador' };
  }

  async deleteReply(replyId: number, adminId: number = 1) {
    await pool.query('UPDATE forum_replies SET is_active = FALSE WHERE id = ?', [replyId]);
    await logAuditAction({
      userId: adminId,
      userRole: 'admin',
      action: 'ADMIN_DELETE_REPLY',
      targetResource: 'forum_reply',
      targetId: replyId,
    });
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

    await logAuditAction({
      userId: data.adminId,
      userRole: 'admin',
      action: 'APPLY_SANCTION',
      targetResource: 'user',
      targetId: data.userId,
      details: { type: data.type, reason: data.reason, expiresAt: data.expiresAt },
    });

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

  // ─── Catálogo Académico ───────────────────────────────────────────────────

  async getCatalog() {
    const [careers] = await pool.query<RowDataPacket[]>('SELECT id, name FROM careers ORDER BY name ASC');
    const [subjects] = await pool.query<RowDataPacket[]>(
      `SELECT s.id, s.name, s.semester, s.career_id, c.name AS career_name
       FROM subjects s JOIN careers c ON s.career_id = c.id
       ORDER BY s.semester ASC, s.name ASC`
    );
    return { careers, subjects };
  }

  async createCareer(name: string) {
    if (!name || !name.trim()) throw new AppError(400, 'El nombre de la carrera es requerido');
    const [existing] = await pool.query<RowDataPacket[]>('SELECT id FROM careers WHERE name = ?', [name.trim()]);
    if (existing[0]) throw new AppError(400, 'La carrera ya existe');

    const [result]: any = await pool.query('INSERT INTO careers (name) VALUES (?)', [name.trim()]);
    return { id: result.insertId, name: name.trim(), message: 'Carrera creada exitosamente' };
  }

  async createSubject(data: { name: string; semester: number; careerId: number }) {
    if (!data.name || !data.name.trim()) throw new AppError(400, 'El nombre de la materia es requerido');
    if (!data.semester || data.semester < 1 || data.semester > 10) throw new AppError(400, 'Semestre debe estar entre 1 y 10');
    if (!data.careerId) throw new AppError(400, 'La carrera asociada es requerida');

    const [career] = await pool.query<RowDataPacket[]>('SELECT id FROM careers WHERE id = ?', [data.careerId]);
    if (!career[0]) throw new AppError(404, 'La carrera especificada no existe');

    const [result]: any = await pool.query(
      'INSERT INTO subjects (name, semester, career_id) VALUES (?, ?, ?)',
      [data.name.trim(), data.semester, data.careerId]
    );

    return { id: result.insertId, name: data.name.trim(), semester: data.semester, careerId: data.careerId, message: 'Materia creada exitosamente' };
  }

  async deleteSubject(subjectId: number, adminId: number = 1) {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT id, name FROM subjects WHERE id = ?', [subjectId]);
    if (!rows[0]) throw new AppError(404, 'Materia no encontrada');
    await pool.query('DELETE FROM subjects WHERE id = ?', [subjectId]);
    await logAuditAction({
      userId: adminId,
      userRole: 'admin',
      action: 'DELETE_SUBJECT',
      targetResource: 'subject',
      targetId: subjectId,
      details: { name: rows[0].name },
    });
    return { message: 'Materia eliminada exitosamente' };
  }

  async deleteCareer(careerId: number, adminId: number = 1) {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT id, name FROM careers WHERE id = ?', [careerId]);
    if (!rows[0]) throw new AppError(404, 'Carrera no encontrada');
    await pool.query('DELETE FROM careers WHERE id = ?', [careerId]);
    await logAuditAction({
      userId: adminId,
      userRole: 'admin',
      action: 'DELETE_CAREER',
      targetResource: 'career',
      targetId: careerId,
      details: { name: rows[0].name },
    });
    return { message: 'Carrera y materias asociadas eliminadas exitosamente' };
  }
}

