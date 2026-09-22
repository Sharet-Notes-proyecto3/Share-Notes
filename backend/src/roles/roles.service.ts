import pool from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { Role, ROLE_HIERARCHY } from './roles.definition';
import { RowDataPacket } from 'mysql2';
import { logAuditAction } from '../services/audit.service';

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export class RolesService {

  async assignRole(targetUserId: number, newRole: Role, requesterId: number): Promise<{ message: string }> {
    if (targetUserId === requesterId && newRole !== 'admin') {
      throw new AppError(400, 'No puedes cambiar tu propio rol a uno inferior');
    }

    const [rows] = await pool.query<UserRow[]>(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [targetUserId]
    );
    const user = rows[0];
    if (!user) throw new AppError(404, 'Usuario no encontrado');

    if (user.role === newRole) {
      throw new AppError(400, `El usuario ya tiene el rol "${newRole}"`);
    }

    await pool.query('UPDATE users SET role = ? WHERE id = ?', [newRole, targetUserId]);

    await logAuditAction({
      userId: requesterId,
      userRole: 'admin',
      action: 'ASSIGN_ROLE',
      targetResource: 'user',
      targetId: targetUserId,
      details: { previousRole: user.role, newRole, targetName: user.name },
    });

    return {
      message: `Rol actualizado: ${user.name} ahora es "${newRole}"`,
    };
  }

  
  async listUsersWithRoles(): Promise<UserRow[]> {
    const [rows] = await pool.query<UserRow[]>(
      `SELECT id, name, email, role, is_active, created_at
       FROM users
       ORDER BY FIELD(role,'admin','moderator','teacher','student'), name`
    );
    return rows;
  }

  async getUserPermissions(userId: number): Promise<{ role: Role; permissions: string[] }> {
    const [rows] = await pool.query<UserRow[]>(
      'SELECT role FROM users WHERE id = ?',
      [userId]
    );
    if (!rows[0]) throw new AppError(404, 'Usuario no encontrado');

    const role = rows[0].role;
    const { ROLE_PERMISSIONS } = await import('./roles.definition');
    return { role, permissions: ROLE_PERMISSIONS[role] };
  }
}
