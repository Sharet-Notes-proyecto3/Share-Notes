// src/components/moderator/ReportActionButtons.jsx
import { useState } from 'react';

export function ReportActionButtons({ report, onResolve, onDismiss, disabled = false }) {
  const [confirmingAction, setConfirmingAction] = useState(null); // 'resolve' | 'dismiss' | null

  const handleConfirm = () => {
    if (confirmingAction === 'resolve') {
      onResolve(report.id);
    } else if (confirmingAction === 'dismiss') {
      onDismiss(report.id);
    }
    setConfirmingAction(null);
  };

  const handleCancel = () => {
    setConfirmingAction(null);
  };

  return (
    <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
      {confirmingAction ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--color-warning-bg)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--color-warning-border)' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-warning-text)' }}>
            ¿Confirmar {confirmingAction === 'resolve' ? 'Resolver' : 'Descartar'}?
          </span>
          <button
            onClick={handleConfirm}
            disabled={disabled}
            style={{
              padding: '2px 8px',
              fontSize: '12px',
              fontWeight: 'bold',
              color: 'var(--text-inverse)',
              backgroundColor: confirmingAction === 'resolve' ? 'var(--color-success)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
            }}
          >
            Sí
          </button>
          <button
            onClick={handleCancel}
            disabled={disabled}
            style={{
              padding: '2px 8px',
              fontSize: '12px',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: '3px',
              cursor: 'pointer',
            }}
          >
            No
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={() => setConfirmingAction('resolve')}
            disabled={disabled}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--text-inverse)',
              backgroundColor: 'var(--color-success)',
              border: 'none',
              borderRadius: '4px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
            }}
            title="Marcar denuncia como resuelta/atendida"
          >
            ✓ Resolver
          </button>
          <button
            onClick={() => setConfirmingAction('dismiss')}
            disabled={disabled}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
            }}
            title="Descartar denuncia sin aplicar sanción"
          >
            ✕ Descartar
          </button>
        </>
      )}
    </div>
  );
}

export default ReportActionButtons;
