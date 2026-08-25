import { useState, useEffect } from 'react'
import Forum from './components/Forum'
import AdminPanel from './components/AdminPanel'
import './App.css'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [isLogin, setIsLogin] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');

  // Upload Note State
  const [showUpload, setShowUpload] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', description: '', subjectId: '', file: null });

  const API_URL = 'http://localhost:3000/api';

  useEffect(() => {
    if (token) {
      fetchProfile();
      fetchNotes();
      fetchSubjects();
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        logout();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNotes = async () => {
    try {
      const res = await fetch(`${API_URL}/notes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(data.data || data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await fetch(`${API_URL}/notes/subjects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.data || data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const body = isLogin ? { email, password } : { name, email, password, role };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      
      if (res.ok) {
        if (data.token) {
          localStorage.setItem('token', data.token);
          setToken(data.token);
        } else {
          alert('Registro exitoso. Ahora puedes iniciar sesión.');
          setIsLogin(true);
        }
      } else {
        alert(data.message || 'Error en autenticación');
      }
    } catch (err) {
      alert('Error de conexión con el backend');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!newNote.file || !newNote.title || !newNote.subjectId) {
      alert("Por favor completa los campos requeridos (Título, Materia, Archivo)");
      return;
    }

    const formData = new FormData();
    formData.append('title', newNote.title);
    formData.append('description', newNote.description);
    formData.append('subjectId', newNote.subjectId);
    formData.append('file', newNote.file);

    try {
      const res = await fetch(`${API_URL}/notes`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      
      if (res.ok) {
        alert('Apunte subido exitosamente! Esto ha disparado MS-Email en el backend.');
        setShowUpload(false);
        setNewNote({ title: '', description: '', subjectId: '', file: null });
        fetchNotes();
      } else {
        const data = await res.json();
        alert(data.message || 'Error subiendo apunte');
      }
    } catch (err) {
      alert('Error subiendo archivo');
    }
  };

  const handleGenerateReport = async () => {
    try {
      const res = await fetch(`${API_URL}/notes/report`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Mis_Apuntes_Reporte.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        alert('Reporte PDF generado y descargado! (Vía MS-PDF)');
      } else {
        alert('Error generando el reporte PDF.');
      }
    } catch (err) {
      alert('Error de conexión al generar PDF.');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ background: 'var(--sidebar-bg)', padding: '40px', borderRadius: '16px', width: '100%', maxWidth: '400px', border: '1px solid var(--border-color)' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '24px', color: '#fff' }}>
            {isLogin ? 'Iniciar Sesión' : 'Registrarse'} en Share-Notes
          </h2>
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!isLogin && (
              <input 
                type="text" 
                placeholder="Nombre completo" 
                className="form-input" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
              />
            )}
            <input 
              type="email" 
              placeholder="Correo electrónico" 
              className="form-input" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
            <input 
              type="password" 
              placeholder="Contraseña" 
              className="form-input" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
            {!isLogin && (
              <select className="form-input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="student">Estudiante</option>
                <option value="teacher">Profesor</option>
                <option value="moderator">Moderador</option>
              </select>
            )}
            <button type="submit" className="primary-btn">{isLogin ? 'Ingresar' : 'Crear Cuenta'}</button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '16px', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          Share-Notes
        </div>
        
        <nav className="nav-menu">
          <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            Inicio
          </div>
          <div className={`nav-item ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            Mis Notas
          </div>
          <div className={`nav-item ${activeTab === 'forum' ? 'active' : ''}`} onClick={() => setActiveTab('forum')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            Foro
          </div>
          {user?.role === 'admin' && (
            <div className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              Administración
            </div>
          )}
          <div className="nav-item" onClick={handleGenerateReport} style={{ marginTop: 'auto', background: 'rgba(6, 182, 212, 0.1)', color: '#22d3ee' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Reporte PDF
          </div>
          <div className="nav-item" onClick={logout} style={{ color: '#ef4444' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Cerrar Sesión
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <div className="search-bar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" placeholder="Buscar notas..." />
          </div>
          <div className="user-profile" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowProfileMenu(!showProfileMenu)}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500' }}>Hola, {user?.name || 'Usuario'}</span>
            <div className="avatar">{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</div>
            
            {showProfileMenu && (
              <div className="profile-menu">
                <div className="profile-menu-header">
                  <div className="profile-menu-email" title={user?.email}>{user?.email || 'usuario@correo.com'}</div>
                  <div className="profile-menu-role">{user?.role === 'admin' ? 'Administrador' : 'Estudiante'}</div>
                </div>
                <div className="profile-menu-item danger" onClick={logout}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  Cerrar Sesión
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="content-area">
          {activeTab === 'home' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ background: 'var(--card-bg)', padding: '40px', borderRadius: '16px', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 70%)', borderRadius: '50%' }}></div>
                <h1 className="section-title" style={{ fontSize: '36px', marginBottom: '16px' }}>Bienvenido a Share-Notes</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '18px', lineHeight: '1.6', maxWidth: '600px' }}>
                  Tu plataforma centralizada para organizar, compartir y gestionar todos tus apuntes universitarios. Sube tus notas, genera reportes en PDF y notifica a tus compañeros automáticamente.
                </p>
                <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                  <button className="primary-btn" onClick={() => setActiveTab('notes')}>Ver Mis Notas</button>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                <div style={{ background: 'rgba(6, 182, 212, 0.05)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                  <h3 style={{ color: '#22d3ee', fontSize: '32px', marginBottom: '8px' }}>{notes.length}</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Apuntes Guardados</p>
                </div>
                <div style={{ background: 'rgba(167, 139, 250, 0.05)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(167, 139, 250, 0.2)' }}>
                  <h3 style={{ color: '#a78bfa', fontSize: '32px', marginBottom: '8px' }}>{subjects.length}</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Materias Registradas</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 className="section-title" style={{ marginBottom: 0 }}>Mis Apuntes</h1>
                <button className="primary-btn" onClick={() => setShowUpload(!showUpload)}>+ Nuevo Apunte</button>
              </div>

              {showUpload && (
                <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ marginBottom: '16px', color: '#fff' }}>Subir Nuevo Apunte</h3>
                  <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <input className="form-input" type="text" placeholder="Título del apunte" value={newNote.title} onChange={e => setNewNote({...newNote, title: e.target.value})} required />
                    <textarea className="form-input" placeholder="Descripción (opcional)" value={newNote.description} onChange={e => setNewNote({...newNote, description: e.target.value})} />
                    <select className="form-input" value={newNote.subjectId} onChange={e => setNewNote({...newNote, subjectId: e.target.value})} required>
                      <option value="">Selecciona una materia...</option>
                      {subjects.map(s => <option key={s.id || s.subjectId} value={s.id || s.subjectId}>{s.name || s.nombre}</option>)}
                    </select>
                    <input className="form-input" type="file" onChange={e => setNewNote({...newNote, file: e.target.files[0]})} required />
                    <button type="submit" className="primary-btn" style={{ alignSelf: 'flex-start' }}>Subir y Notificar (MS-Email)</button>
                  </form>
                </div>
              )}
              
              <div className="notes-grid">
                {notes.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>Aún no hay notas. ¡Sube tu primer apunte!</p>
                ) : (
                  notes.map((note, index) => (
                    <div 
                      key={note.id || index} 
                      className="note-card animate-fade-in"
                      style={{ animationDelay: `${(index % 5) * 0.1}s` }}
                    >
                      <div className="note-header">
                        <div className="note-tag">{note.subject?.name || note.subject || 'Materia'}</div>
                      </div>
                      <h3 className="note-title">{note.title}</h3>
                      <p className="note-excerpt">{note.description || 'Sin descripción'}</p>
                      <div className="note-footer">
                        <span>{note.createdAt ? new Date(note.createdAt).toLocaleDateString() : ''}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <a href={`${API_URL}/notes/${note.id}/download`} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer', opacity: 0.7 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'forum' && (
            <Forum token={token} user={user} subjects={subjects} />
          )}

          {activeTab === 'admin' && user?.role === 'admin' && (
            <AdminPanel token={token} />
          )}
        </div>
      </main>
    </div>
  )
}

export default App
