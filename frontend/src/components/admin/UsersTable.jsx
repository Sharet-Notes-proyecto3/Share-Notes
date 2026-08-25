export default function UsersTable({ users = [], onToggleUser, onChangeRole }) {
  return (
    <div
      style={{
        background: 'var(--card-bg)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', background: 'rgba(255,255,255,0.05)' }}>
            <th style={{ padding: '16px' }}>Nombre</th>
            <th style={{ padding: '16px' }}>Email</th>
            <th style={{ padding: '16px' }}>Rol</th>
            <th style={{ padding: '16px' }}>Estado</th>
            <th style={{ padding: '16px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && (
            <tr>
              <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No hay usuarios registrados.
              </td>
            </tr>
          )}

          {users.map((user) => (
            <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '16px' }}>{user.name}</td>
              <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{user.email}</td>
              <td style={{ padding: '16px' }}>
                <select
                  className="form-input"
                  value={user.role || 'student'}
                  onChange={(event) => onChangeRole?.(user.id, event.target.value)}
                  style={{ width: '140px', padding: '8px 12px' }}
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td style={{ padding: '16px' }}>
                <span
                  style={{
                    padding: '6px 10px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: user.is_active ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    color: user.is_active ? '#4ade80' : '#f87171',
                  }}
                >
                  {user.is_active ? 'ACTIVO' : 'SUSPENDIDO'}
                </span>
              </td>
              <td style={{ padding: '16px' }}>
                <button
                  onClick={() => onToggleUser?.(user.id)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  {user.is_active ? 'Suspender' : 'Reactivar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
