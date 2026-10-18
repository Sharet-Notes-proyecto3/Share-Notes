// src/components/auth/PreferencesModal.jsx
// Ventana de Preferencias del usuario: correos y pantalla de inicio.

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { preferencesService, optionsForRole } from '../../services/preferences.service';

export default function PreferencesModal({ onClose }) {
  const { token, user, userRole } = useAuth();

  const startOptions = optionsForRole(userRole);

  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailLoaded, setEmailLoaded] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(true);
  const [startTab, setStartTab] = useState(() => preferencesService.getStartTab(user?.id, userRole));

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'ok' | 'error', text }

  // Cargar la preferencia de correo guardada en la base de datos
  useEffect(() => {
    if (!token) return;
    let isActive = true;
    preferencesService
      .getEmailPreference(token)
      .then((enabled) => {
        if (!isActive) return;
        setEmailEnabled(enabled);
        setEmailLoaded(true);
      })
      .catch(() => {
        if (!isActive) return;
        setEmailLoaded(false);
        setMessage({
          type: 'error',
          text: 'No pudimos cargar tu preferencia de correo. Puedes cambiar la pantalla de inicio de todas formas.',
        });
      })
      .finally(() => {
        if (isActive) setLoadingEmail(false);
      });
    return () => {
      isActive = false;
    };
  }, [token]);

  // Cerrar con la tecla Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      if (emailLoaded) {
        await preferencesService.saveEmailPreference(token, emailEnabled);
      }
      preferencesService.setStartTab(user?.id, startTab);
      setMessage({ type: 'ok', text: 'Preferencias guardadas.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err?.message || 'No se pudieron guardar las preferencias. Intenta de nuevo.',
      });
    } finally {
      setSaving(false);
    }
  };

  const sectionTitle = {
    margin: '0 0 4px',
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  };
  const sectionText = {
    margin: '0 0 14px',
    fontSize: '13px',
    lineHeight: 1.5,
    color: 'var(--text-secondary)',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'var(--modal-backdrop)',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="preferences-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          background: 'var(--card-bg)',
          border: '1px solid var(--border-strong)',
          borderRadius: '14px',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 id="preferences-title" style={{ margin: 0, fontSize: '20px', color: 'var(--text-primary)' }}>
            Preferencias
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar preferencias"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '18px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Notificaciones por correo ── */}
        <section style={{ marginBottom: '24px' }}>
          <h3 style={sectionTitle}>Notificaciones por correo</h3>
          <p style={sectionText}>
            Elige si quieres recibir los avisos por correo que envía ShareNotes cuando se publica contenido nuevo.
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              padding: '12px 14px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
            }}
          >
            <span id="email-switch-label" style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
              {loadingEmail ? 'Cargando...' : emailEnabled ? 'Recibir correos' : 'No recibir correos'}
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={emailEnabled}
              aria-labelledby="email-switch-label"
              disabled={loadingEmail || !emailLoaded}
              onClick={() => setEmailEnabled((v) => !v)}
              style={{
                position: 'relative',
                flex: 'none',
                width: '44px',
                height: '24px',
                padding: 0,
                borderRadius: '999px',
                border: '1px solid var(--border-strong)',
                background: emailEnabled ? 'var(--primary-color)' : 'var(--bg-surface)',
                cursor: loadingEmail || !emailLoaded ? 'not-allowed' : 'pointer',
                opacity: loadingEmail || !emailLoaded ? 0.5 : 1,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: emailEnabled ? '22px' : '2px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  transition: 'left 0.15s ease',
                }}
              />
            </button>
          </div>
        </section>

        {/* ── Pantalla de inicio ── */}
        <section style={{ marginBottom: '24px' }}>
          <h3 style={sectionTitle}>Pantalla de inicio</h3>
          <p style={sectionText}>Elige qué sección se abre cuando inicias sesión.</p>

          <div role="radiogroup" aria-label="Pantalla de inicio" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {startOptions.map((opt) => {
              const selected = startTab === opt.id;
              return (
                <label
                  key={opt.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: selected ? 'var(--primary-bg)' : 'var(--bg-elevated)',
                    border: `1px solid ${selected ? 'var(--primary-border)' : 'var(--border-color)'}`,
                  }}
                >
                  <input
                    type="radio"
                    name="start-tab"
                    value={opt.id}
                    checked={selected}
                    onChange={() => setStartTab(opt.id)}
                  />
                  <span>
                    <span style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {opt.label}
                    </span>
                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>{opt.hint}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        {message && (
          <div
            role="status"
            style={{
              marginBottom: '16px',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              background: message.type === 'ok' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
              border: `1px solid ${message.type === 'ok' ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`,
              color: message.type === 'ok' ? 'var(--color-success-text)' : 'var(--color-danger-text)',
            }}
          >
            {message.text}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: '1px solid var(--border-strong)',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cerrar
          </button>
          <button type="button" className="primary-btn" onClick={handleSave} disabled={saving || loadingEmail}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}