// =============================================================================
// MODIFICACIÓN 4 — COMPONENTE: TABLERO DE ADMINISTRACIÓN Y CONTROL
// Responsable: Integrante 4 (Panel de Control, Estadísticas, Roles y Reportes)
// =============================================================================

import React, { useState, useEffect } from 'react';
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

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [usersRes, reportsRes] = await Promise.all([
        adminService.getUsers(token),
        adminService.getReports(token),
      ]);
      setUsers(usersRes.data || usersRes || []);
      setReports(reportsRes.data || reportsRes || []);
    } catch (err) {
      console.error('Error al cargar datos administrativos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadAdminData();
  }, [token]);

  if (!isModerator) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#f87171' }}>
        <h2>⛔ Acceso Restringido</h2>
        <p>Esta sección está reservada exclusivamente para Administradores y Moderadores.</p>
      </div>
    );
  }

  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;
  const activeUsersCount = users.filter((u) => u.is_active).length;

  return (
    <div style={{ padding: '24px' }}>
      {/* Encabezado */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 4px', color: '#fff', fontSize: '24px' }}>🛡️ Panel de Administración y Moderación</h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
          Gestión de usuarios, asignación de roles académicos y resolución de reportes
        </p>
      </div>

      {/* Tarjetas de Métricas Rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--sidebar-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>👥 Total Usuarios Registrados</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#60a5fa', marginTop: '4px' }}>{users.length}</div>
          <div style={{ fontSize: '11px', color: '#86efac', marginTop: '4px' }}>● {activeUsersCount} activos</div>
        </div>

        <div style={{ background: 'var(--sidebar-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>🚨 Reportes Pendientes</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b', marginTop: '4px' }}>{pendingReportsCount}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{reports.length} reportes en total</div>
        </div>
      </div>

      {/* Selector de Pestañas */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
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
            color: activeTab === 'users' ? '#fff' : 'var(--text-secondary)',
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
            color: activeTab === 'reports' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          🚨 Reportes de Moderación {pendingReportsCount > 0 && `(${pendingReportsCount})`}
        </button>
      </div>

      {/* Contenido según pestaña */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>
          ⏳ Cargando información administrativa...
        </div>
      ) : activeTab === 'users' ? (
        <UsersTable users={users} onRefresh={loadAdminData} />
      ) : (
        <ReportsTable reports={reports} onRefresh={loadAdminData} />
      )}
    </div>
  );
}
