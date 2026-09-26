// src/components/teacher/VerifiedBadge.jsx

export default function VerifiedBadge() {
  return (
    <span
      style={{
        fontSize: '11px',
        padding: '3px 8px',
        borderRadius: '6px',
        background: 'var(--color-success-bg)',
        border: '1px solid var(--color-success-border)',
        color: 'var(--color-success-text)',
        fontWeight: '700',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      }}
      title="Recurso oficial verificado por docente"
    >
      🎓 Recurso Verificado
    </span>
  );
}
