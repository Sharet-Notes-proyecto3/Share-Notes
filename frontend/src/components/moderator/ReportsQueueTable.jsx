// src/components/moderator/ReportsQueueTable.jsx
import ReportActionButtons from './ReportActionButtons';

export function ReportsQueueTable({
  reports = [],
  onResolve,
  onDismiss,
  loading = false,
  error = null,
  onOpenRestrictUser,
}) {
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('es-ES', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  const getTargetBadge = (type) => {
    const t = (type || '').toLowerCase();
    switch (t) {
      case 'note':
        return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', backgroundColor: '#DBEAFE', color: '#1E40AF' }}>📝 Apunte</span>;
      case 'post':
        return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', backgroundColor: '#FEF3C7', color: '#92400E' }}>💬 Publicación</span>;
      case 'answer':
        return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', backgroundColor: '#E0E7FF', color: '#3730A3' }}>💡 Respuesta</span>;
      default:
        return <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', backgroundColor: '#F3F4F6', color: '#374151' }}>{type || 'General'}</span>;
    }
  };

  if (loading && reports.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280' }}>
        ⏳ Cargando cola de denuncias pendientes...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '16px', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '6px', margin: '16px 0' }}>
        ⚠️ {error}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px dashed #D1D5DB' }}>
        <p style={{ fontSize: '16px', fontWeight: '600', color: '#374151', margin: 0 }}>🎉 ¡No hay denuncias pendientes!</p>
        <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>Todos los contenidos reportados han sido revisados.</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', backgroundColor: '#FFFFFF', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
        <thead>
          <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569' }}>
            <th style={{ padding: '12px 16px' }}>ID</th>
            <th style={{ padding: '12px 16px' }}>Tipo</th>
            <th style={{ padding: '12px 16px' }}>Motivo / Detalles</th>
            <th style={{ padding: '12px 16px' }}>Denunciante</th>
            <th style={{ padding: '12px 16px' }}>Fecha</th>
            <th style={{ padding: '12px 16px', textAlign: 'center' }}>Acciones de Moderación</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id} style={{ borderBottom: '1px solid #E2E8F0', transition: 'background-color 0.15s' }}>
              <td style={{ padding: '12px 16px', fontWeight: '600', color: '#64748B' }}>#{report.id}</td>
              <td style={{ padding: '12px 16px' }}>
                {getTargetBadge(report.target_type)}
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                  Target ID: {report.target_id}
                </div>
              </td>
              <td style={{ padding: '12px 16px', maxWidth: '300px' }}>
                <p style={{ margin: 0, fontWeight: '500', color: '#1E293B' }}>{report.reason || 'Sin motivo especificado'}</p>
                {report.content_preview && (
                  <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginTop: '2px', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    "{report.content_preview}"
                  </span>
                )}
              </td>
              <td style={{ padding: '12px 16px', color: '#334155' }}>
                {report.reported_by_name || report.reported_by_email || `Usuario #${report.reported_by || 'Desconocido'}`}
              </td>
              <td style={{ padding: '12px 16px', color: '#64748B', fontSize: '13px' }}>
                {formatDate(report.created_at)}
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                  <ReportActionButtons
                    report={report}
                    onResolve={onResolve}
                    onDismiss={onDismiss}
                    disabled={loading}
                  />

                  {/* Botón rápido para sancionar usuario reported_user_id si viene en la denuncia */}
                  {(report.reported_user_id || report.author_id) && onOpenRestrictUser && (
                    <button
                      onClick={() => onOpenRestrictUser(report.reported_user_id || report.author_id)}
                      style={{
                        padding: '2px 8px',
                        fontSize: '11px',
                        color: '#DC2626',
                        backgroundColor: '#FEE2E2',
                        border: '1px solid #FCA5A5',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginTop: '2px',
                      }}
                      title="Restringir usuario infractor"
                    >
                      🚫 Restringir Autor
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ReportsQueueTable;
