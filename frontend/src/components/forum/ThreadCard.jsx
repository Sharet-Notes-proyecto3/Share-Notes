// =============================================================================
// MODIFICACIÓN 3 — COMPONENTE: HILO DE DISCUSIÓN Y RESPUESTAS
// Responsable: Integrante 3 (Foro, Respuestas & Votación)
// =============================================================================

import { useState } from 'react';
import { forumService } from '../../services/forum.service';
import { useAuth } from '../../context/AuthContext';

export default function ThreadCard({ thread, onRefresh }) {
  const { token } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [replies, setReplies] = useState(thread.replies || []);
  const [newReply, setNewReply] = useState('');
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  const toggleExpand = async () => {
    if (!expanded) {
      try {
        setLoadingReplies(true);
        const data = await forumService.getThreadDetails(token, thread.id);
        setReplies(data.replies || []);
      } catch (err) {
        console.error('Error al cargar respuestas:', err);
      } finally {
        setLoadingReplies(false);
      }
    }
    setExpanded(!expanded);
  };

  const handleAddReply = async (e) => {
    e.preventDefault();
    if (!newReply.trim()) return;

    try {
      setSubmittingReply(true);
      await forumService.addReply(token, thread.id, newReply);
      setNewReply('');
      const updated = await forumService.getThreadDetails(token, thread.id);
      setReplies(updated.replies || []);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Error al responder: ' + err.message);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleVote = async (replyId) => {
    try {
      await forumService.voteReply(token, replyId);
      const updated = await forumService.getThreadDetails(token, thread.id);
      setReplies(updated.replies || []);
    } catch (err) {
      alert('Error al votar: ' + err.message);
    }
  };

  return (
    <div
      style={{
        background: 'var(--sidebar-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <span
          style={{
            fontSize: '11px',
            padding: '3px 8px',
            borderRadius: '6px',
            background: 'rgba(167, 139, 250, 0.15)',
            color: '#a78bfa',
            fontWeight: '600',
          }}
        >
          📖 {thread.subject_name || 'Materia General'}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          💬 {thread.reply_count || replies.length || 0} respuestas
        </span>
      </div>

      <h3 style={{ margin: '0 0 8px', color: '#fff', fontSize: '17px' }}>{thread.title}</h3>
      <p style={{ margin: '0 0 14px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
        {thread.body}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          👤 <strong>{thread.user_name || 'Compañero'}</strong>
        </span>

        <button
          onClick={toggleExpand}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#60a5fa',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
          }}
        >
          {expanded ? '▲ Ocultar Respuestas' : '▼ Ver Respuestas & Participar'}
        </button>
      </div>

      {/* Sección Expandida de Respuestas */}
      {expanded && (
        <div style={{ marginTop: '16px', borderTop: '1px dashed var(--border-color)', paddingTop: '16px' }}>
          {loadingReplies ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>⏳ Cargando respuestas...</p>
          ) : replies.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>
              Aún no hay respuestas. ¡Sé el primero en responder!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {replies.map((reply) => (
                <div
                  key={reply.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>
                      {reply.user_name || 'Compañero'}
                    </span>
                    <button
                      onClick={() => handleVote(reply.id)}
                      style={{
                        background: 'rgba(34, 197, 94, 0.1)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        borderRadius: '6px',
                        color: '#86efac',
                        padding: '4px 8px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title="Votar como respuesta útil"
                    >
                      👍 Útil ({reply.upvotes || 0})
                    </button>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {reply.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Formulario para Responder */}
          <form onSubmit={handleAddReply} style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <input
              type="text"
              placeholder="Escribe tu respuesta o aporte..."
              className="form-input"
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              disabled={submittingReply}
              className="primary-btn"
              style={{ padding: '0 16px', fontSize: '13px' }}
            >
              {submittingReply ? '...' : 'Responder'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
