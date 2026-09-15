
import { api } from './api';

export const forumService = {
  
  async getThreads(token, subjectId = '') {
    const query = subjectId ? `?subjectId=${subjectId}` : '';
    return await api.get(`/forum${query}`, token);
  },

  
   
  async getThreadDetails(token, threadId) {
    return await api.get(`/forum/${threadId}`, token);
  },

  
  async createThread(token, { title, body, subjectId }) {
    return await api.post('/forum', { title, body, subjectId }, token);
  },

  
  async addReply(token, threadId, body) {
    return await api.post(`/forum/${threadId}/reply`, { body }, token);
  },

  
  async voteReply(token, replyId, action = 'vote') {
    return await api.post(`/forum/replies/${replyId}/vote`, { action }, token);
  },

  async deleteReply(token, replyId) {
    return await api.delete(`/forum/replies/${replyId}`, token);
  },

  async deleteThread(token, threadId) {
    return await api.delete(`/forum/${threadId}`, token);
  },

  
  async reportContent(token, { targetType, targetId, reason }) {
    return await api.post('/forum/report', { targetType, targetId, reason }, token);
  },
};
