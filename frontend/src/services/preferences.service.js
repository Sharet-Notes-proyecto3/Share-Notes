// src/services/preferences.service.js
// - Notificaciones por correo: se guardan en la base de datos (endpoint /preferences)
// - Pantalla de inicio: se guarda en este navegador, separada por usuario

import { api } from './api';

// Secciones que se pueden elegir como pantalla de inicio.
// "roles" limita la opción a quienes tienen acceso a esa sección.
export const START_OPTIONS = [
  { id: 'notes', label: 'Apuntes & QR', hint: 'El repositorio de apuntes' },
  { id: 'forum', label: 'Foro Académico', hint: 'Debates y preguntas por materia' },
  { id: 'teacher', label: 'Panel Docente', hint: 'Certificación de apuntes y reportes', roles: ['teacher', 'admin'] },
  { id: 'moderator', label: 'Moderación', hint: 'Denuncias y contenido', roles: ['moderator', 'admin'] },
  { id: 'admin', label: 'Administración', hint: 'Usuarios y catálogo académico', roles: ['admin'] },
];

export const optionsForRole = (role) =>
  START_OPTIONS.filter((o) => !o.roles || o.roles.includes(role));

const startTabKey = (userId) => `sharenotes:start-tab:${userId ?? 'anon'}`;

export const preferencesService = {
  /** Lee si el usuario quiere recibir correos de ShareNotes */
  async getEmailPreference(token) {
    const res = await api.get('/preferences', token);
    return Boolean(res?.emailNotifications);
  },

  /** Guarda la preferencia de correos en la base de datos */
  async saveEmailPreference(token, enabled) {
    return api.put('/preferences', { emailNotifications: Boolean(enabled) }, token);
  },

  /** Pantalla de inicio guardada; si ya no tiene acceso a ella, vuelve a "notes" */
  getStartTab(userId, role) {
    let saved = 'notes';
    try {
      saved = localStorage.getItem(startTabKey(userId)) || 'notes';
    } catch {
      // Sin almacenamiento disponible: se usa Apuntes
    }
    return optionsForRole(role).some((o) => o.id === saved) ? saved : 'notes';
  },

  setStartTab(userId, tab) {
    try {
      localStorage.setItem(startTabKey(userId), tab);
    } catch {
      // Sin almacenamiento disponible: la preferencia no se guarda
    }
  },
};

export default preferencesService;