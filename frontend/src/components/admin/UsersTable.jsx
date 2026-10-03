// =============================================================================
// MODIFICACIÓN 4 — COMPONENTE: TABLA DE GESTIÓN DE USUARIOS Y ROLES (RBAC)
// Responsable: Integrante 4 (Administración & Control de Acceso)
// =============================================================================

import { useState, useEffect, useMemo, useRef } from 'react';
import { adminService } from '../../services/admin.service';
import { useAuth } from '../../context/AuthContext';

export default function UsersTable({ users = [], onRefresh, onToggleUser, onChangeRole, onOpenSanction }) {
  const { token, user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenuUserId, setActiveMenuUserId] = useState(null);
  const menuContainerRef = useRef(null);

  // Cerrar menú de 3 puntos al hacer clic fuera
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target)) {
        setActiveMenuUserId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term)) ||
        (u.role && u.role.toLowerCase().includes(term))
    );
  }, [users, searchTerm]);

  const handleToggle = async (userId) => {
    setActiveMenuUserId(null);
    if (onToggleUser) {
      return onToggleUser(userId);
    }
    try {
      const res = await adminService.toggleUserStatus(token, userId);
      alert(res.message || 'Estado de usuario actualizado');
      onRefresh?.();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (onChangeRole) {
      return onChangeRole(userId, newRole);
    }
    try {
      const res = await adminService.changeUserRole(token, userId, newRole);
      alert(res.message || 'Rol actualizado');
      onRefresh?.();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div
      ref={menuContainerRef}
      style={{
        background: 'var(--card-bg)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        overflow: 'visible',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      {/* Barra de Filtro */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="🔍 Buscar por nombre, correo o rol..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input"
          style={{
            maxWidth: '400px',
          }}
        />
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Mostrando <strong style={{ color: 'var(--primary-color)' }}>{filteredUsers.length}</strong> de {users.length} usuarios
        </span>
      </div>

      <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>ID</th>
              <th style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>Usuario</th>
              <th style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>Correo</th>
              <th style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>Rol Actual</th>
              <th style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>Estado</th>
              <th style={{ padding: '14px 16px', color: 'var(--text-secondary)', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No se encontraron usuarios que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isSelf = u.id === currentUser?.id;
                const isMenuOpen = activeMenuUserId === u.id;

                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>#{u.id}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {u.name} {isSelf && <span style={{ fontSize: '10px', color: 'var(--primary-color)', marginLeft: '4px' }}>(Tú)</span>}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <select
                        value={u.role || 'student'}
                        disabled={isSelf}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="form-input"
                        style={{
                          padding: '5px 10px',
                          fontSize: '12px',
                          width: 'auto',
                          color: 'var(--text-secondary)',
                          cursor: isSelf ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <option value="student">Estudiante</option>
                        <option value="teacher">Docente</option>
                        <option value="moderator">Moderador</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          background: u.is_active ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                          border: `1px solid ${u.is_active ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`,
                          color: u.is_active ? 'var(--color-success-text)' : 'var(--color-danger-text)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        ● {u.is_active ? 'Activo' : 'Suspendido'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', position: 'relative' }}>
                      <div style={{ display: 'inline-block', position: 'relative' }}>
                        <button
                          type="button"
                          onClick={() => setActiveMenuUserId(isMenuOpen ? null : u.id)}
                          className="btn-outline"
                          style={{
                            padding: '4px 10px',
                            fontSize: '16px',
                            lineHeight: 1,
                            borderRadius: '6px',
                            minWidth: '32px',
                          }}
                          title="Opciones de usuario"
                          aria-label="Opciones de usuario"
                        >
                          ⋮
                        </button>

                        {isMenuOpen && (
                          <div
                            style={{
                              position: 'absolute',
                              right: 0,
                              top: 'calc(100% + 4px)',
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '8px',
                              boxShadow: 'var(--card-shadow)',
                              minWidth: '180px',
                              zIndex: 100,
                              padding: '4px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px',
                              textAlign: 'left',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuUserId(null);
                                onOpenSanction?.(u);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                width: '100%',
                                padding: '8px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--text-primary)',
                                fontSize: '12px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'background 0.15s ease',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              <span>⚠️</span>
                              <span>Aplicar Sanción</span>
                            </button>

                            <button
                              type="button"
                              disabled={isSelf}
                              onClick={() => handleToggle(u.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                width: '100%',
                                padding: '8px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                background: 'transparent',
                                color: isSelf
                                  ? 'var(--text-muted)'
                                  : u.is_active
                                  ? 'var(--color-danger-text)'
                                  : 'var(--color-success-text)',
                                fontSize: '12px',
                                cursor: isSelf ? 'not-allowed' : 'pointer',
                                textAlign: 'left',
                                transition: 'background 0.15s ease',
                                opacity: isSelf ? 0.5 : 1,
                              }}
                              onMouseEnter={(e) => !isSelf && (e.currentTarget.style.background = 'var(--bg-elevated)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              <span>{u.is_active ? '🚫' : '✅'}</span>
                              <span>{u.is_active ? 'Suspender Usuario' : 'Reactivar Usuario'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
