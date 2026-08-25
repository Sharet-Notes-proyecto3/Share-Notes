
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

  
  async voteReply(token, replyId) {
    return await api.post(`/forum/replies/${replyId}/vote`, {}, token);
  },

  
  async reportContent(token, { targetType, targetId, reason }) {
    return await api.post('/forum/report', { targetType, targetId, reason }, token);
  },
};
