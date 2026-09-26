// =============================================================================
// MODIFICACIÓN 4 — COMPONENTE: TABLA DE GESTIÓN DE USUARIOS Y ROLES (RBAC)
// Responsable: Integrante 4 (Administración & Control de Acceso)
// =============================================================================

import { useState, useMemo } from 'react';
import { adminService } from '../../services/admin.service';
import { useAuth } from '../../context/AuthContext';

export default function UsersTable({ users = [], onRefresh, onToggleUser, onChangeRole, onOpenSanction }) {
  const { token, user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

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
    <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--card-shadow)' }}>
      {/* Barra de Filtro */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
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

      <div style={{ overflowX: 'auto' }}>
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
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>#{u.id}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {u.name} {isSelf && <span style={{ fontSize: '10px', color: 'var(--primary-color)' }}>(Tú)</span>}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <select
                        value={u.role || 'student'}
                        disabled={isSelf}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="form-input"
                        style={{ padding: '4px 8px', fontSize: '12px', width: 'auto' }}
                      >
                        <option value="student">🎓 Estudiante</option>
                        <option value="teacher">👩‍🏫 Docente</option>
                        <option value="moderator">🛡️ Moderador</option>
                        <option value="admin">👑 Administrador</option>
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
                        }}
                      >
                        {u.is_active ? '● Activo' : '● Suspendido'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => onOpenSanction?.(u)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--color-warning-border)',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '600',
                            background: 'var(--color-warning-bg)',
                            color: 'var(--color-warning-text)',
                          }}
                        >
                          ⚠️ Sanción
                        </button>
                        <button
                          onClick={() => handleToggle(u.id)}
                          disabled={isSelf}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: `1px solid ${u.is_active ? 'var(--color-danger-border)' : 'var(--color-success-border)'}`,
                            cursor: isSelf ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: u.is_active ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
                            color: u.is_active ? 'var(--color-danger-text)' : 'var(--color-success-text)',
                            opacity: isSelf ? 0.5 : 1,
                          }}
                        >
                          {u.is_active ? '🚫 Suspender' : '✅ Reactivar'}
                        </button>
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
