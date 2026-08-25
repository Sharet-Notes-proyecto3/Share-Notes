// =============================================================================
// MODIFICACIÓN 3 — COMPONENTE: VISTA PRINCIPAL DEL FORO ACADÉMICO
// Responsable: Integrante 3 (Foro, Hilos & Comunidad)
// =============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { forumService } from '../../services/forum.service';
import { notesService } from '../../services/notes.service';
import { useAuth } from '../../context/AuthContext';
import ThreadCard from './ThreadCard';
import NewThreadModal from './NewThreadModal';

export default function ForumView() {
  const { token } = useAuth();
  const [threads, setThreads] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewThreadModal, setShowNewThreadModal] = useState(false);

  // Búsqueda y orden (mejoras solo de frontend)
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'popular'

  // Toast de confirmación
  const [toast, setToast] = useState('');

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const loadForumData = async () => {
    try {
      setLoading(true);
      const [threadsRes, subjectsRes] = await Promise.all([
        forumService.getThreads(token, selectedSubject),
        notesService.getSubjects(token),
      ]);
      setThreads(threadsRes.data || threadsRes || []);
      setSubjects(subjectsRes.data || subjectsRes || []);
    } catch (err) {
      console.error('Error al cargar datos del foro:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadForumData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedSubject]);

  // Se ejecuta cuando se crea un debate nuevo desde el modal
  const handleThreadCreated = () => {
    loadForumData();
    showToast('✅ Debate publicado con éxito');
  };

  // Se pasa a cada ThreadCard para refrescar y avisar cuando hay una respuesta nueva
  const handleReplyPosted = () => {
    loadForumData();
    showToast('✅ Respuesta publicada con éxito');
  };

  // Filtrado por texto + orden, aplicados en el cliente sobre lo que ya llegó del backend
  const visibleThreads = useMemo(() => {
    let result = [...threads];

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (t) =>
          (t.title || '').toLowerCase().includes(q) ||
          (t.body || '').toLowerCase().includes(q)
      );
    }

    if (sortBy === 'popular') {
      result.sort((a, b) => (b.reply_count || 0) - (a.reply_count || 0));
    } else {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return result;
  }, [threads, searchQuery, sortBy]);

  return (
    <div style={{ padding: '24px', position: 'relative' }}>
      {/* Toast de confirmación */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            color: '#86efac',
            padding: '12px 18px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '600',
            zIndex: 2000,
            boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
          }}
        >
          {toast}
        </div>
      )}

      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#fff', fontSize: '24px' }}>💬 Foro Académico</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
            Resuelve dudas, colabora y debate sobre las materias universitarias
          </p>
        </div>

        <button
          onClick={() => setShowNewThreadModal(true)}
          className="primary-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', fontSize: '13px' }}
        >
          ➕ Nuevo Debate
        </button>
      </div>

      {/* Filtros: materia, búsqueda y orden */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <select
          className="form-input"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          style={{ maxWidth: '260px' }}
        >
          <option value="">Todas las materias</option>
          {subjects.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name} (Semestre {sub.semester})
            </option>
          ))}
        </select>

        <input
          type="text"
          className="form-input"
          placeholder="🔍 Buscar por título o contenido..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '280px' }}
        />

        <select
          className="form-input"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ maxWidth: '200px' }}
        >
          <option value="recent">🕒 Más recientes</option>
          <option value="popular">🔥 Más respondidos</option>
        </select>
      </div>

      {/* Listado de Hilos */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>
          ⏳ Cargando debates del foro...
        </div>
      ) : threads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--sidebar-bg)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>💡</div>
          <h3 style={{ color: '#fff', margin: '0 0 6px' }}>No hay debates activos</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            Inicia una nueva pregunta o discusión para interactuar con tus compañeros.
          </p>
        </div>
      ) : visibleThreads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--sidebar-bg)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
          <h3 style={{ color: '#fff', margin: '0 0 6px' }}>Sin resultados</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            No encontramos debates que coincidan con "{searchQuery}".
          </p>
        </div>
      ) : (
        <div>
          {visibleThreads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} onRefresh={handleReplyPosted} />
          ))}
        </div>
      )}

      {/* Modal para crear tema */}
      {showNewThreadModal && (
        <NewThreadModal
          subjects={subjects}
          onClose={() => setShowNewThreadModal(false)}
          onThreadCreated={handleThreadCreated}
        />
      )}
    </div>
  );
}
