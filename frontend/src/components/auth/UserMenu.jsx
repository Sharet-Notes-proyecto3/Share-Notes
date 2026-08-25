// =============================================================================
// MODIFICACIÓN 1 — COMPONENTE: MENÚ DE PERFIL Y ESTADO DE SESIÓN
// Responsable: Integrante 1 (Autenticación & Perfil)
// =============================================================================

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const roleLabels = {
    admin: { label: 'Administrador', color: '#ef4444', icon: '👑' },
    moderator: { label: 'Moderador', color: '#f59e0b', icon: '🛡️' },
    teacher: { label: 'Docente', color: '#3b82f6', icon: '👨‍🏫' },
    student: { label: 'Estudiante', color: '#10b981', icon: '🎓' },
  };

  const currentRole = roleLabels[user.role] || roleLabels.student;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'var(--sidebar-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '24px',
          padding: '6px 14px',
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: currentRole.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', lineHeight: 1.2 }}>{user.name}</div>
          <div style={{ fontSize: '11px', color: currentRole.color }}>{currentRole.icon} {currentRole.label}</div>
        </div>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '42px',
            background: 'var(--sidebar-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            width: '220px',
            padding: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            zIndex: 100,
          }}
        >
          <div style={{ paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>{user.name}</p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>{user.email}</p>
            <span
              style={{
                display: 'inline-block',
                marginTop: '6px',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '11px',
                background: `${currentRole.color}22`,
                color: currentRole.color,
                fontWeight: '600',
              }}
            >
              {currentRole.label}
            </span>
          </div>

          <button
            onClick={logout}
            style={{
              width: '100%',
              marginTop: '10px',
              padding: '8px 12px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#f87171',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
}
