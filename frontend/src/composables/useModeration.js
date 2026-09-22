// src/composables/useModeration.js
import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { moderationService } from '../services/moderationService';

export function useModeration() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAction = useCallback(
    async (actionFn) => {
      setLoading(true);
      setError(null);
      try {
        const result = await actionFn(token);
        return { success: true, data: result };
      } catch (err) {
        const msg = err.message || 'Error al ejecutar la acción de moderación';
        const is403 = msg.includes('403') || msg.toLowerCase().includes('forbidden') || msg.toLowerCase().includes('no autorizado');
        const formattedError = is403
          ? '403 Prohibido: No tienes permisos suficientes para realizar esta acción de moderación.'
          : msg;
        
        setError(formattedError);
        return { success: false, error: formattedError };
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const resolveReport = useCallback(
    (reportId) => handleAction((t) => moderationService.resolveReport(t, reportId)),
    [handleAction]
  );

  const dismissReport = useCallback(
    (reportId) => handleAction((t) => moderationService.dismissReport(t, reportId)),
    [handleAction]
  );

  const moderateNote = useCallback(
    (noteId, status, reason) =>
      handleAction((t) => moderationService.moderateNote(t, noteId, status, reason)),
    [handleAction]
  );

  const moderatePost = useCallback(
    (postId, reason) =>
      handleAction((t) => moderationService.moderatePost(t, postId, reason)),
    [handleAction]
  );

  const restrictUser = useCallback(
    (userId, until, reason) =>
      handleAction((t) => moderationService.restrictUser(t, userId, until, reason)),
    [handleAction]
  );

  const getModerationLogs = useCallback(
    () => handleAction((t) => moderationService.getModerationLogs(t)),
    [handleAction]
  );

  return {
    loading,
    error,
    setError,
    resolveReport,
    dismissReport,
    moderateNote,
    moderatePost,
    restrictUser,
    getModerationLogs,
  };
}

export default useModeration;
