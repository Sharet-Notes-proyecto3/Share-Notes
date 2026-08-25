// =============================================================================
// MODIFICACIÓN 2 — SERVICIO DE APUNTES, MULTIMEDIA Y REPORTES PDF
// Responsable: Integrante 2 (Apuntes, QR y Microservicio MS-PDF)
// =============================================================================

import { api } from './api';

export const notesService = {
  /**
   * Obtiene la lista de apuntes con filtros opcionales de materia y búsqueda
   */
  async getNotes(token, subjectId = '', search = '') {
    const params = new URLSearchParams();
    if (subjectId) params.append('subjectId', subjectId);
    if (search) params.append('search', search);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return await api.get(`/notes${queryString}`, token);
  },

  /**
   * Obtiene la lista de materias disponibles
   */
  async getSubjects(token) {
    return await api.get('/notes/subjects', token);
  },

  /**
   * Sube un nuevo apunte con archivo adjunto (PDF / JPG / PNG)
   */
  async uploadNote(token, { title, description, subjectId, file }) {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description || '');
    formData.append('subjectId', subjectId);
    formData.append('file', file);

    return await api.post('/notes', formData, token, true);
  },

  /**
   * Genera y descarga el reporte PDF consolidado (vía Microservicio MS-PDF)
   */
  async downloadNotesReport(token) {
    const blob = await api.get('/notes/report', token);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Apuntes_ShareNotes_${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Obtiene el código QR de un apunte específico
   */
  async getNoteQR(token, noteId) {
    return await api.get(`/notes/${noteId}/qr`, token);
  },
};
