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
  async toggleUserStatus(token, userId) {
    return await api.patch(`/admin/users/${userId}/toggle`, {}, token);
  },

  /**
   * Cambia el rol de un usuario ('student' | 'teacher' | 'moderator' | 'admin')
   */
  async changeUserRole(token, userId, role) {
    return await api.patch(`/admin/users/${userId}/role`, { role }, token);
  },

  /**
   * Obtiene la lista de reportes de contenido
   */
  async getReports(token, status = '') {
    const query = status ? `?status=${status}` : '';
    return await api.get(`/admin/reports${query}`, token);
  },

  /**
   * Resuelve o actualiza el estado de un reporte
   */
  async resolveReport(token, reportId, status = 'resolved') {
    return await api.patch(`/admin/reports/${reportId}`, { status }, token);
  },
};
