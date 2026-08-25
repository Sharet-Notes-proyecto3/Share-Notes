import { useEffect, useMemo, useState } from 'react';
import UsersTable from './UsersTable';
import ReportsTable from './ReportsTable';
import adminService from '../../services/admin.service';

export default function AdminView() {
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAdminData = async () => {
    setLoading(true);
    setError('');

    try {
      const [userData, reportData] = await Promise.all([
        adminService.getUsers(),
        adminService.getReports('pending'),
      ]);

      setUsers(Array.isArray(userData) ? userData : []);
      setReports(Array.isArray(reportData) ? reportData : []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los datos de administración.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const metrics = useMemo(() => {
    const activeUsers = users.filter((user) => user.is_active).length;
    const pendingReports = reports.filter((report) => report.status === 'pending').length;

    return {
      activeUsers,
      pendingReports,
      totalUsers: users.length,
      totalReports: reports.length,
    };
  }, [users, reports]);

  const handleToggleUser = async (userId) => {
    try {
      await adminService.toggleUserStatus(userId);
      await loadAdminData();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el estado del usuario.');
    }
  };

  const handleChangeRole = async (userId, nextRole) => {
    try {
      await adminService.changeUserRole(userId, nextRole);
      await loadAdminData();
    } catch (err) {
      setError(err.message || 'No se pudo cambiar el rol del usuario.');
    }
  };

  const handleResolveReport = async (reportId, status) => {
    try {
      await adminService.resolveReport(reportId, status);
      await loadAdminData();
    } catch (err) {
      setError(err.message || 'No se pudo resolver el reporte.');
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="section-title" style={{ marginBottom: 0 }}>Panel de Administración</h1>
      </div>

      {error && (
        <div
          style={{
            marginBottom: '20px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5',
            borderRadius: '12px',
            padding: '12px 16px',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ color: '#86efac', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Usuarios activos</div>
          <div style={{ color: '#fff', fontSize: '32px', fontWeight: '700' }}>{metrics.activeUsers}</div>
        </div>

        <div style={{ background: 'rgba(167, 139, 250, 0.08)', border: '1px solid rgba(167, 139, 250, 0.2)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ color: '#c4b5fd', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Total usuarios</div>
          <div style={{ color: '#fff', fontSize: '32px', fontWeight: '700' }}>{metrics.totalUsers}</div>
        </div>

        <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ color: '#fcd34d', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Reportes pendientes</div>
          <div style={{ color: '#fff', fontSize: '32px', fontWeight: '700' }}>{metrics.pendingReports}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          className="primary-btn"
          style={{
            background: activeTab === 'users' ? 'var(--accent-color)' : 'rgba(255,255,255,0.08)',
            border: activeTab === 'users' ? 'none' : '1px solid var(--border-color)',
          }}
          onClick={() => setActiveTab('users')}
        >
          Usuarios ({users.length})
        </button>
        <button
          className="primary-btn"
          style={{
            background: activeTab === 'reports' ? 'var(--accent-color)' : 'rgba(255,255,255,0.08)',
            border: activeTab === 'reports' ? 'none' : '1px solid var(--border-color)',
          }}
          onClick={() => setActiveTab('reports')}
        >
          Reportes ({reports.length})
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)', padding: '20px' }}>Cargando administración...</div>
      ) : activeTab === 'users' ? (
        <UsersTable users={users} onToggleUser={handleToggleUser} onChangeRole={handleChangeRole} />
      ) : (
        <ReportsTable reports={reports} onResolveReport={handleResolveReport} />
      )}
    </div>
  );
}
