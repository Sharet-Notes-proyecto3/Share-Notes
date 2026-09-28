// src/components/moderator/UserRestrictModal.jsx
import { useState } from 'react';
import useModeration from '../../composables/useModeration';

export function UserRestrictModal({ userId, userName = 'Usuario', isOpen, onClose, onSuccess }) {
  const { restrictUser, loading, error } = useModeration();
  const [durationDays, setDurationDays] = useState('7'); // '1', '3', '7', '30', 'custom'
  const [customDate, setCustomDate] = useState('');
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;

    let untilDate;
    if (durationDays === 'custom') {
      if (!customDate) {
        alert('Por favor selecciona una fecha límite válida.');
        return;
      }
      untilDate = new Date(customDate).toISOString();
    } else {
      const days = parseInt(durationDays, 10);
      const target = new Date();
      target.setDate(target.getDate() + days);
      untilDate = target.toISOString();
    }

    const res = await restrictUser(userId, untilDate, reason);
    if (res.success) {
      if (onSuccess) onSuccess(res.data);
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--modal-backdrop)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '460px',
          width: '90%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: 'var(--color-danger-text)' }}>
          🚫 Restringir Usuario Temporalmente
        </h3>

        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Aplicar suspensión temporal de participación en foros y comentarios para{' '}
          <strong>{userName}</strong> (ID #{userId}).
        </p>

        {error && (
          <div style={{ padding: '10px', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', border: '1px solid var(--color-danger-border)', borderRadius: '4px', fontSize: '13px', marginBottom: '12px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Duración de la restricción:
            </label>
            <select
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                fontSize: '14px',
              }}
            >
              <option value="1">1 día</option>
              <option value="3">3 días</option>
              <option value="7">7 días (1 semana)</option>
              <option value="30">30 días (1 mes)</option>
              <option value="custom">Fecha personalizada...</option>
            </select>
          </div>

          {durationDays === 'custom' && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Restringido hasta:
              </label>
              <input
                type="datetime-local"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: 'var(--text-secondary)' }}>
              Motivo de la sanción:
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explica el motivo de la restricción para el registro de auditoría..."
              rows={3}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 'bold',
                backgroundColor: 'var(--color-danger)',
                color: 'var(--text-inverse)',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Aplicando...' : 'Aplicar Restricción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserRestrictModal;
