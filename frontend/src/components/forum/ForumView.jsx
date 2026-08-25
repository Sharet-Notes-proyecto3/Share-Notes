// =============================================================================
// MODIFICACIÓN 3 — COMPONENTE: VISTA PRINCIPAL DEL FORO ACADÉMICO
// Responsable: Integrante 3 (Foro, Hilos & Comunidad)
// =============================================================================

import React, { useState, useEffect } from 'react';
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
  }, [token, selectedSubject]);

  return (
    <div style={{ padding: '24px' }}>
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

      {/* Filtro por materia */}
      <div style={{ marginBottom: '20px', maxWidth: '300px' }}>
        <select
          className="form-input"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          <option value="">Todas las materias</option>
          {subjects.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name} (Semestre {sub.semester})
            </option>
          ))}
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
      ) : (
        <div>
          {threads.map((thread) => (
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
