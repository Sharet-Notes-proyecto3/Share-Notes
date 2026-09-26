// =============================================================================
// MODIFICACIÓN 1 — COMPONENTE: MODAL DE PERFIL DE ESTUDIANTE
// Responsable: Integrante 1 (Anna — Autenticación, Sesión y Perfil)
// Nuevas funciones: editar nombre + foto de perfil personalizada
// =============================================================================

import { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

// Nombre de la institución que aparece en la tarjeta del estudiante.
const INSTITUTION_NAME = 'Institución Universitaria del Putumayo';

// Claves localStorage por usuario
const getPhotoKey = (userId) => `sharenotes-avatar-${userId}`;
const getNameKey  = (userId) => `sharenotes-name-${userId}`;

export default function ProfileModal({ onClose }) {
  const { user, isAdmin, isModerator, isTeacher } = useAuth();
  if (!user) return null;
  return (
    <ProfileModalInner
      user={user}
      isAdmin={isAdmin}
      isModerator={isModerator}
      isTeacher={isTeacher}
      onClose={onClose}
    />
  );
}

function ProfileModalInner({ user, isAdmin, isModerator, isTeacher, onClose }) {
  // ── Nombre editable ────────────────────────────────────────────────────────
  const savedName = localStorage.getItem(getNameKey(user.id)) || user.name || '';
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(savedName);
  const [draftName,   setDraftName]   = useState(savedName);
  const [nameSaved,   setNameSaved]   = useState(false);

  // ── Foto de perfil ────────────────────────────────────────────────────────
  const [avatar, setAvatar] = useState(
    () => localStorage.getItem(getPhotoKey(user.id)) || null
  );
  const fileInputRef = useRef(null);

  // ─────────────────────────────────────────────────────────────────────────
  const getRoleName = () => {
    if (isAdmin) return 'Administrador';
    if (isModerator) return 'Moderador';
    if (isTeacher) return 'Docente';
    return 'Estudiante';
  };

  const getInitials = () => {
    const name  = displayName || user.email || 'U';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const isAccountActive = user.is_active !== false && user.is_active !== 0;

  const formatJoinDate = () => {
    if (!user.created_at) return null;
    try {
      return new Date(user.created_at).toLocaleDateString('es-CO', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch { return null; }
  };

  const joinDate = formatJoinDate();

  // ── Guardar nombre ────────────────────────────────────────────────────────
  const handleSaveName = () => {
    const trimmed = draftName.trim();
    if (!trimmed) return;
    setDisplayName(trimmed);
    localStorage.setItem(getNameKey(user.id), trimmed);
    setEditingName(false);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  };

  const handleCancelName = () => {
    setDraftName(displayName);
    setEditingName(false);
  };

  // ── Foto de perfil ────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setAvatar(dataUrl);
      localStorage.setItem(getPhotoKey(user.id), dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatar(null);
    localStorage.removeItem(getPhotoKey(user.id));
  };

  // ── Campos del perfil ─────────────────────────────────────────────────────
  const fields = [
    { label: 'Correo electrónico', value: user.email || '—',   icon: '@' },
    { label: 'ID de estudiante',   value: user.id != null ? `#${user.id}` : '—', icon: '#' },
    { label: 'Rol académico',      value: getRoleName(),         icon: '◆' },
    { label: 'Institución',        value: INSTITUTION_NAME,      icon: '🏛' },
  ];

  const cardStyle = {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '10px 12px', borderRadius: '10px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-color)',
  };

  const iconStyle = {
    width: '30px', height: '30px', borderRadius: '8px',
    background: 'var(--primary-bg)', color: 'var(--primary-color)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', flexShrink: 0,
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'var(--modal-backdrop)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1100, padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '18px', padding: '0',
          maxWidth: '430px', width: '100%',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {/* ── Encabezado ─────────────────────────────────────────────────── */}
        <div
          style={{
            padding: '28px 24px 20px',
            background: 'linear-gradient(135deg, var(--primary-bg), var(--secondary-bg))',
            borderBottom: '1px solid var(--border-color)',
            position: 'relative',
          }}
        >
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            aria-label="Cerrar perfil"
            style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'transparent', border: '1px solid var(--border-color)',
              borderRadius: '8px', width: '28px', height: '28px',
              color: 'var(--text-secondary)', fontSize: '15px', cursor: 'pointer',
            }}
          >✕</button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* ── Avatar con botón de cámara ─────────────────────────────── */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div
                style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: '700', fontSize: '20px', color: 'var(--primary-contrast)',
                  overflow: 'hidden',
                  boxShadow: '0 0 0 3px var(--primary-border)',
                }}
              >
                {avatar
                  ? <img src={avatar} alt="Foto de perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : getInitials()
                }
              </div>

              {/* Botón cámara */}
              <button
                onClick={() => fileInputRef.current?.click()}
                aria-label="Cambiar foto de perfil"
                title="Cambiar foto de perfil"
                style={{
                  position: 'absolute', bottom: '-2px', right: '-4px',
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: 'var(--primary-color)',
                  border: '2px solid var(--card-bg)',
                  color: 'var(--text-inverse)', fontSize: '10px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >📷</button>

              {/* Input file oculto */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                id="profile-photo-input"
              />
            </div>

            {/* ── Nombre + rol ──────────────────────────────────────────── */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {editingName ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <input
                    autoFocus
                    value={draftName}
                    onChange={e => setDraftName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter')  handleSaveName();
                      if (e.key === 'Escape') handleCancelName();
                    }}
                    maxLength={60}
                    placeholder="Tu nombre..."
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px', padding: '5px 10px',
                      color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600',
                      outline: 'none', width: '100%',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={handleSaveName}
                      style={{
                        flex: 1, padding: '4px 0', borderRadius: '6px',
                        background: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)',
                        color: 'var(--color-success-text)', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                      }}
                    >✓ Guardar</button>
                    <button
                      onClick={handleCancelName}
                      style={{
                        flex: 1, padding: '4px 0', borderRadius: '6px',
                        background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)',
                        color: 'var(--color-danger-text)', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                      }}
                    >✕ Cancelar</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '17px', fontWeight: '700' }}>
                    {displayName || 'Usuario'}
                  </h3>
                  <button
                    onClick={() => { setDraftName(displayName); setEditingName(true); }}
                    aria-label="Editar nombre"
                    title="Editar nombre"
                    style={{
                      background: 'transparent', border: '1px solid var(--border-color)',
                      borderRadius: '5px', padding: '2px 7px',
                      color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >✏️</button>
                  {nameSaved && (
                    <span style={{ fontSize: '11px', color: 'var(--color-success-text)' }}>✓ Guardado</span>
                  )}
                </div>
              )}
              <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                {getRoleName()}
              </p>
            </div>
          </div>

          {/* Badge cuenta activa */}
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              marginTop: '14px', padding: '4px 10px', borderRadius: '999px',
              fontSize: '11px', fontWeight: '600',
              background: isAccountActive ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
              color:      isAccountActive ? 'var(--color-success-text)' : 'var(--color-danger-text)',
              border: `1px solid ${isAccountActive ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`,
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isAccountActive ? 'var(--color-success)' : 'var(--color-danger)' }} />
            {isAccountActive ? 'Cuenta activa' : 'Cuenta suspendida'}
          </div>
        </div>

        {/* ── Cuerpo ─────────────────────────────────────────────────────── */}
        <div style={{ padding: '20px 24px 24px' }}>

          {/* Campo nombre completo */}
          <div style={{ ...cardStyle, marginBottom: '10px', border: '1px solid var(--border-color)' }}>
            <span style={iconStyle}>◉</span>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Nombre completo</div>
              <div style={{ fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName || '—'}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>
                  (toca ✏️ para editar)
                </span>
              </div>
            </div>
          </div>

          {/* Resto de campos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {fields.map((field) => (
              <div key={field.label} style={cardStyle}>
                <span style={iconStyle}>{field.icon}</span>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{field.label}</div>
                  <div style={{ fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {field.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Acciones de foto */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                flex: 1, padding: '8px 0', borderRadius: '8px',
                background: 'var(--primary-bg)',
                border: '1px solid var(--primary-border)',
                color: 'var(--primary-color)', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              📷 {avatar ? 'Cambiar foto' : 'Subir foto de perfil'}
            </button>
            {avatar && (
              <button
                onClick={handleRemovePhoto}
                style={{
                  padding: '8px 14px', borderRadius: '8px',
                  background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)',
                  color: 'var(--color-danger-text)', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >🗑 Quitar</button>
            )}
          </div>

          {joinDate && (
            <p style={{ margin: '14px 0 0', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
              Miembro desde {joinDate}
            </p>
          )}

          <button
            onClick={onClose}
            style={{
              width: '100%', marginTop: '16px', padding: '11px',
              background: 'var(--primary-color)',
              border: 'none', borderRadius: '10px',
              color: 'var(--text-inverse)', fontWeight: '600', fontSize: '13.5px', cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
