import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './components/auth/AuthModal';
import UserMenu from './components/auth/UserMenu';
import NotesGrid from './components/notes/NotesGrid';
import ForumView from './components/forum/ForumView';
import AdminView from './components/admin/AdminView';
import './App.css';

function MainLayout() {
  const { isAuthenticated, isModerator } = useAuth();
  const [activeTab, setActiveTab] = useState('notes');

  if (!isAuthenticated) {
    return <AuthModal />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Lateral */}
      <aside className="sidebar">
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '18px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            📚
          </div>
          <span>ShareNotes</span>
        </div>

        <nav className="nav-menu" style={{ marginTop: '24px' }}>
          <div
            className={`nav-item ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            <span>📖</span>
            <span>Apuntes & QR</span>
          </div>

          <div
            className={`nav-item ${activeTab === 'forum' ? 'active' : ''}`}
            onClick={() => setActiveTab('forum')}
          >
            <span>💬</span>
            <span>Foro Académico</span>
          </div>

          {isModerator && (
            <div
              className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <span>🛡️</span>
              <span>Administración</span>
            </div>
          )}
        </nav>

        {/* Footer del sidebar con créditos del equipo */}
        <div style={{ marginTop: 'auto', padding: '16px 0', borderTop: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <div style={{ fontWeight: '600', color: '#fff', marginBottom: '4px' }}>ShareNotes v1.0</div>
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
            {activeTab === 'admin' && '🛡️ Módulo de Administración y Control'}
          </div>

          <UserMenu />
        </header>

        {/* Vista activa */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'notes' && <NotesGrid />}
          {activeTab === 'forum' && <ForumView />}
          {activeTab === 'admin' && isModerator && <AdminView />}
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
