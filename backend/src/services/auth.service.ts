// src/services/auth.service.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { JwtPayload, UserRole } from '../types';
import { AppError } from '../middlewares/error.middleware';
import { RowDataPacket } from 'mysql2';
import { getRelatedArticle } from '../integrations/wikipedia.api';
import fs from 'fs/promises';
import path from 'path';
import { PROFILE_PHOTO_DIR } from '../middlewares/upload.middleware';

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
  avatar_url: string | null;
  created_at?: string;
}

export class AuthService {

  async register(name: string, email: string, password: string, role: UserRole = 'student') {
    // Verificar si el email ya existe
    const [rows] = await pool.query<UserRow[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (rows.length > 0) {
      throw new AppError(409, 'El correo ya está registrado');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, role]
    );

    const insertId = (result as any).insertId;
    return { id: insertId, name, email, role };
  }

  async login(email: string, password: string) {
    const [rows] = await pool.query<UserRow[]>(
      'SELECT id, name, email, password_hash, role, is_active, avatar_url FROM users WHERE email = ?',
      [email]
    );

    const user = rows[0];
    if (!user) {
      throw new AppError(401, 'Credenciales incorrectas');
    }
    if (!user.is_active) {
      throw new AppError(403, 'Cuenta suspendida. Contacta al administrador');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new AppError(401, 'Credenciales incorrectas');
    }

    const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role };
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new AppError(500, 'Error interno: configuración de seguridad incompleta (JWT_SECRET no definido)');
    }
    const token = jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    } as jwt.SignOptions);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
      },
    };
  }

  async getProfile(userId: number) {
    const [rows] = await pool.query<UserRow[]>(
      'SELECT id, name, email, role, is_active, avatar_url, created_at FROM users WHERE id = ?',
      [userId]
    );
    if (!rows[0]) throw new AppError(404, 'Usuario no encontrado');
    return rows[0];
  }

  async updateProfileName(userId: number, name: string) {
    const normalizedName = name.trim();
    if (!normalizedName || normalizedName.length > 100) {
      throw new AppError(400, 'El nombre debe tener entre 1 y 100 caracteres');
    }

    await pool.query('UPDATE users SET name = ? WHERE id = ?', [normalizedName, userId]);
    return this.getProfile(userId);
  }

  async updateProfilePhoto(userId: number, filename: string) {
    const [rows] = await pool.query<UserRow[]>(
      'SELECT id, avatar_url FROM users WHERE id = ?',
      [userId]
    );
    const user = rows[0];
    if (!user) throw new AppError(404, 'Usuario no encontrado');

    const avatarUrl = `/uploads/profile-photos/${filename}`;
    await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, userId]);
    await this.removeStoredProfilePhoto(user.avatar_url);
    return this.getProfile(userId);
  }

  async removeProfilePhoto(userId: number) {
    const [rows] = await pool.query<UserRow[]>(
      'SELECT id, avatar_url FROM users WHERE id = ?',
      [userId]
    );
    const user = rows[0];
    if (!user) throw new AppError(404, 'Usuario no encontrado');

    await pool.query('UPDATE users SET avatar_url = NULL WHERE id = ?', [userId]);
    await this.removeStoredProfilePhoto(user.avatar_url);
    return this.getProfile(userId);
  }

  private async removeStoredProfilePhoto(avatarUrl: string | null) {
    const filename = avatarUrl?.match(/^\/uploads\/profile-photos\/([a-zA-Z0-9-]+\.(?:jpg|png|webp))$/i)?.[1];
    if (!filename) return;

    try {
      await fs.unlink(path.join(PROFILE_PHOTO_DIR, filename));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('No se pudo eliminar la foto de perfil anterior:', error);
      }
    }
  }

  /**
   * Obtiene un artículo de Wikipedia relacionado con un tema (ej. carrera del estudiante)
   */
  async getRelatedTopic(tema: string) {
    if (!tema || !tema.trim()) {
      return { articulo: null };
    }
    const articulo = await getRelatedArticle(tema.trim());
    return { articulo };
  }
}