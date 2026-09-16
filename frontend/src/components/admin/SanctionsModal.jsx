import { useState } from 'react';
import { adminService } from '../../services/admin.service';
import { useAuth } from '../../context/AuthContext';

export default function SanctionsModal({ user, onClose, onSanctionAdded }) {
  const { token } = useAuth();
  const [type, setType] = useState('warning');
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user || !reason.trim()) {
      alert('Debes indicar un motivo para la sanción.');
      return;
    }

    try {
      setLoading(true);
      await adminService.applySanction(token, {
        userId: user.id,
        type,
        reason: reason.trim(),
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      });

      if (onSanctionAdded) onSanctionAdded();
      else onClose?.();
    } catch (err) {
      alert(err.message || 'No se pudo aplicar la sanción.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '16px',
          padding: '24px',
          color: '#fff',
          boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Moderación
            </div>
            <h3 style={{ margin: '6px 0 0', fontSize: '22px' }}>Aplicar sanción</h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid #334155',
              color: '#cbd5e1',
              borderRadius: '8px',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginBottom: '18px', color: '#cbd5e1' }}>
          <strong>{user?.name}</strong> · {user?.email}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '13px' }}>Tipo de sanción</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #334155',
                background: '#111827',
                color: '#fff',
              }}
            >
              <option value="warning">⚠️ Advertencia</option>
              <option value="temp_ban">⏳ Suspensión temporal</option>
              <option value="perm_ban">🚫 Expulsión permanente</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '13px' }}>Motivo</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Describe la conducta o motivo de la sanción..."
              style={{
                width: '100%',
                resize: 'vertical',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #334155',
                background: '#111827',
                color: '#fff',
              }}
            />
          </div>

          {type === 'temp_ban' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '13px' }}>Fecha de expiración</label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  background: '#111827',
                  color: '#fff',
                }}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid #334155',
                color: '#cbd5e1',
                borderRadius: '10px',
                padding: '10px 16px',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                border: 'none',
                color: '#fff',
                borderRadius: '10px',
                padding: '10px 16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Guardando...' : 'Guardar sanción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
