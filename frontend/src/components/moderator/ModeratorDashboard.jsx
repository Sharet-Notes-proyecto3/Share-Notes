// src/components/moderator/ModeratorDashboard.jsx
import { useState } from 'react';
import RoleGate from '../../directives/RoleGate';
import ReportsQueueTable from './ReportsQueueTable';
import ModerationLogsTable from './ModerationLogsTable';
import UserRestrictModal from './UserRestrictModal';
import useReportsQueue from '../../composables/useReportsQueue';
import useModeration from '../../composables/useModeration';

export function ModeratorDashboard({ defaultTab = 'reports' }) {
  const [activeTab, setActiveTab] = useState(defaultTab); // 'reports' | 'logs' | 'users'
  const { reports, pendingCount, loading: loadingQueue, error: queueError, refetch: refetchQueue, removeReportOptimistically } = useReportsQueue();
  const { resolveReport, dismissReport } = useModeration();

  // Restrict User Modal state
  const [restrictUserId, setRestrictUserId] = useState(null);
  const [isRestrictModalOpen, setIsRestrictModalOpen] = useState(false);
  const [manualUserId, setManualUserId] = useState('');

  const handleResolve = async (reportId) => {
    const res = await resolveReport(reportId);
    if (res.success) {
      removeReportOptimistically(reportId);
    }
  };

  const handleDismiss = async (reportId) => {
    const res = await dismissReport(reportId);
    if (res.success) {
      removeReportOptimistically(reportId);
    }
  };

  const handleOpenRestrictModal = (userId) => {
    setRestrictUserId(userId);
    setIsRestrictModalOpen(true);
  };

  return (
    <RoleGate
      allow={['MODERATOR', 'FRONT_DESK_CS', 'ADMIN']}
      fallback={
        <div style={{ padding: '32px', textAlign: 'center', backgroundColor: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', color: 'var(--color-danger-text)', borderRadius: '8px', margin: '24px' }}>
          <h2>403 Prohibido</h2>
          <p>No posees los permisos necesarios del rol MODERATOR para acceder a este panel.</p>
        </div>
      }
    >
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {/* Banner Superior Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            padding: '24px',
            borderRadius: '12px',
            marginBottom: '24px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🛡️ Panel de Moderación de Contenidos
            </h1>
            <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
              Gestión centralizada de denuncias, moderación de publicaciones/apuntes y sanciones de usuarios.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div
              style={{
                backgroundColor: 'var(--bg-elevated)',
                padding: '10px 16px',
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                Denuncias Pendientes
              </div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: pendingCount > 0 ? 'var(--color-warning-text)' : 'var(--color-success-text)' }}>
                {pendingCount}
              </div>
            </div>

            <button
              onClick={refetchQueue}
              disabled={loadingQueue}
              style={{
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 'bold',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              🔄 Actualizar Cola
            </button>
          </div>
        </div>

        {/* Pestañas de Navegación del Panel */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border-color)', marginBottom: '24px' }}>
          <button
            onClick={() => setActiveTab('reports')}
            style={{
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: activeTab === 'reports' ? 'var(--primary-color)' : 'var(--text-muted)',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'reports' ? '3px solid var(--primary-color)' : '3px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '-2px',
            }}
          >
            🚨 Cola de Denuncias
            {pendingCount > 0 && (
              <span style={{ backgroundColor: 'var(--color-danger)', color: 'var(--text-inverse)', fontSize: '11px', borderRadius: '10px', padding: '2px 8px' }}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            style={{
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: activeTab === 'logs' ? 'var(--primary-color)' : 'var(--text-muted)',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'logs' ? '3px solid var(--primary-color)' : '3px solid transparent',
              cursor: 'pointer',
              marginBottom: '-2px',
            }}
          >
            📋 Historial de Moderación
          </button>

          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: activeTab === 'users' ? 'var(--primary-color)' : 'var(--text-muted)',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'users' ? '3px solid var(--primary-color)' : '3px solid transparent',
              cursor: 'pointer',
              marginBottom: '-2px',
            }}
          >
            🚫 Restricción de Usuarios
          </button>
        </div>

        {/* Contenido de la Pestaña Activa */}
        {activeTab === 'reports' && (
          <div>
            <h2 style={{ fontSize: '18px', margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
              Denuncias Pendientes de Revisión
            </h2>
            <ReportsQueueTable
              reports={reports}
              onResolve={handleResolve}
              onDismiss={handleDismiss}
              loading={loadingQueue}
              error={queueError}
              onOpenRestrictUser={handleOpenRestrictModal}
            />
          </div>
        )}

        {activeTab === 'logs' && (
          <div>
            <ModerationLogsTable />
          </div>
        )}

        {activeTab === 'users' && (
          <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 12px 0', color: 'var(--text-primary)' }}>
              Sancionar / Restringir Usuario por ID
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Aplica una restricción temporal de participación en foros a cualquier usuario infractor ingresando su ID directamente.
            </p>

            <div style={{ display: 'flex', gap: '12px', maxWidth: '400px' }}>
              <input
                type="number"
                value={manualUserId}
                onChange={(e) => setManualUserId(e.target.value)}
                placeholder="ID del usuario (ej: 42)"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: '14px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                onClick={() => {
                  if (manualUserId) {
                    handleOpenRestrictModal(manualUserId);
                  }
                }}
                disabled={!manualUserId}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  backgroundColor: 'var(--color-danger)',
                  color: 'var(--text-inverse)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: manualUserId ? 'pointer' : 'not-allowed',
                  opacity: manualUserId ? 1 : 0.6,
                }}
              >
                🚫 Restringir
              </button>
            </div>
          </div>
        )}

        {/* Modal de Restricción */}
        <UserRestrictModal
          userId={restrictUserId}
          isOpen={isRestrictModalOpen}
          onClose={() => {
            setIsRestrictModalOpen(false);
            setRestrictUserId(null);
          }}
          onSuccess={() => {
            alert('Restricción aplicada exitosamente');
          }}
        />
      </div>
    </RoleGate>
  );
}

export default ModeratorDashboard;
