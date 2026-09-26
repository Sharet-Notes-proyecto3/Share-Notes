import { useState, useMemo, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './components/auth/AuthModal';
import UserMenu from './components/auth/UserMenu';
import NotesGrid from './components/notes/NotesGrid';
import ForumView from './components/forum/ForumView';
import AdminView from './components/admin/AdminView';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import ModeratorDashboard from './components/moderator/ModeratorDashboard';
import useReportsQueue from './composables/useReportsQueue';
import PaletteSwitcher from './components/common/PaletteSwitcher';
import { Can } from './directives/Can';
import { RoleGate } from './directives/RoleGate';
import { routes, beforeEachRouteGuard } from './router';
import './App.css';

function MainLayout() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('notes');
  const { pendingCount } = useReportsQueue();

  // Mapeo entre tabs y rutas del enrutador
  const tabToPath = useMemo(() => ({
    notes: '/notes',
    forum: '/forum',
    moderator: '/moderator/dashboard',
    teacher: '/teacher/courses/1/dashboard',
    admin: '/admin',
  }), []);

  const pathToTab = useCallback((path) => {
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/moderator')) return 'moderator';
    if (path.startsWith('/teacher')) return 'teacher';
    if (path.startsWith('/forum')) return 'forum';
    return 'notes';
  }, []);

  // Función de navegación protegida con el Route Guard
  const navigateToTab = useCallback(async (tabName, updateUrl = true) => {
    const targetPath = tabToPath[tabName] || '/notes';
    const targetRoute = routes.find((r) => r.path === targetPath || (r.path.includes(':') && targetPath.startsWith('/teacher'))) || routes[0];

    let allowed = false;
    await beforeEachRouteGuard(targetRoute, null, (redirect) => {
      if (!redirect) {
        allowed = true;
      }
    });

    if (allowed) {
      setActiveTab(tabName);
      if (updateUrl && window.location.pathname !== targetPath) {
        window.history.pushState({ tab: tabName }, '', targetPath);
      }
    } else {
      alert(`⛔ Acceso Denegado (403): Tu rol actual no tiene autorización para acceder a la ruta "${targetPath}". Redirigiendo a Apuntes.`);
      setActiveTab('notes');
      window.history.replaceState({ tab: 'notes' }, '', '/notes');
    }
  }, [tabToPath]);

  // Sincronizar ruta inicial por URL directa (protección contra acceso forzado por URL)
  useEffect(() => {
    if (!isAuthenticated) return;
    const currentPath = window.location.pathname;
    const initialTab = pathToTab(currentPath);
    navigateToTab(initialTab, false);

    const onPopState = () => {
      const tab = pathToTab(window.location.pathname);
      navigateToTab(tab, false);
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [isAuthenticated, pathToTab, navigateToTab]);

<<<<<<< Updated upstream
  // Propiedad calculada que decide qué vista mostrar en la raíz según authenticated
  const rootComponent = useMemo(() => {
    if (!isAuthenticated) {
      return <AuthModal />;
    }
    return null;
  }, [isAuthenticated]);
=======
  // Pantalla de carga mientras se valida la sesión persistente y se completa el arranque inicial
  if (initialLoading || loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg-canvas)',
          color: 'var(--text-primary)',
          fontFamily: "'Inter', sans-serif",
          userSelect: 'none',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'var(--theme-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            boxShadow: '0 8px 24px var(--primary-bg)',
            marginBottom: '20px',
            animation: 'pulse 1.8s infinite ease-in-out',
          }}
        >
          📚
        </div>
        <h1
          style={{
            fontSize: '22px',
            fontWeight: '700',
            margin: '0 0 12px 0',
            color: 'var(--text-primary)',
            letterSpacing: '-0.3px',
          }}
        >
          ShareNotes
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '18px',
              height: '18px',
              border: '2px solid var(--border-color)',
              borderTopColor: 'var(--primary-color)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <span
            style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}
          >
            Iniciando plataforma universitaria...
          </span>
        </div>
      </div>
    );
  }
>>>>>>> Stashed changes

  if (!isAuthenticated) {
    return rootComponent;
  }

  return (
    <div className="app-container">
      {/* Sidebar Lateral */}
      <aside className="sidebar">
<<<<<<< Updated upstream
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '18px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
=======
        <div
          className="logo"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 'bold',
            fontSize: '18px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--theme-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
>>>>>>> Stashed changes
            📚
          </div>
          <span>ShareNotes</span>
        </div>

        <nav className="nav-menu" style={{ marginTop: '24px' }}>
          <div
            className={`nav-item ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => navigateToTab('notes')}
          >
            <span>📖</span>
            <span>Apuntes & QR</span>
          </div>

          <div
            className={`nav-item ${activeTab === 'forum' ? 'active' : ''}`}
            onClick={() => navigateToTab('forum')}
          >
            <span>💬</span>
            <span>Foro Académico</span>
          </div>

          {/* Seccion de Moderación con Badge dinámico */}
          <RoleGate allow={['MODERATOR', 'FRONT_DESK_CS', 'ADMIN']}>
            <div
              className={`nav-item ${activeTab === 'moderator' ? 'active' : ''}`}
              onClick={() => navigateToTab('moderator')}
              style={{ position: 'relative' }}
            >
              <span>🛡️</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Moderación
                {pendingCount > 0 && (
                  <span
                    style={{
                      backgroundColor: 'var(--color-danger)',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      borderRadius: '10px',
                      padding: '2px 6px',
                      lineHeight: 1,
                    }}
                    title={`${pendingCount} denuncias pendientes`}
                  >
                    {pendingCount}
                  </span>
                )}
              </span>
            </div>
          </RoleGate>

          {/* Ocultamiento condicional con el patrón RoleGate */}
          <RoleGate allow={['TEACHER', 'FUNCTIONARY', 'ADMIN']}>
            <div
              className={`nav-item ${activeTab === 'teacher' ? 'active' : ''}`}
              onClick={() => navigateToTab('teacher')}
            >
              <span>👩‍🏫</span>
              <span>Panel Docente</span>
            </div>
          </RoleGate>

          {/* Ocultamiento condicional con el patrón Can / v-can */}
          <Can do="view" on="admin">
            <div
              className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => navigateToTab('admin')}
            >
              <span>⚙️</span>
              <span>Administración</span>
            </div>
          </Can>
        </nav>

        {/* Footer del sidebar con créditos del equipo */}
<<<<<<< Updated upstream
        <div style={{ marginTop: 'auto', padding: '16px 0', borderTop: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <div style={{ fontWeight: '600', color: '#fff', marginBottom: '4px' }}>ShareNotes v1.0</div>
=======
        <div
          style={{
            marginTop: 'auto',
            padding: '16px 0',
            borderTop: '1px solid var(--border-color)',
            fontSize: '11px',
            color: 'var(--text-secondary)',
          }}
        >
          <div
            style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}
          >
            ShareNotes v1.0
          </div>
>>>>>>> Stashed changes
          <div>Proyecto de Software 3</div>
          <div style={{ marginTop: '4px', opacity: 0.8 }}>4 Módulos Integrados</div>
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="main-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Barra Superior */}
        <header
          style={{
            height: '64px',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--sidebar-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
          }}
        >
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {activeTab === 'notes' && '📁 Módulo de Apuntes y Archivos'}
            {activeTab === 'forum' && '💬 Módulo de Foro y Preguntas'}
            {activeTab === 'moderator' && '🛡️ Módulo de Moderación de Contenidos y Denuncias'}
            {activeTab === 'teacher' && '👩‍🏫 Módulo Docente y Certificación'}
            {activeTab === 'admin' && '⚙️ Módulo de Administración y Control'}
          </div>

          {/* ── Tema Día/Noche + Usuario ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PaletteSwitcher />
            <UserMenu />
          </div>
        </header>

        {/* Vista activa */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'notes' && <NotesGrid />}
          {activeTab === 'forum' && <ForumView />}
          {activeTab === 'moderator' && (
            <RoleGate allow={['MODERATOR', 'FRONT_DESK_CS', 'ADMIN']}>
              <ModeratorDashboard />
            </RoleGate>
          )}
          {activeTab === 'teacher' && (
            <RoleGate allow={['TEACHER', 'FUNCTIONARY', 'ADMIN']}>
              <TeacherDashboard />
            </RoleGate>
          )}
          {activeTab === 'admin' && (
            <Can do="view" on="admin">
              <AdminView />
            </Can>
          )}
        </main>
      </div>
    </div>
  );
}


export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
