// =============================================================================
// SERVICIO DE AUTENTICACIÓN Y SESIÓN
// Responsable: Integrante 1 - Autenticación y Perfil de Usuario
// =============================================================================

import { api } from './api';

export const authService = {
  /**
   * Inicia sesión utilizando correo y contraseña.
   */
  async login(email, password) {
    if (!email?.trim()) {
      throw new Error('El correo electrónico es obligatorio.');
    }

    if (!password) {
      throw new Error('La contraseña es obligatoria.');
    }

    const normalizedEmail = email.trim().toLowerCase();

    return await api.post('/auth/login', {
      email: normalizedEmail,
      password,
    });
  },

  /**
   * Registra un nuevo usuario.
   */
  async register(
    name,
    email,
    password,
    role = 'student'
  ) {
    if (!name?.trim()) {
      throw new Error('El nombre es obligatorio.');
    }

    if (!email?.trim()) {
      throw new Error('El correo electrónico es obligatorio.');
    }

    if (!password) {
      throw new Error('La contraseña es obligatoria.');
    }

    if (password.length < 6) {
      throw new Error(
        'La contraseña debe tener al menos 6 caracteres.'
      );
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    return await api.post('/auth/register', {
      name: normalizedName,
      email: normalizedEmail,
      password,
      role,
    });
  },

  /**
   * Obtiene el perfil del usuario autenticado.
   */
  async getProfile(token) {
    if (!token) {
      throw new Error(
        'No existe un token de autenticación.'
      );
    }

    return await api.get('/auth/profile', token);
  },
};