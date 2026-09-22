// src/services/teacher.service.js
import { api } from './api';

export const teacherService = {
  /**
   * Verificar apunte como recurso oficial del curso
   */
  async verifyNote(token, noteId) {
    return api.put(`/notes/${noteId}/verify`, {}, token);
  },

  /**
   * Marcar respuesta del foro como solución verificada por docente
   */
  async markSolution(token, answerId) {
    return api.put(`/forum/answers/${answerId}/mark-solution`, {}, token);
  },

  /**
   * Cerrar un hilo de discusión en el foro
   */
  async closeThread(token, postId) {
    return api.post(`/forum/posts/${postId}/close`, {}, token);
  },

  /**
   * Solicitar y descargar el reporte PDF del curso (vía MS-PDF)
   */
  async requestCourseReport(token, courseId) {
    const blob = await api.post('/reports/pdf/course', { subjectId: courseId }, { token });

    // Forzar descarga del archivo en el navegador
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-curso-${courseId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return blob;
  },

  /**
   * Obtener las materias asignadas al docente actual
   */
  async getTeacherCourses(token) {
    try {
      return await api.get('/teacher/courses', token);
    } catch {
      return await api.get('/notes/subjects', token);
    }
  },
};

export default teacherService;
