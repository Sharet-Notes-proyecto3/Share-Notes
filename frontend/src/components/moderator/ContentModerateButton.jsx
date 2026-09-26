// src/components/moderator/ContentModerateButton.jsx
import { useState } from 'react';
import RoleGate from '../../directives/RoleGate';
import useModeration from '../../composables/useModeration';

export function ContentModerateButton({
  contentType = 'note', // 'note' | 'post'
  contentId,
  onSuccess,
}) {
  const { moderateNote, moderatePost, loading, error } = useModeration();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('hidden'); // 'hidden' | 'blocked' | 'delete'

  const handleModerate = async () => {
    if (!contentId) return;

    let res;
    if (contentType === 'note') {
      res = await moderateNote(contentId, selectedStatus, reason);
    } else {
      res = await moderatePost(contentId, reason);
    }

    if (res.success) {
      setIsOpen(false);
      setReason('');
      if (onSuccess) onSuccess(res.data);
    }
  };

  return (
    <RoleGate allow={['MODERATOR', 'FRONT_DESK_CS', 'ADMIN']}>
      <div style={{ display: 'inline-block', position: 'relative' }}>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            padding: '4px 10px',
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--color-warning-text)',
            backgroundColor: 'var(--color-warning-bg)',
            border: '1px solid var(--color-warning-border)',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
          title="Opciones de moderación"
        >
          🛡️ Moderar
        </button>

        {isOpen && (
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
                maxWidth: '440px',
                width: '90%',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              }}
            >
              <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: 'var(--text-primary)' }}>
                🛡️ Moderación de Contenido ({contentType === 'note' ? 'Apunte' : 'Publicación'})
              </h3>

              {error && (
                <div style={{ padding: '10px', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', border: '1px solid var(--color-danger-border)', borderRadius: '4px', fontSize: '13px', marginBottom: '12px' }}>
                  {error}
                </div>
              )}

              {contentType === 'note' ? (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    Acción sobre el estado:
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
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
                    <option value="hidden">🙈 Ocultar (No visible en búsquedas)</option>
                    <option value="blocked">🚫 Bloquear (Acceso restringido por completo)</option>
                    <option value="visible">👁️ Hacer Visible (Restablecer)</option>
                  </select>
                </div>
              ) : (
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  Se procederá a realizar la <strong>moderación/eliminación</strong> de esta publicación por infracción de normas.
                </p>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Motivo de la moderación (opcional):
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Contenido inapropiado o violación de derechos..."
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
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
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
                  type="button"
                  onClick={handleModerate}
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
                  {loading ? 'Aplicando...' : 'Confirmar Moderación'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGate>
  );
}

export default ContentModerateButton;
