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

  if (reports.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 20px', background: 'var(--sidebar-bg, #1e293b)', borderRadius: '12px', border: '1px dashed var(--border-color, #334155)' }}>
        <div style={{ fontSize: '36px', marginBottom: '8px' }}>🛡️</div>
        <h3 style={{ color: '#fff', margin: '0 0 4px' }}>Bandeja de reportes limpia</h3>
        <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '13px', margin: 0 }}>
          No hay reportes de contenido pendientes por revisar.
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--sidebar-bg, #1e293b)', borderRadius: '12px', border: '1px solid var(--border-color, #334155)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid var(--border-color, #334155)' }}>
              <th style={{ padding: '14px 16px', color: 'var(--text-secondary, #94a3b8)' }}>ID</th>
              <th style={{ padding: '14px 16px', color: 'var(--text-secondary, #94a3b8)' }}>Reportado Por</th>
              <th style={{ padding: '14px 16px', color: 'var(--text-secondary, #94a3b8)' }}>Motivo</th>
              <th style={{ padding: '14px 16px', color: 'var(--text-secondary, #94a3b8)' }}>Tipo Contenido</th>
              <th style={{ padding: '14px 16px', color: 'var(--text-secondary, #94a3b8)' }}>Estado</th>
              <th style={{ padding: '14px 16px', color: 'var(--text-secondary, #94a3b8)', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color, #334155)' }}>
                <td style={{ padding: '14px 16px', color: 'var(--text-secondary, #94a3b8)' }}>#{r.id}</td>
                <td style={{ padding: '14px 16px', fontWeight: '600', color: '#fff' }}>{r.reporter_name || 'Usuario'}</td>
                <td style={{ padding: '14px 16px', color: '#fca5a5' }}>{r.reason || 'Sin motivo especificado'}</td>
                <td style={{ padding: '14px 16px', color: 'var(--text-secondary, #94a3b8)' }}>
                  {(r.target_type || 'Apunte / Comentario').toUpperCase()} #{r.target_id}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: r.status === 'pending' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                      color: r.status === 'pending' ? '#fcd34d' : '#86efac',
                    }}
                  >
                    {r.status === 'pending' ? 'Pendiente' : 'Resuelto'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleResolve(r.id, 'resolved')}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: 'rgba(34, 197, 94, 0.15)',
                        color: '#86efac',
                      }}
                    >
                      ✓ Resolver
                    </button>
                    <button
                      onClick={() => handleResolve(r.id, 'dismissed')}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: 'var(--text-secondary, #94a3b8)',
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
