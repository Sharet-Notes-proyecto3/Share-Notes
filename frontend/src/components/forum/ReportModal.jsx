// =============================================================================
// MODIFICACIÓN 3 — COMPONENTE: MODAL DE REPORTES Y MODERACIÓN
// Responsable: Integrante 3 (Camila — Foro Académico, Respuestas y Reportes)
// =============================================================================

import { useState } from 'react';
import { forumService } from '../../services/forum.service';
import { useAuth } from '../../context/AuthContext';

export default function ReportModal({ item, onClose, onSuccess }) {
  const { token } = useAuth();
  const [reasonCategory, setReasonCategory] = useState('Spam');
  const [customDetail, setCustomDetail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const predefinedReasons = [
    'Spam',
    'Fuera de tema',
    'Lenguaje ofensivo',
    'Información engañosa',
    'Contenido inapropiado',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!item?.id || !item?.type) {
      setError('No se pudo identificar el contenido a reportar.');
      return;
    }

    const fullReason = customDetail.trim()
      ? `[${reasonCategory}] ${customDetail.trim()}`
      : reasonCategory;

    try {
      setLoading(true);
      setError('');
      await forumService.reportContent(token, {
        targetType: item.type, // 'thread' | 'reply' | 'note'
        targetId: item.id,
        reason: fullReason,
      });

      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1400);
    } catch (err) {
      setError(err.message || 'Error al enviar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const getTargetTitle = () => {
    if (item.type === 'thread') return `Debate: "${item.title || 'Tema'}"`;
    if (item.type === 'reply') return `Respuesta de ${item.author || 'Usuario'}`;
    return `Contenido #${item.id}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'var(--sidebar-bg, #1e1e2d)',
          border: '1px solid var(--border-color, #2b2b3d)',
          borderRadius: '16px',
          padding: '28px',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
        }}
      >
        {/* Encabezado */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h3 style={{ margin: 0, color: '#f87171', fontSize: '19px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🚩 Reportar Contenido Indebido
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Detalle del objetivo */}
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '18px',
            fontSize: '13px',
            color: '#fca5a5',
          }}
        >
          <strong>Objetivo:</strong> {getTargetTitle()}
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '24px 10px' }}>
            <div style={{ fontSize: '42px', marginBottom: '8px' }}>✅</div>
            <h4 style={{ color: '#fff', margin: '0 0 6px', fontSize: '18px' }}>Reporte enviado con éxito</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
              Gracias por colaborar en la moderación del Foro Académico.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {error && (
              <div style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>
                ⚠️ {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Motivo principal *
              </label>
              <select
                className="form-input"
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                required
              >
                {predefinedReasons.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Detalles adicionales (opcional)
              </label>
              <textarea
                placeholder="Indica más detalles para ayudar a los moderadores..."
                className="form-input"
                rows="3"
                value={customDetail}
                onChange={(e) => setCustomDetail(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 2,
                  padding: '10px',
                  background: '#ef4444',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Enviando report POST /api/forum/report...' : '🚨 Enviar Reporte'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
