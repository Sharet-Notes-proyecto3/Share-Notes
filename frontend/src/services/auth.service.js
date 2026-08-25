// =============================================================================
// MODIFICACIÓN 1 — SERVICIO DE AUTENTICACIÓN Y SESIÓN
// Responsable: Integrante 1 (Autenticación & Perfil de Usuario)
// =============================================================================

import { api } from './api';

export const authService = {
  /**
   * Inicia sesión con correo y contraseña
   */
  async login(email, password) {
    return await api.post('/auth/login', { email, password });
  },

  /**
   * Registra un nuevo usuario con rol especificado
   */
  async register(name, email, password, role = 'student') {
    return await api.post('/auth/register', { name, email, password, role });
  },

  /**
   * Obtiene la información del perfil del usuario autenticado
   */
  async getProfile(token) {
    return await api.get('/auth/profile', token);
  },
};
