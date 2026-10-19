// =============================================================================
// MODIFICACIÓN 4 — COMPONENTE: TABLERO DE ADMINISTRACIÓN Y CONTROL
// Responsable: Integrante 4 (Panel de Control, Estadísticas, Roles y Reportes)
// =============================================================================

import { useState, useEffect, useMemo } from 'react';
import { adminService } from '../../services/admin.service';
import { notesService } from '../../services/notes.service';
import { useAuth } from '../../context/AuthContext';
import UsersTable from './UsersTable';
import ReportsTable from './ReportsTable';
import SanctionsModal from './SanctionsModal';
import MicroservicesCard from './MicroservicesCard';
import AcademicCatalog from './AcademicCatalog';
import StaffAccountManager from './StaffAccountManager';

export default function AdminView() {
  const { token, isModerator, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedUserForSanction, setSelectedUserForSanction] = useState(null);
  const [downloadingReport, setDownloadingReport] = useState(false);

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
    const suspendedUsers = users.filter((u) => !u.is_active).length;
    const pendingReports = reports.filter((r) => r.status === 'pending').length;

    return {
      activeUsers,
      suspendedUsers,
      pendingReports,
      totalUsers: users.length,
      totalReports: reports.length,
    };
  }, [users, reports]);

  const activeUsersList = useMemo(() => users.filter((u) => !!u.is_active), [users]);
  const suspendedUsersList = useMemo(() => users.filter((u) => !u.is_active), [users]);

  const handleToggleUser = async (userId) => {
    try {
      setError('');
      setSuccessMessage('');
      const res = await adminService.toggleUserStatus(token, userId);
      setSuccessMessage(res.message || 'Estado de usuario actualizado correctamente.');
      await loadAdminData();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el estado del usuario.');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      setError('');
      setSuccessMessage('');
      const res = await adminService.deleteUser(token, userId);
      setSuccessMessage(res.message || 'Cuenta de usuario eliminada correctamente.');
      await loadAdminData();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la cuenta del usuario.');
    }
  };

  const handleChangeRole = async (userId, nextRole) => {
    try {
      setError('');
      setSuccessMessage('');
      const res = await adminService.changeUserRole(token, userId, nextRole);
      setSuccessMessage(res.message || 'Rol de usuario actualizado correctamente.');
      await loadAdminData();
    } catch (err) {
      setError(err.message || 'No se pudo cambiar el rol del usuario.');
    }
  };

  const handleResolveReport = async (reportId, status) => {
    try {
      setError('');
      setSuccessMessage('');
      const res = await adminService.resolveReport(token, reportId, status);
      setSuccessMessage(res.message || `Reporte #${reportId} marcado como: ${status === 'resolved' ? 'Resuelto' : 'Descartado'}`);
      await loadAdminData();
    } catch (err) {
      setError(err.message || 'No se pudo resolver el reporte.');
    }
  };

  const handleDownloadPdfReport = async () => {
    try {
      setDownloadingReport(true);
      await notesService.downloadNotesReport(token);
    } catch (err) {
      setError(err.message || 'No se pudo descargar el reporte PDF.');
    } finally {
      setDownloadingReport(false);
    }
  };

  if (!isModerator) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-danger-text)' }}>
        <h2>⛔ Acceso Restringido</h2>
        <p>Esta sección está reservada exclusivamente para Administradores y Moderadores.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }} className="animate-fade-in">
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: 'var(--text-primary)', fontSize: '24px' }}>🛡️ Panel de Administración y Moderación</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
            Gestión de usuarios, asignación de roles académicos, catálogo y resolución de reportes
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleDownloadPdfReport}
            disabled={downloadingReport}
            className="btn-outline"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              fontSize: '13px',
            }}
          >
            {downloadingReport ? '⏳ Generando PDF...' : '📑 Reporte PDF del Sistema'}
          </button>
        )}
      </div>

      {error && (
        <div
          style={{
            marginBottom: '20px',
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            color: 'var(--color-danger-text)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>⚠️ {error}</div>
          <button
            type="button"
            onClick={() => setError('')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-danger-text)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div
          style={{
            marginBottom: '20px',
            background: 'var(--color-success-bg)',
            border: '1px solid var(--color-success-border)',
            color: 'var(--color-success-text)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>✓ {successMessage}</div>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-success-text)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Tarjetas de Métricas Rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>👥 Usuarios Activos</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-success-text)', marginTop: '4px' }}>{metrics.activeUsers}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>De un total de {metrics.totalUsers}</div>
        </div>

        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>🚫 Usuarios Suspendidos</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-danger-text)', marginTop: '4px' }}>{metrics.suspendedUsers}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Cuentas inactivas</div>
        </div>

        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>👥 Total Usuarios</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-color)', marginTop: '4px' }}>{metrics.totalUsers}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Plataforma ShareNotes</div>
        </div>

        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>🚨 Reportes Pendientes</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-warning-text)', marginTop: '4px' }}>{metrics.pendingReports}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{metrics.totalReports} reportes en total</div>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <MicroservicesCard />
      </div>

      {/* Selector de Pestañas */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
            background: activeTab === 'users' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'users' ? 'var(--primary-contrast)' : 'var(--text-secondary)',
          }}
        >
          👥 Gestión de Usuarios ({metrics.activeUsers})
        </button>

        <button
          onClick={() => setActiveTab('suspended')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
            background: activeTab === 'suspended' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'suspended' ? 'var(--primary-contrast)' : 'var(--text-secondary)',
          }}
        >
          🚫 Usuarios Suspendidos ({metrics.suspendedUsers})
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13px',
            background: activeTab === 'catalog' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'catalog' ? 'var(--primary-contrast)' : 'var(--text-secondary)',
          }}
        >
          📚 Catálogo Académico
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
            background: activeTab === 'reports' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'reports' ? 'var(--primary-contrast)' : 'var(--text-secondary)',
          }}
        >
          🚨 Reportes de Moderación {metrics.pendingReports > 0 && `(${metrics.pendingReports})`}
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('staff')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              background: activeTab === 'staff' ? 'var(--primary-color)' : 'transparent',
              color: activeTab === 'staff' ? 'var(--primary-contrast)' : 'var(--text-secondary)',
            }}
          >
            👔 Cuentas de Personal
          </button>
        )}
      </div>

      {/* Contenido según pestaña */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>
          ⏳ Cargando información administrativa...
        </div>
      ) : activeTab === 'users' ? (
        <UsersTable
          users={activeUsersList}
          emptyMessage="No hay usuarios activos registrados."
          onRefresh={loadAdminData}
          onToggleUser={handleToggleUser}
          onChangeRole={handleChangeRole}
          onOpenSanction={(user) => setSelectedUserForSanction(user)}
          onDeleteUser={handleDeleteUser}
        />
      ) : activeTab === 'suspended' ? (
        <UsersTable
          users={suspendedUsersList}
          emptyMessage="No hay usuarios suspendidos."
          onRefresh={loadAdminData}
          onToggleUser={handleToggleUser}
          onChangeRole={handleChangeRole}
          onOpenSanction={(user) => setSelectedUserForSanction(user)}
          onDeleteUser={handleDeleteUser}
        />
      ) : activeTab === 'catalog' ? (
        <AcademicCatalog />
      ) : activeTab === 'staff' ? (
        <StaffAccountManager
          token={token}
          onAccountCreated={loadAdminData}
        />
      ) : (
        <ReportsTable
          reports={reports}
          onRefresh={loadAdminData}
          onResolveReport={handleResolveReport}
        />
      )}

      {selectedUserForSanction && (
        <SanctionsModal
          user={selectedUserForSanction}
          onClose={() => setSelectedUserForSanction(null)}
          onSanctionAdded={async () => {
            setSelectedUserForSanction(null);
            await loadAdminData();
          }}
        />
      )}
    </div>
  );
}
