// =============================================================================
// MODIFICACIÓN 4 — COMPONENTE: TABLA DE MODERACIÓN Y REPORTES DE CONTENIDO
// Responsable: Integrante 4 (Administración & Moderación)
// =============================================================================

import { adminService } from '../../services/admin.service';
import { useAuth } from '../../context/AuthContext';

export default function ReportsTable({ reports = [], onRefresh, onResolveReport }) {
  const { token } = useAuth();

  const handleResolve = async (reportId, status) => {
    if (onResolveReport) {
      return onResolveReport(reportId, status);
    }
    try {
      await adminService.resolveReport(token, reportId, status);
      alert(`Reporte marcado como: ${status === 'resolved' ? 'Resuelto' : 'Descartado'}`);
      onRefresh?.();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDirectDelete = async (report) => {
    const typeLabel = (report.target_type || 'note').toLowerCase();
    const confirmed = window.confirm(
      `¿Deseas eliminar directamente este ${typeLabel === 'note' ? 'apunte' : typeLabel === 'thread' ? 'hilo' : 'comentario'} reportado?\n\nEsta acción eliminará el contenido y resolverá el reporte.`
    );

    if (!confirmed) return;

    let deleteFailedDueToNotFound = false;

    try {
      if (typeLabel === 'note') {
        await adminService.deleteNote(token, report.target_id);
      } else if (typeLabel === 'thread') {
        await adminService.deleteThread(token, report.target_id);
      } else {
        await adminService.deleteReply(token, report.target_id);
      }
    } catch (err) {
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('404') || msg.includes('no encontrado') || msg.includes('no existe')) {
        deleteFailedDueToNotFound = true;
      } else {
        alert('Error al eliminar contenido reportado: ' + err.message);
        return;
      }
    }

    try {
      await adminService.resolveReport(token, report.id, 'resolved');
      if (deleteFailedDueToNotFound) {
        alert('El contenido reportado ya no existía en el sistema. El reporte fue marcado como resuelto.');
      } else {
        alert('Contenido eliminado exitosamente y reporte marcado como resuelto.');
      }
      onRefresh?.();
    } catch (err) {
      alert('Error al actualizar el estado del reporte: ' + err.message);
    }
  };

  if (reports.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 20px', background: 'var(--card-bg)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
        <div style={{ fontSize: '36px', marginBottom: '8px' }}>🛡️</div>
        <h3 style={{ color: 'var(--text-primary)', margin: '0 0 4px' }}>Bandeja de reportes limpia</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
          No hay reportes de contenido pendientes por revisar.
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--card-shadow)' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>ID</th>
              <th style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>Reportado Por</th>
              <th style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>Motivo</th>
              <th style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>Tipo Contenido</th>
              <th style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>Estado</th>
              <th style={{ padding: '14px 16px', color: 'var(--text-secondary)', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>#{r.id}</td>
                <td style={{ padding: '14px 16px', fontWeight: '600', color: 'var(--text-primary)' }}>{r.reporter_name || 'Usuario'}</td>
                <td style={{ padding: '14px 16px', color: 'var(--color-danger-text)' }}>{r.reason || 'Sin motivo especificado'}</td>
                <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                  {(r.target_type || 'Apunte / Comentario').toUpperCase()} #{r.target_id}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background:
                        r.status === 'pending'
                          ? 'var(--color-warning-bg)'
                          : r.status === 'resolved'
                          ? 'var(--color-success-bg)'
                          : 'var(--bg-elevated)',
                      border: `1px solid ${
                        r.status === 'pending'
                          ? 'var(--color-warning-border)'
                          : r.status === 'resolved'
                          ? 'var(--color-success-border)'
                          : 'var(--border-color)'
                      }`,
                      color:
                        r.status === 'pending'
                          ? 'var(--color-warning-text)'
                          : r.status === 'resolved'
                          ? 'var(--color-success-text)'
                          : 'var(--text-secondary)',
                    }}
                  >
                    {r.status === 'pending'
                      ? 'Pendiente'
                      : r.status === 'resolved'
                      ? 'Resuelto'
                      : 'Descartado'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  {r.status !== 'pending' ? (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Atendido ({r.status === 'resolved' ? 'Resuelto' : 'Descartado'})
                    </span>
                  ) : (
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleDirectDelete(r)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--color-danger-border)',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: '600',
                          background: 'var(--color-danger-bg)',
                          color: 'var(--color-danger-text)',
                        }}
                      >
                        🗑️ Eliminar
                      </button>
                      <button
                        onClick={() => handleResolve(r.id, 'resolved')}
                        className="btn-outline"
                        style={{
                          padding: '5px 10px',
                          fontSize: '11px',
                          fontWeight: '600',
                        }}
                      >
                        ✓ Resolver
                      </button>
                      <button
                        onClick={() => handleResolve(r.id, 'dismissed')}
                        className="btn-outline"
                        style={{
                          padding: '5px 10px',
                          fontSize: '11px',
                          fontWeight: '600',
                        }}
                      >
                        ✕ Descartar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
