// src/services/moderationService.js
import { api } from './api';

export const moderationService = {
  /**
   * Obtener la cola de denuncias pendientes o filtradas por estado
   * Backend endpoint: GET /api/reports
   */
  async getReportsQueue(token, status = 'pending') {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return api.get(`/reports${query}`, token);
  },

  /**
   * Resolver una denuncia (marcar como atendida)
   * Backend endpoint: PUT /api/reports/:id/resolve
   */
  async resolveReport(token, reportId) {
    return api.put(`/reports/${reportId}/resolve`, {}, token);
  },

  /**
   * Descartar una denuncia sin aplicar sanción
   * Backend endpoint: PUT /api/reports/:id/dismiss
   */
  async dismissReport(token, reportId) {
    return api.put(`/reports/${reportId}/dismiss`, {}, token);
  },

  /**
   * Cambiar el estado de moderación de un apunte (visible | hidden | blocked)
   * Backend endpoint: PUT /api/notes/:id/moderate-status
   */
  async moderateNote(token, noteId, moderationStatus, reason = '') {
    return api.put(
      `/notes/${noteId}/moderate-status`,
      { moderationStatus, reason },
      token
    );
  },

  /**
   * Eliminar/Ocultar una publicación o comentario en el foro por causa de moderación
   * Backend endpoint: DELETE /api/forum/posts/:id/moderate
   */
  async moderatePost(token, postId, reason = '') {
    return api.delete(`/forum/posts/${postId}/moderate`, {
      token,
      body: JSON.stringify({ reason }),
    });
  },

  /**
   * Aplicar restricción temporal a un usuario para participar en foros
   * Backend endpoint: PUT /api/users/:id/restrict
   */
  async restrictUser(token, userId, restrictedUntil, reason = '') {
    return api.put(
      `/users/${userId}/restrict`,
      { restrictedUntil, reason },
      token
    );
  },

  /**
   * Obtener el historial de logs de auditoría de moderación
   * Backend endpoint: GET /api/moderation/logs (o /api/admin/moderation-logs)
   */
  async getModerationLogs(token) {
    try {
      return await api.get('/moderation/logs', token);
    } catch {
      return await api.get('/admin/moderation-logs', token);
    }
  },
};

export default moderationService;
