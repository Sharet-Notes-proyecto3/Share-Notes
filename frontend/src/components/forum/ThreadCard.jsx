// =============================================================================
// MODIFICACIÓN 3 — COMPONENTE: HILO DE DISCUSIÓN, RESPUESTAS, VOTACIÓN & REPORTES
// Responsable: Integrante 3 (Camila — Foro Académico, Respuestas y Reportes)
// =============================================================================

import { useState } from 'react';
import { forumService } from '../../services/forum.service';
import { useAuth } from '../../context/AuthContext';
import ReportModal from './ReportModal';

export default function ThreadCard({ thread, onRefresh }) {
  const { token } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [replies, setReplies] = useState(thread.replies || []);
  const [newReply, setNewReply] = useState('');
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  // Votación reactiva y bloqueo de voto repetido
  const [votedReplyIds, setVotedReplyIds] = useState(new Set());
  
  // Modal de reportes
  const [reportItem, setReportItem] = useState(null);

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
      alert('Error al responder: ' + (err.message || 'Ocurrió un error'));
    } finally {
      setSubmittingReply(false);
    }
  };

  // Votación reactiva con actualización visual inmediata y prevención de voto repetido
  const handleVote = async (replyId) => {
    if (votedReplyIds.has(replyId)) {
      alert('⚠️ Ya has votado por esta respuesta en esta sesión.');
      return;
    }

    // Actualización reactiva instantánea en la interfaz
    setVotedReplyIds((prev) => new Set(prev).add(replyId));
    setReplies((prevReplies) =>
      prevReplies.map((r) =>
        r.id === replyId ? { ...r, upvotes: (r.upvotes || 0) + 1 } : r
      )
    );

    try {
      await forumService.voteReply(token, replyId);
      // Sincronizar estado real con el backend
      const updated = await forumService.getThreadDetails(token, thread.id);
      setReplies(updated.replies || []);
    } catch (err) {
      console.warn('Backend vote update (fallback mock handler):', err.message);
    }
  };

  const handleOpenReportThread = () => {
    setReportItem({
      id: thread.id,
      type: 'thread',
      title: thread.title,
    });
  };

  const handleOpenReportReply = (reply) => {
    setReportItem({
      id: reply.id,
      type: 'reply',
      author: reply.author_name || reply.user_name || 'Compañero',
    });
  };

  return (
    <div
      style={{
        background: 'var(--sidebar-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '16px',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Encabezado con materia, contador y botón de reportar hilo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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

        <button
          onClick={handleOpenReportThread}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#ef4444',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            opacity: 0.8,
          }}
          title="Reportar este hilo de conversación"
        >
          🚩 Reportar
        </button>
      </div>

      <h3 style={{ margin: '0 0 8px', color: '#fff', fontSize: '17px' }}>{thread.title}</h3>
      <p style={{ margin: '0 0 14px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
        {thread.body}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          👤 Autor: <strong>{thread.author_name || thread.user_name || 'Compañero'}</strong>
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
              {replies.map((reply) => {
                const isVoted = votedReplyIds.has(reply.id);
                return (
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
                        👤 {reply.author_name || reply.user_name || 'Compañero'}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Botón "Útil" con Votación Reactiva e Inmediata */}
                        <button
                          onClick={() => handleVote(reply.id)}
                          disabled={isVoted}
                          style={{
                            background: isVoted ? 'rgba(34, 197, 94, 0.25)' : 'rgba(34, 197, 94, 0.1)',
                            border: `1px solid ${isVoted ? '#22c55e' : 'rgba(34, 197, 94, 0.3)'}`,
                            borderRadius: '6px',
                            color: isVoted ? '#4ade80' : '#86efac',
                            padding: '4px 10px',
                            fontSize: '11px',
                            cursor: isVoted ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: isVoted ? 'bold' : 'normal',
                          }}
                          title={isVoted ? 'Voto registrado' : 'Votar como respuesta útil'}
                        >
                          {isVoted ? '✅ Útil' : '👍 Útil'} ({reply.upvotes || 0})
                        </button>

                        {/* Botón Reportar Respuesta */}
                        <button
                          onClick={() => handleOpenReportReply(reply)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '11px',
                            padding: '2px 6px',
                            opacity: 0.75,
                          }}
                          title="Reportar comentario indebido"
                        >
                          🚩 Reportar
                        </button>
                      </div>
                    </div>

                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {reply.body || reply.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Formulario para Responder en tiempo real */}
          <form onSubmit={handleAddReply} style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <input
              type="text"
              placeholder="Escribe tu respuesta o aporte académico..."
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
              {submittingReply ? 'Enviando...' : '💬 Responder'}
            </button>
          </form>
        </div>
      )}

      {/* Modal de Reporte */}
      {reportItem && (
        <ReportModal
          item={reportItem}
          onClose={() => setReportItem(null)}
          onSuccess={() => {
            console.log('Reporte enviado satisfactoriamente');
          }}
        />
      )}
    </div>
  );
}
