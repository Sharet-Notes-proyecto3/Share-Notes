// src/services/preferences.service.ts
import pool from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { RowDataPacket } from 'mysql2';

export class PreferencesService {
  /**
   * Lee las preferencias del usuario autenticado
   */
  async get(userId: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT email_notifications FROM users WHERE id = ?',
      [userId]
    );
    if (!rows[0]) {
      throw new AppError(404, 'Usuario no encontrado');
    }
    return { emailNotifications: Boolean(rows[0].email_notifications) };
  }

  /**
   * Guarda si el usuario quiere recibir correos de ShareNotes
   */
  async update(userId: number, emailNotifications: boolean) {
    await pool.query('UPDATE users SET email_notifications = ? WHERE id = ?', [
      emailNotifications,
      userId,
    ]);
    return { message: 'Preferencias guardadas', emailNotifications };
  }
}