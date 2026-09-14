// =============================================================================
// MODIFICACIÓN 3 — COMPONENTE: VISTA PRINCIPAL DEL FORO ACADÉMICO
// Responsable: Integrante 3 (Camila — Foro Académico, Respuestas y Reportes)
// =============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewThreadModal, setShowNewThreadModal] = useState(false);

  const loadForumData = useCallback(async () => {
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
  }, [token, selectedSubject]);

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      try {
        setLoading(true);
        const [threadsRes, subjectsRes] = await Promise.all([
          forumService.getThreads(token, selectedSubject),
          notesService.getSubjects(token),
        ]);
        if (isMounted) {
          setThreads(threadsRes.data || threadsRes || []);
          setSubjects(subjectsRes.data || subjectsRes || []);
        }
      } catch (err) {
        console.error('Error al cargar datos del foro:', err);
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
  }, [token, selectedSubject]);

  // Buscador de Debates en tiempo real por palabra clave
  const filteredThreads = useMemo(() => {
    if (!searchTerm.trim()) return threads;
    const term = searchTerm.toLowerCase();
    return threads.filter((t) => {
      const titleMatch = t.title?.toLowerCase().includes(term);
      const bodyMatch = t.body?.toLowerCase().includes(term);
      const authorMatch = (t.author_name || t.user_name || '').toLowerCase().includes(term);
      const subjectMatch = (t.subject_name || '').toLowerCase().includes(term);
      return titleMatch || bodyMatch || authorMatch || subjectMatch;
    });
  }, [threads, searchTerm]);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
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

      {/* Barra de Búsqueda Rápida y Selector de Materias */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {/* Buscador por palabras clave */}
        <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Buscar preguntas por tema, contenido o autor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '14px' }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Selector de Materia */}
        <div style={{ width: '280px' }}>
          <select
            className="form-input"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">📚 Todas las materias</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name} (Semestre {sub.semester})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Indicador de resultados de búsqueda */}
      {searchTerm && (
        <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Resultados encontrados para &quot;<strong>{searchTerm}</strong>&quot;: <strong>{filteredThreads.length}</strong> debate(s)
        </div>
      )}

      {/* Listado de Hilos */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-secondary)' }}>
          ⏳ Cargando debates del foro...
        </div>
      ) : filteredThreads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--sidebar-bg)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>💡</div>
          <h3 style={{ color: '#fff', margin: '0 0 6px' }}>
            {searchTerm ? 'No se encontraron resultados' : 'No hay debates activos'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            {searchTerm
              ? 'Intenta buscar con otros términos o limpia la barra de búsqueda.'
              : 'Inicia una nueva pregunta o discusión para interactuar con tus compañeros.'}
          </p>
        </div>
      ) : (
        <div>
          {filteredThreads.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} onRefresh={loadForumData} />
          ))}
        </div>
      )}

      {/* Modal para crear tema */}
      {showNewThreadModal && (
        <NewThreadModal
          subjects={subjects}
          onClose={() => setShowNewThreadModal(false)}
          onThreadCreated={loadForumData}
        />
      )}
    </div>
  );
}
