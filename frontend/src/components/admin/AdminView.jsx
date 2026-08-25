// =============================================================================
// MODIFICACIÓN 4 — COMPONENTE: TABLERO DE ADMINISTRACIÓN Y CONTROL
// Responsable: Integrante 4 (Panel de Control, Estadísticas, Roles y Reportes)
// =============================================================================

import { useState, useEffect, useMemo } from 'react';
import { adminService } from '../../services/admin.service';
import { useAuth } from '../../context/AuthContext';
import UsersTable from './UsersTable';
import ReportsTable from './ReportsTable';

export default function AdminView() {
  const { token, isModerator } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError('');
      const [usersRes, reportsRes] = await Promise.all([
        adminService.getUsers(token),
        adminService.getReports(token),
      ]);
      setUsers(usersRes.data || (Array.isArray(usersRes) ? usersRes : []));
      setReports(reportsRes.data || (Array.isArray(reportsRes) ? reportsRes : []));
    } catch (err) {
      console.error('Error al cargar datos administrativos:', err);
      setError(err.message || 'No se pudieron cargar los datos de administración.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      try {
        setLoading(true);
        setError('');
        const [usersRes, reportsRes] = await Promise.all([
          adminService.getUsers(token),
          adminService.getReports(token),
        ]);
        if (isMounted) {
          setUsers(usersRes.data || (Array.isArray(usersRes) ? usersRes : []));
          setReports(reportsRes.data || (Array.isArray(reportsRes) ? reportsRes : []));
        }
      } catch (err) {
        console.error('Error al cargar datos administrativos:', err);
        if (isMounted) {
          setError(err.message || 'No se pudieron cargar los datos de administración.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (token) {
      fetchData();
    }

    return () => {
      isMounted = false;
    };
  }, [token]);

  const metrics = useMemo(() => {
    const activeUsers = users.filter((u) => u.is_active).length;
    const pendingReports = reports.filter((r) => r.status === 'pending').length;

    return {
      activeUsers,
      pendingReports,
      totalUsers: users.length,
      totalReports: reports.length,
    };
  }, [users, reports]);

  const handleToggleUser = async (userId) => {
    try {
      await adminService.toggleUserStatus(token, userId);
      await loadAdminData();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el estado del usuario.');
    }
  };

  const handleChangeRole = async (userId, nextRole) => {
    try {
      await adminService.changeUserRole(token, userId, nextRole);
      await loadAdminData();
    } catch (err) {
      setError(err.message || 'No se pudo cambiar el rol del usuario.');
    }
  };

  const handleResolveReport = async (reportId, status) => {
    try {
      await adminService.resolveReport(token, reportId, status);
      await loadAdminData();
    } catch (err) {
      setError(err.message || 'No se pudo resolver el reporte.');
    }
  };

  if (!isModerator) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#f87171' }}>
        <h2>⛔ Acceso Restringido</h2>
        <p>Esta sección está reservada exclusivamente para Administradores y Moderadores.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }} className="animate-fade-in">
      {/* Encabezado */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 4px', color: '#fff', fontSize: '24px' }}>🛡️ Panel de Administración y Moderación</h2>
        <p style={{ margin: 0, color: 'var(--text-secondary, #94a3b8)', fontSize: '14px' }}>
          Gestión de usuarios, asignación de roles académicos y resolución de reportes
        </p>
      </div>

      {error && (
        <div
          style={{
            marginBottom: '20px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '13px',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Tarjetas de Métricas Rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--sidebar-bg, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary, #94a3b8)' }}>👥 Usuarios Activos</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#86efac', marginTop: '4px' }}>{metrics.activeUsers}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #94a3b8)', marginTop: '4px' }}>De un total de {metrics.totalUsers}</div>
        </div>

        <div style={{ background: 'var(--sidebar-bg, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary, #94a3b8)' }}>👥 Total Usuarios</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#60a5fa', marginTop: '4px' }}>{metrics.totalUsers}</div>
          <div style={{ fontSize: '11px', color: '#60a5fa', marginTop: '4px' }}>Plataforma ShareNotes</div>
        </div>

        <div style={{ background: 'var(--sidebar-bg, #1e293b)', border: '1px solid var(--border-color, #334155)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary, #94a3b8)' }}>🚨 Reportes Pendientes</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b', marginTop: '4px' }}>{metrics.pendingReports}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #94a3b8)', marginTop: '4px' }}>{metrics.totalReports} reportes en total</div>
        </div>
      </div>

      {/* Selector de Pestañas */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--border-color, #334155)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
            background: activeTab === 'users' ? 'var(--primary-color, #3b82f6)' : 'transparent',
            color: activeTab === 'users' ? '#fff' : 'var(--text-secondary, #94a3b8)',
          }}
        >
          👥 Gestión de Usuarios ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
            background: activeTab === 'reports' ? 'var(--primary-color, #3b82f6)' : 'transparent',
            color: activeTab === 'reports' ? '#fff' : 'var(--text-secondary, #94a3b8)',
          }}
        >
          🚨 Reportes de Moderación {metrics.pendingReports > 0 && `(${metrics.pendingReports})`}
        </button>
      </div>

      {/* Contenido según pestaña */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary, #94a3b8)' }}>
          ⏳ Cargando información administrativa...
        </div>
      ) : activeTab === 'users' ? (
        <UsersTable
          users={users}
          onRefresh={loadAdminData}
          onToggleUser={handleToggleUser}
          onChangeRole={handleChangeRole}
        />
      ) : (
        <ReportsTable
          reports={reports}
          onRefresh={loadAdminData}
          onResolveReport={handleResolveReport}
        />
      )}
    </div>
  );
}
