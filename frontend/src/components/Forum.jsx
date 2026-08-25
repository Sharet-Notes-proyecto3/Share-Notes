import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3000/api';

export default function Forum({ token, user, subjects }) {
  const [threads, setThreads] = useState([]);
  const [view, setView] = useState('list'); // 'list' | 'create' | 'thread'
  const [activeThread, setActiveThread] = useState(null);

  // Formularios
  const [newThread, setNewThread] = useState({ title: '', body: '', subjectId: '' });
  const [newReply, setNewReply] = useState('');
  const [reportData, setReportData] = useState({ targetType: '', targetId: null, reason: '' });

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      const res = await fetch(`${API_URL}/forum`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setThreads(data);
      }
    } catch (e) { console.error(e); }
  };

  const fetchThreadDetails = async (id) => {
    try {
      const res = await fetch(`${API_URL}/forum/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveThread(data);
        setView('thread');
      }
    } catch (e) { console.error(e); }
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/forum`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newThread)
      });
      if (res.ok) {
        setNewThread({ title: '', body: '', subjectId: '' });
        setView('list');
        fetchThreads();
      }
    } catch (e) { console.error(e); }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!newReply.trim()) return;
    try {
      const res = await fetch(`${API_URL}/forum/${activeThread.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body: newReply })
      });
      if (res.ok) {
        setNewReply('');
        fetchThreadDetails(activeThread.id); // Refresh
      }
    } catch (e) { console.error(e); }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/forum/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(reportData)
      });
      if (res.ok) {
        alert('Reporte enviado correctamente');
        setReportData({ targetType: '', targetId: null, reason: '' });
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="animate-fade-in">
      {/* Cabecera del Foro */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="section-title" style={{ marginBottom: 0 }}>
          {view === 'list' ? 'Foro de Discusión' : view === 'create' ? 'Nuevo Hilo de Discusión' : 'Hilo de Discusión'}
        </h1>
        {view === 'list' && (
          <button className="primary-btn" onClick={() => setView('create')}>+ Crear Hilo</button>
        )}
        {view !== 'list' && (
          <button className="primary-btn" style={{ background: 'transparent', border: '1px solid var(--border-color)' }} onClick={() => setView('list')}>
            ← Volver al Foro
          </button>
        )}
      </div>

      {/* VISTA: Listado de Hilos */}
      {view === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {threads.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No hay discusiones aún.</p> : threads.map(t => (
            <div key={t.id} style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => fetchThreadDetails(t.id)} className="note-card">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="note-tag" style={{ marginBottom: '12px' }}>{t.subject_name || 'Materia'}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{new Date(t.created_at).toLocaleDateString()}</span>
              </div>
              <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '8px' }}>{t.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Por {t.author_name}</p>
            </div>
          ))}
        </div>
      )}

      {/* VISTA: Crear Hilo */}
      {view === 'create' && (
        <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <form onSubmit={handleCreateThread} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input className="form-input" placeholder="Título del tema" value={newThread.title} onChange={e => setNewThread({...newThread, title: e.target.value})} required />
            <select className="form-input" value={newThread.subjectId} onChange={e => setNewThread({...newThread, subjectId: e.target.value})} required>
              <option value="">Selecciona la materia...</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <textarea className="form-input" placeholder="Describe tu duda o tema de discusión..." rows="6" value={newThread.body} onChange={e => setNewThread({...newThread, body: e.target.value})} required />
            <button type="submit" className="primary-btn" style={{ alignSelf: 'flex-start' }}>Publicar en el Foro</button>
          </form>
        </div>
      )}

      {/* VISTA: Hilo Detallado */}
      {view === 'thread' && activeThread && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Main Thread */}
          <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--accent-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span className="note-tag">{activeThread.subject?.name || activeThread.subject_name || 'Materia'}</span>
              <button onClick={() => setReportData({ targetType: 'thread', targetId: activeThread.id, reason: '' })} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}>
                Reportar
              </button>
            </div>
            <h2 style={{ color: '#fff', marginBottom: '16px' }}>{activeThread.title}</h2>
            <p style={{ color: '#e2e8f0', lineHeight: '1.6', marginBottom: '16px' }}>{activeThread.body}</p>
            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              Publicado por <strong>{activeThread.author?.name || activeThread.author_name}</strong> el {new Date(activeThread.created_at || activeThread.createdAt).toLocaleString()}
            </div>
          </div>

          {/* Report Modal Simple */}
          {reportData.targetType !== '' && (
            <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px' }}>
              <h4 style={{ color: '#ef4444', marginBottom: '8px' }}>Reportar Contenido</h4>
              <form onSubmit={handleReport} style={{ display: 'flex', gap: '8px' }}>
                <input className="form-input" style={{ flex: 1 }} placeholder="Razón del reporte..." value={reportData.reason} onChange={e => setReportData({...reportData, reason: e.target.value})} required />
                <button type="submit" className="primary-btn" style={{ background: '#ef4444' }}>Enviar</button>
                <button type="button" className="primary-btn" style={{ background: 'transparent', border: '1px solid var(--border-color)' }} onClick={() => setReportData({ targetType: '', targetId: null, reason: '' })}>Cancelar</button>
              </form>
            </div>
          )}

          <h3 style={{ color: '#fff' }}>Respuestas ({activeThread.replies?.length || 0})</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activeThread.replies && activeThread.replies.map(reply => (
              <div key={reply.id} style={{ background: 'var(--card-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', marginLeft: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--accent-color)', fontWeight: 'bold', fontSize: '14px' }}>{reply.author?.name || reply.author_name}</span>
                  <button onClick={() => setReportData({ targetType: 'reply', targetId: reply.id, reason: '' })} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}>
                    Reportar
                  </button>
                </div>
                <p style={{ color: '#e2e8f0', marginBottom: '8px' }}>{reply.body}</p>
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                  {new Date(reply.created_at || reply.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleReply} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginLeft: '24px', marginTop: '16px' }}>
            <textarea className="form-input" placeholder="Escribe tu respuesta..." rows="3" value={newReply} onChange={e => setNewReply(e.target.value)} required />
            <button type="submit" className="primary-btn" style={{ alignSelf: 'flex-end' }}>Enviar Respuesta</button>
          </form>

        </div>
      )}

    </div>
  );
}
