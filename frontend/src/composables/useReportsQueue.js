// src/composables/useReportsQueue.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { moderationService } from '../services/moderationService';

export function useReportsQueue(autoPoll = true, pollIntervalMs = 30000) {
  const { token, isModerator } = useAuth();
  const [reports, setReports] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReports = useCallback(async () => {
    if (!token || !isModerator) {
      setReports([]);
      setPendingCount(0);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await moderationService.getReportsQueue(token, 'pending');
      const list = Array.isArray(data) ? data : data?.reports || data?.data || [];
      setReports(list);
      setPendingCount(list.length);
    } catch (err) {
      setError(err.message || 'Error al obtener cola de denuncias');
    } finally {
      setLoading(false);
    }
  }, [token, isModerator]);

  useEffect(() => {
    let timerId = null;

    if (token && isModerator) {
      fetchReports();

      if (autoPoll) {
        timerId = setInterval(() => {
          fetchReports();
        }, pollIntervalMs);
      }
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [token, isModerator, autoPoll, pollIntervalMs, fetchReports]);

  // Remover reporte optimísticamente de la lista sin recargar todo
  const removeReportOptimistically = useCallback((reportId) => {
    setReports((prev) => {
      const next = prev.filter((r) => r.id !== reportId);
      setPendingCount(next.length);
      return next;
    });
  }, []);

  return {
    reports,
    pendingCount,
    loading,
    error,
    refetch: fetchReports,
    removeReportOptimistically,
  };
}

export default useReportsQueue;
