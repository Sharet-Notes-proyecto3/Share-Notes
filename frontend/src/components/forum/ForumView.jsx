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
  const [selectedSemester, setSelectedSemester] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewThreadModal, setShowNewThreadModal] = useState(false);

  const loadForumThreadsOnly = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const threadsRes = await forumService.getThreads(token, selectedSubject, selectedSemester, sortBy);
      setThreads(threadsRes.data || threadsRes || []);
    } catch (err) {
      console.error('Error al cargar datos del foro:', err);
    } finally {
      setLoading(false);
    }
  }, [token, selectedSubject, selectedSemester, sortBy]);

  // Cargar lista de materias solo UNA vez al montar
  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    notesService.getSubjects(token)
      .then((subjectsRes) => {
        if (isMounted) setSubjects(subjectsRes.data || subjectsRes || []);
      })
      .catch((err) => console.error('Error al cargar materias:', err));
    return () => { isMounted = false; };
  }, [token]);

  // Cargar hilos del foro al cambiar token o filtros (materia, semestre, orden)
  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    forumService.getThreads(token, selectedSubject, selectedSemester, sortBy)
      .then((threadsRes) => {
        if (isMounted) setThreads(threadsRes.data || threadsRes || []);
      })
      .catch((err) => console.error('Error al cargar datos del foro:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token, selectedSubject, selectedSemester, sortBy]);

  // Materias visibles en el selector: todas, o solo las del semestre elegido
  const visibleSubjects = useMemo(() => {
    if (!selectedSemester) return subjects;
    return subjects.filter((s) => String(s.semester) === String(selectedSemester));
  }, [subjects, selectedSemester]);

  const handleSemesterChange = (value) => {
    setSelectedSemester(value);
    // Si la materia elegida no pertenece al nuevo semestre, se limpia
    const current = subjects.find((s) => String(s.id) === String(selectedSubject));
    if (value && current && String(current.semester) !== String(value)) {
      setSelectedSubject('');
    }
  };

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
          <h2 style={{ margin: '0 0 4px', color: 'var(--text-primary)', fontSize: '24px' }}>💬 Foro Académico</h2>
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

        {/* Filtros: materia, semestre y orden */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'stretch' }}>
          <select
            className="form-input"
            style={{ width: '230px' }}
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">📚 Todas las materias</option>
            {visibleSubjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name} (Semestre {sub.semester})
              </option>
            ))}
          </select>

          <select
            className="form-input"
            style={{ width: '180px' }}
            value={selectedSemester}
            onChange={(e) => handleSemesterChange(e.target.value)}
          >
            <option value="">🎓 Todos los semestres</option>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                Semestre {n}
              </option>
            ))}
          </select>

          <select
            className="form-input"
            style={{ width: '200px' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="recent">🗂️ Todos los debates</option>
            <option value="week">🕒 Recientes (7 días)</option>
            <option value="answers">💬 Más respondidos</option>
          </select>

          {(searchTerm || selectedSubject || selectedSemester || sortBy !== 'recent') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedSubject('');
                setSelectedSemester('');
                setSortBy('recent');
              }}
              style={{
                padding: '0 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
              title="Limpiar filtros"
            >
              🧹 Limpiar
            </button>
          )}
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
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--card-bg)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>💡</div>
          <h3 style={{ color: 'var(--text-primary)', margin: '0 0 6px' }}>
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
            <ThreadCard key={thread.id} thread={thread} onRefresh={loadForumThreadsOnly} />
          ))}
        </div>
      )}

      {/* Modal para crear tema */}
      {showNewThreadModal && (
        <NewThreadModal
          subjects={subjects}
          onClose={() => setShowNewThreadModal(false)}
          onThreadCreated={loadForumThreadsOnly}
        />
      )}
    </div>
  );
}
