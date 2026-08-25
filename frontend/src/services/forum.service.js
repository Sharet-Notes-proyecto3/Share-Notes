// =============================================================================
// MODIFICACIÓN 3 — SERVICIO DEL FORO Y COMUNIDAD
// Responsable: Integrante 3 (Foro, Hilos, Respuestas y Votaciones)
// =============================================================================

import { api } from './api';

export const forumService = {
  /**
   * Obtiene la lista de hilos de discusión (filtrables por materia)
   */
  async getThreads(token, subjectId = '') {
    const query = subjectId ? `?subjectId=${subjectId}` : '';
    return await api.get(`/forum/threads${query}`, token);
  },

  /**
   * Obtiene un hilo específico con todas sus respuestas asociadas
   */
  async getThreadDetails(token, threadId) {
    return await api.get(`/forum/threads/${threadId}`, token);
  },

  /**
   * Crea un nuevo hilo de discusión en una materia
   */
  async createThread(token, { title, body, subjectId }) {
    return await api.post('/forum/threads', { title, body, subjectId }, token);
  },

  /**
   * Agrega una respuesta a un hilo de discusión
   */
  async addReply(token, threadId, content) {
    return await api.post(`/forum/threads/${threadId}/replies`, { content }, token);
  },

  /**
   * Emite un voto útil a una respuesta
   */
  async voteReply(token, replyId) {
    return await api.post(`/forum/replies/${replyId}/vote`, {}, token);
  },
};
