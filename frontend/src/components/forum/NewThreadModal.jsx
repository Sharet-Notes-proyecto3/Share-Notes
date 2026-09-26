// =============================================================================
// MODIFICACIÓN 3 — COMPONENTE: MODAL PARA CREAR HILO DE DISCUSIÓN
// Responsable: Integrante 3 (Foro Académico & Comunidad)
// =============================================================================

import { useState } from 'react';
import { forumService } from '../../services/forum.service';
import { useAuth } from '../../context/AuthContext';

export default function NewThreadModal({ subjects, onClose, onThreadCreated }) {
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !body || !subjectId) {
      setError('Título, contenido y materia son requeridos.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await forumService.createThread(token, {
        title,
        body,
        subjectId,
      });

      onThreadCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al crear el tema en el foro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--modal-backdrop)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '28px',
          maxWidth: '520px',
          width: '100%',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '20px' }}>💬 Nuevo Tema de Discusión</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{ color: 'var(--color-danger-text)', background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Materia *</label>
            <select
              className="form-input"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              required
            >
              <option value="">Selecciona una materia...</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} (Semestre {sub.semester})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Título de la pregunta o tema *</label>
            <input
              type="text"
              placeholder="Ej. ¿Cómo implementar recursión de cola en C++?"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Detalles o explicación de la duda *</label>
            <textarea
              placeholder="Describe con claridad tu duda o contexto para que tus compañeros puedan ayudarte..."
              className="form-input"
              rows="4"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="primary-btn"
              style={{ flex: 2 }}
            >
              {loading ? 'Publicando...' : 'Publicar en el Foro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
