export default function ReportsTable({ reports = [], onResolveReport }) {
  return (
    <div
      style={{
        background: 'var(--card-bg)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', background: 'rgba(255,255,255,0.05)' }}>
            <th style={{ padding: '16px' }}>Tipo</th>
            <th style={{ padding: '16px' }}>ID Objetivo</th>
            <th style={{ padding: '16px' }}>Motivo</th>
            <th style={{ padding: '16px' }}>Reportado por</th>
            <th style={{ padding: '16px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {reports.length === 0 && (
            <tr>
              <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No hay reportes pendientes.
              </td>
            </tr>
          )}

          {reports.map((report) => (
            <tr key={report.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '16px' }}>{(report.target_type || 'N/A').toUpperCase()}</td>
              <td style={{ padding: '16px' }}>{report.target_id}</td>
              <td style={{ padding: '16px', color: '#f87171' }}>{report.reason || 'Sin motivo especificado'}</td>
              <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{report.reporter_name || 'Desconocido'}</td>
              <td style={{ padding: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => onResolveReport?.(report.id, 'reviewed')}
                    style={{
                      background: '#22c55e',
                      border: 'none',
                      color: '#fff',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => onResolveReport?.(report.id, 'dismissed')}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    Descartar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
