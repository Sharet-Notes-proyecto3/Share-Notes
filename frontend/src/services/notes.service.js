// =============================================================================
// MODIFICACIÓN 2 — SERVICIO DE APUNTES, MULTIMEDIA Y REPORTES PDF
// Responsable: Integrante 2 (Apuntes, QR y Microservicio MS-PDF)
// =============================================================================

import { api, API_BASE_URL } from './api';

export const notesService = {
  /**
   * Obtiene la lista de apuntes con filtros opcionales de materia y búsqueda
   */
  async getNotes(token, subjectId = '', search = '', semester = '', careerId = '') {
    const params = new URLSearchParams();
    if (subjectId) params.append('subjectId', subjectId);
    if (search) params.append('search', search);
    if (semester) params.append('semester', semester);
    if (careerId) params.append('careerId', careerId);
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
  async uploadNote(token, { title, description, subjectId, careerId, semester, file }) {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description || '');
    formData.append('subjectId', subjectId);
    if (careerId) formData.append('careerId', careerId);
    if (semester) formData.append('semester', semester);
    formData.append('file', file);

    return await api.post('/notes', formData, token, true);
  },

  /**
   * Obtiene el archivo binario (Blob) protegido con JWT para el visor in-app
   */
  async getNoteBlob(token, noteId) {
    return await api.get(`/notes/${noteId}/download`, token);
  },

  /**
   * Elimina un apunte (solo el autor o un administrador)
   */
  async deleteNote(token, noteId) {
    return await api.delete(`/notes/${noteId}`, token);
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
   * Obtiene el código QR de un apunte específico que apunta a la descarga
   */
  async getNoteQR(token, noteId) {
    try {
      const res = await api.get(`/notes/${noteId}/qr`, token);
      if (res && (res.qrCodeDataUrl || res.qr)) return res;
    } catch {
      // Fallback a generador dinámico si la ruta backend es vía endpoint
    }
    const downloadUrl = `${API_BASE_URL}/notes/${noteId}/download`;
    const qrCodeDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(downloadUrl)}`;
    return { qrCodeDataUrl, downloadUrl };
  },
};
