// src/components/teacher/VerifiedBadge.jsx

export default function VerifiedBadge() {
  return (
    <span
      style={{
        fontSize: '11px',
        padding: '3px 8px',
        borderRadius: '6px',
        background: 'rgba(16, 185, 129, 0.2)',
        border: '1px solid rgba(16, 185, 129, 0.4)',
        color: '#34d399',
        fontWeight: '700',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        boxShadow: '0 2px 6px rgba(16, 185, 129, 0.15)',
      }}
      title="Recurso oficial verificado por docente"
    >
      🎓 Recurso Verificado
    </span>
  );
}
