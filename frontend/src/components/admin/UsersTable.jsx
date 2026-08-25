// =============================================================================
// MODIFICACIÓN 4 — COMPONENTE: TABLA DE GESTIÓN DE USUARIOS Y ROLES (RBAC)
// Responsable: Integrante 4 (Administración & Control de Acceso)
// =============================================================================

import { adminService } from '../../services/admin.service';
import { useAuth } from '../../context/AuthContext';

export default function UsersTable({ users = [], onRefresh, onToggleUser, onChangeRole }) {
  const { token, user: currentUser } = useAuth();

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
    <div style={{ background: 'var(--sidebar-bg, #1e293b)', borderRadius: '12px', border: '1px solid var(--border-color, #334155)', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid var(--border-color, #334155)' }}>
              <th style={{ padding: '14px 16px', color: 'var(--text-secondary, #94a3b8)' }}>ID</th>
              <th style={{ padding: '14px 16px', color: 'var(--text-secondary, #94a3b8)' }}>Usuario</th>
              <th style={{ padding: '14px 16px', color: 'var(--text-secondary, #94a3b8)' }}>Correo</th>
              <th style={{ padding: '14px 16px', color: 'var(--text-secondary, #94a3b8)' }}>Rol Actual</th>
              <th style={{ padding: '14px 16px', color: 'var(--text-secondary, #94a3b8)' }}>Estado</th>
              <th style={{ padding: '14px 16px', color: 'var(--text-secondary, #94a3b8)', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary, #94a3b8)' }}>
                  No hay usuarios registrados.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color, #334155)' }}>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary, #94a3b8)' }}>#{u.id}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: '#fff' }}>
                      {u.name} {isSelf && <span style={{ fontSize: '10px', color: '#60a5fa' }}>(Tú)</span>}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary, #94a3b8)' }}>{u.email}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <select
                        value={u.role || 'student'}
                        disabled={isSelf}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="form-input"
                        style={{ padding: '4px 8px', fontSize: '12px', width: 'auto' }}
                      >
                        <option value="student">🎓 Estudiante</option>
                        <option value="teacher">👨‍🏫 Docente</option>
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
                          background: u.is_active ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: u.is_active ? '#86efac' : '#fca5a5',
                        }}
                      >
                        {u.is_active ? '● Activo' : '● Suspendido'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggle(u.id)}
                        disabled={isSelf}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: isSelf ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: u.is_active ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                          color: u.is_active ? '#f87171' : '#86efac',
                          opacity: isSelf ? 0.5 : 1,
                        }}
                      >
                        {u.is_active ? '🚫 Suspender' : '✅ Reactivar'}
                      </button>
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
