// =============================================================================
// MODIFICACIÓN 4 — SERVICIO DE ADMINISTRACIÓN Y MODERACIÓN
// Responsable: Integrante 4 (Panel de Control, Roles y Reportes)
// =============================================================================

import { api } from './api';

export const adminService = {
  /**
   * Obtiene la lista completa de usuarios registrados
   */
  async getUsers(token) {
    return await api.get('/admin/users', token);
  },

  /**
   * Suspende o reactiva un usuario por su ID
   */
  async toggleUserStatus(tokenOrUserId, maybeUserId) {
    const userId = maybeUserId !== undefined ? maybeUserId : tokenOrUserId;
    const token = maybeUserId !== undefined ? tokenOrUserId : undefined;
    return await api.patch(`/admin/users/${userId}/toggle`, {}, token);
  },

  /**
   * Cambia el rol de un usuario ('student' | 'teacher' | 'moderator' | 'admin')
   */
  async changeUserRole(tokenOrUserId, roleOrUserId, maybeRole) {
    let token, userId, role;
    if (maybeRole !== undefined) {
      token = tokenOrUserId;
      userId = roleOrUserId;
      role = maybeRole;
    } else {
      userId = tokenOrUserId;
      role = roleOrUserId;
    }
    return await api.patch(`/admin/users/${userId}/role`, { role }, token);
  },

  /**
   * Obtiene la lista de reportes de contenido
   */
  async getReports(tokenOrStatus = '', maybeStatus) {
    let token, status;
    if (maybeStatus !== undefined) {
      token = tokenOrStatus;
      status = maybeStatus;
    } else {
      status = typeof tokenOrStatus === 'string' && !tokenOrStatus.startsWith('ey') ? tokenOrStatus : '';
      token = typeof tokenOrStatus === 'string' && tokenOrStatus.startsWith('ey') ? tokenOrStatus : undefined;
    }
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return await api.get(`/admin/reports${query}`, token);
  },

  /**
   * Resuelve o actualiza el estado de un reporte
   */
  async resolveReport(tokenOrReportId, statusOrReportId = 'resolved', maybeStatus) {
    let token, reportId, status;
    if (maybeStatus !== undefined) {
      token = tokenOrReportId;
      reportId = statusOrReportId;
      status = maybeStatus;
    } else {
      reportId = tokenOrReportId;
      status = statusOrReportId;
    }
    return await api.patch(`/admin/reports/${reportId}`, { status }, token);
  },

  /**
   * Elimina un apunte reportado por administración
   */
  async deleteNote(token, noteId) {
    return await api.delete(`/admin/notes/${noteId}`, token);
  },

  /**
   * Elimina un hilo del foro reportado por administración
   */
  async deleteThread(token, threadId) {
    return await api.delete(`/admin/threads/${threadId}`, token);
  },

  /**
   * Elimina una respuesta del foro reportada por administración
   */
  async deleteReply(token, replyId) {
    return await api.delete(`/admin/replies/${replyId}`, token);
  },

  /**
   * Aplica una sanción formal a un usuario (warning, temp_ban, perm_ban)
   */
  async applySanction(token, { userId, type, reason, expiresAt }) {
    return await api.post('/admin/sanctions', { userId, type, reason, expiresAt }, token);
  },

  /**
   * Lista el historial de sanciones por usuario o globalmente
   */
  async getSanctions(token, userId) {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return await api.get(`/admin/sanctions${query}`, token);
  },

  /**
   * Consulta el estado en vivo de los microservicios de la plataforma
   */
  async getMicroservicesStatus(token) {
    return await api.get('/notes/microservices/status', token);
  },
};

export default adminService;
