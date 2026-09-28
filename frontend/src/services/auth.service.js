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
    role = 'student',
    programType = null,
    semester = null
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

    const payload = {
      name: normalizedName,
      email: normalizedEmail,
      password,
      role,
    };

    if (programType) payload.programType = programType;
    if (semester !== null && semester !== undefined && semester !== '') {
      payload.semester = Number(semester);
    }

    return await api.post('/auth/register', payload);
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

  /**
   * Obtiene un artículo de Wikipedia relacionado con un tema o carrera.
   */
  async getRelatedTopic(tema) {
    const query = tema ? `?tema=${encodeURIComponent(tema)}` : '';
    return await api.get(`/auth/profile/related-topic${query}`);
  },

    /**
   * Lista las carreras disponibles del catálogo (para el Onboarding).
   */
  async getCareers(token) {
    return await api.get('/auth/careers', token);
  },

  /**
   * Guarda los datos académicos del estudiante (carrera, semestre y tipo de programa).
   */
  async updateAcademicProfile(token, careerId, semester, programType = null) {
    const payload = {};
    if (careerId !== undefined && careerId !== null && careerId !== '') {
      payload.careerId = Number(careerId);
    }
    if (semester !== undefined && semester !== null && semester !== '') {
      payload.semester = Number(semester);
    }
    if (programType) {
      payload.programType = programType;
    }
    return await api.patch('/auth/profile/academic', payload, token);
  },
};