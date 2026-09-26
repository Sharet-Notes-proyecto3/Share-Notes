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
      alert(`Reporte marcado como: ${status}`);
      onRefresh?.();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDirectDelete = async (report) => {
    const typeLabel = (report.target_type || 'note').toLowerCase();
    const confirmed = window.confirm(
      `¿Deseas eliminar directamente este ${typeLabel === 'note' ? 'apunte' : typeLabel === 'thread' ? 'hilo' : 'comentario'} reportado?`
    );

    if (!confirmed) return;

    try {
      if (typeLabel === 'note') {
        await adminService.deleteNote(token, report.target_id);
      } else if (typeLabel === 'thread') {
        await adminService.deleteThread(token, report.target_id);
      } else {
        await adminService.deleteReply(token, report.target_id);
      }

      await adminService.resolveReport(token, report.id, 'dismissed');
      alert('Contenido eliminado y reporte cerrado.');
      onRefresh?.();
    } catch (err) {
      alert('Error al eliminar contenido reportado: ' + err.message);
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
                      background: r.status === 'pending' ? 'var(--color-warning-bg)' : 'var(--color-success-bg)',
                      border: `1px solid ${r.status === 'pending' ? 'var(--color-warning-border)' : 'var(--color-success-border)'}`,
                      color: r.status === 'pending' ? 'var(--color-warning-text)' : 'var(--color-success-text)',
                    }}
                  >
                    {r.status === 'pending' ? 'Pendiente' : 'Resuelto'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
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
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-success-border)',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: 'var(--color-success-bg)',
                        color: 'var(--color-success-text)',
                      }}
                    >
                      ✓ Resolver
                    </button>
                    <button
                      onClick={() => handleResolve(r.id, 'dismissed')}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      ✕ Descartar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
