import api from './api.js';

export const adminService = {
  async getUsers() {
    return api.get('/admin/users');
  },

  async toggleUserStatus(userId) {
    return api.patch(`/admin/users/${userId}/toggle`);
  },

  async changeUserRole(userId, role) {
    return api.patch(`/admin/users/${userId}/role`, { role });
  },

  async getReports(status = 'pending') {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return api.get(`/admin/reports${query}`);
  },

  async resolveReport(reportId, status) {
    return api.patch(`/admin/reports/${reportId}`, { status });
  },
};

export default adminService;
