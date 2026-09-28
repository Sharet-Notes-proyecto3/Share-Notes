// src/components/moderator/ModerationLogsTable.jsx
import { useState, useEffect, useCallback } from 'react';
import useModeration from '../../composables/useModeration';

export function ModerationLogsTable() {
  const { getModerationLogs, loading, error } = useModeration();
  const [logs, setLogs] = useState([]);

  const fetchLogs = useCallback(async () => {
    const res = await getModerationLogs();
    if (res.success) {
      const data = res.data;
      const list = Array.isArray(data) ? data : data?.logs || data?.data || [];
      setLogs(list);
    }
  }, [getModerationLogs]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('es-ES', {
        dateStyle: 'short',
        timeStyle: 'medium',
      });
    } catch {
      return dateStr;
    }
  };

  const getActionBadge = (action) => {
    const act = (action || '').toUpperCase();
    if (act.includes('RESOLV')) {
      return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success-text)' }}>✓ {action}</span>;
    }
    if (act.includes('DISMISS')) {
      return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>✕ {action}</span>;
    }
    if (act.includes('RESTRICT') || act.includes('BLOCK') || act.includes('DELETE')) {
      return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger-text)' }}>🚫 {action}</span>;
    }
    return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning-text)' }}>ℹ️ {action}</span>;
  };

  if (loading && logs.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        ⏳ Cargando historial de moderación...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '16px', backgroundColor: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', color: 'var(--color-danger-text)', borderRadius: '6px', margin: '16px 0' }}>
        ⚠️ {error}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>📋 Audit Logs de Moderación</h3>
        <button
          onClick={fetchLogs}
          disabled={loading}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 'bold',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          🔄 Actualizar
        </button>
      </div>

      {logs.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>No hay registros de moderación registrados aún.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', backgroundColor: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '10px 14px' }}>ID</th>
                <th style={{ padding: '10px 14px' }}>Acción</th>
                <th style={{ padding: '10px 14px' }}>Moderador</th>
                <th style={{ padding: '10px 14px' }}>Usuario / Recurso Afectado</th>
                <th style={{ padding: '10px 14px' }}>Motivo / Detalle</th>
                <th style={{ padding: '10px 14px' }}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 'bold' }}>#{log.id}</td>
                  <td style={{ padding: '10px 14px' }}>{getActionBadge(log.action || log.event)}</td>
                  <td style={{ padding: '10px 14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                    {log.moderator_name || log.admin_name || `Moderador #${log.admin_id || log.moderator_id || 'N/A'}`}
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                    {log.target_user_name || log.target_resource || `ID: ${log.target_id || log.user_id || 'N/A'}`}
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', maxWidth: '250px' }}>
                    {log.reason || log.details || 'Sin motivo indicado'}
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '12px' }}>
                    {formatDate(log.created_at || log.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ModerationLogsTable;
