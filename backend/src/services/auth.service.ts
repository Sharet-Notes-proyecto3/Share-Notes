// src/services/auth.service.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { JwtPayload, UserRole } from '../types';
import { AppError } from '../middlewares/error.middleware';
import { RowDataPacket } from 'mysql2';
import { getRelatedArticle } from '../integrations/wikipedia.api';

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
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
      'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ?',
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
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }

  async getProfile(userId: number) {
    const [rows] = await pool.query<UserRow[]>(
      'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?',
      [userId]
    );
    if (!rows[0]) throw new AppError(404, 'Usuario no encontrado');
    return rows[0];
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