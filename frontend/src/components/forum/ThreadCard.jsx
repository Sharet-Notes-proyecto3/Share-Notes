// =============================================================================
// MODIFICACIÓN 3 — COMPONENTE: HILO DE DISCUSIÓN, RESPUESTAS, VOTACIÓN & REPORTES
// Responsable: Integrante 3 (Camila — Foro Académico, Respuestas y Reportes)
// =============================================================================

import { useState } from 'react';
import { forumService } from '../../services/forum.service';
import { useAuth } from '../../context/AuthContext';
import ReportModal from './ReportModal';

export default function ThreadCard({ thread, onRefresh }) {
  const { token, user, isAdmin, isModerator } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [replies, setReplies] = useState(thread.replies || []);
  const [newReply, setNewReply] = useState('');
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  // Votación reactiva tipo Me gusta (Toggle dar / quitar voto)
  const [votedReplyIds, setVotedReplyIds] = useState(new Set());
  
  // Mención / Respuesta directa a un compañero (Estilo Facebook)
  const [replyingTo, setReplyingTo] = useState(null);

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

  const handleStartReplyToUser = (authorName) => {
    setReplyingTo(authorName);
    if (!expanded) setExpanded(true);
  };

  const handleAddReply = async (e) => {
    e.preventDefault();
    const rawText = newReply.trim();
    if (!rawText) return;

    // Si se está respondiendo directamente a alguien, adjuntar la mención tipo @Nombre
    const replyText = replyingTo && !rawText.startsWith(`@${replyingTo}`)
      ? `@${replyingTo} ${rawText}`
      : rawText;

    try {
      setSubmittingReply(true);
      const res = await forumService.addReply(token, thread.id, replyText);
      setNewReply('');
      setReplyingTo(null);

      const fallbackReply = {
        id: res?.id || Date.now(),
        body: replyText,
        author_name: user?.name || 'Estudiante',
        author_id: user?.id,
        upvotes: 0,
        created_at: new Date().toISOString(),
      };

      try {
        const updated = await forumService.getThreadDetails(token, thread.id);
        const fetchedReplies = updated.replies || updated.data?.replies;
        if (Array.isArray(fetchedReplies)) {
          setReplies(fetchedReplies);
        } else {
          setReplies((prev) => [...prev, fallbackReply]);
        }
      } catch {
        setReplies((prev) => [...prev, fallbackReply]);
      }

      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Error al responder: ' + (err.message || 'Ocurrió un error al enviar la respuesta'));
    } finally {
      setSubmittingReply(false);
    }
  };

  // Votación reactiva con Toggle (Dar o Quitar "Me gusta / Útil")
  const handleVote = async (replyId) => {
    const isVoted = votedReplyIds.has(replyId);
    
    // Alternar voto en el estado local de forma reactiva instantánea
    setVotedReplyIds((prev) => {
      const next = new Set(prev);
      if (isVoted) {
        next.delete(replyId);
      } else {
        next.add(replyId);
      }
      return next;
    });

    setReplies((prevReplies) =>
      prevReplies.map((r) =>
        r.id === replyId
          ? { ...r, upvotes: Math.max(0, (r.upvotes || 0) + (isVoted ? -1 : 1)) }
          : r
      )
    );

    try {
      await forumService.voteReply(token, replyId, isVoted ? 'unvote' : 'vote');
    } catch (err) {
      console.warn('Backend vote update fallback:', err.message);
    }
  };

  // Eliminación de comentario/respuesta
  const handleDeleteReply = async (replyId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este comentario?')) return;

    // Actualización reactiva instantánea en la interfaz
    setReplies((prev) => prev.filter((r) => r.id !== replyId));

    try {
      await forumService.deleteReply(token, replyId);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.warn('Error al eliminar comentario:', err.message);
    }
  };

  // Eliminación de tema/hilo completo
  const handleDeleteThread = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este debate completo?')) return;

    try {
      await forumService.deleteThread(token, thread.id);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Error al eliminar el debate: ' + (err.message || 'Ocurrió un error'));
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

  // Formateador visual para renderizar las menciones estilo @Nombre destacadas
  const renderReplyBody = (text) => {
    if (!text) return null;
    const mentionRegex = /^(@[^\s]+)\s+(.*)/;
    const match = text.match(mentionRegex);
    if (match) {
      return (
        <span>
          <span
            style={{
              background: 'rgba(96, 165, 250, 0.15)',
              color: '#60a5fa',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: '600',
              marginRight: '6px',
              fontSize: '12px',
            }}
          >
            {match[1]}
          </span>
          {match[2]}
        </span>
      );
    }
    return text;
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
      {/* Encabezado con materia, contador, reportar y borrar hilo */}
      {(() => {
        const isThreadCreator = Boolean(
          user &&
          ((thread.author_id && user.id && Number(thread.author_id) === Number(user.id)) ||
           (thread.author_name && user.name && thread.author_name.trim().toLowerCase() === user.name.trim().toLowerCase()) ||
           (thread.user_name && user.name && thread.user_name.trim().toLowerCase() === user.name.trim().toLowerCase()))
        );
        const canDeleteThread = isThreadCreator || isAdmin;

        return (
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {canDeleteThread && (
                <button
                  onClick={handleDeleteThread}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#f87171',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: 0.85,
                  }}
                  title="Borrar este debate"
                >
                  🗑️ Borrar
                </button>
              )}

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
          </div>
        );
      })()}

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
                const authorName = reply.author_name || reply.user_name || 'Compañero';
                
                // Determinación de visibilidad de botón Borrar:
                // 1. El creador del debate ve "Borrar" en su debate y en todas sus respuestas
                // 2. Cada usuario ve "Borrar" únicamente en sus propias respuestas
                // 3. Un usuario NO ve "Borrar" en respuestas ajenas si no es el creador del debate
                const isThreadCreator = Boolean(
                  user &&
                  ((thread.author_id && user.id && Number(thread.author_id) === Number(user.id)) ||
                   (thread.author_name && user.name && thread.author_name.trim().toLowerCase() === user.name.trim().toLowerCase()) ||
                   (thread.user_name && user.name && thread.user_name.trim().toLowerCase() === user.name.trim().toLowerCase()))
                );
                const isReplyCreator = Boolean(
                  user &&
                  ((reply.author_id && user.id && Number(reply.author_id) === Number(user.id)) ||
                   (reply.author_name && user.name && reply.author_name.trim().toLowerCase() === user.name.trim().toLowerCase()) ||
                   (reply.user_name && user.name && reply.user_name.trim().toLowerCase() === user.name.trim().toLowerCase()))
                );
                const canDeleteReply = isThreadCreator || isReplyCreator || isAdmin;

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
                        👤 {authorName}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Botón Responder al Compañero (Estilo Facebook) */}
                        <button
                          onClick={() => handleStartReplyToUser(authorName)}
                          style={{
                            background: 'rgba(96, 165, 250, 0.1)',
                            border: '1px solid rgba(96, 165, 250, 0.3)',
                            borderRadius: '6px',
                            color: '#60a5fa',
                            padding: '4px 8px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title={`Responder directamente a ${authorName}`}
                        >
                          ↩️ Responder
                        </button>

                        {/* Botón "Útil" con Toggle (Dar / Quitar Me Gusta) */}
                        <button
                          onClick={() => handleVote(reply.id)}
                          style={{
                            background: isVoted ? 'rgba(34, 197, 94, 0.25)' : 'rgba(34, 197, 94, 0.1)',
                            border: `1px solid ${isVoted ? '#22c55e' : 'rgba(34, 197, 94, 0.3)'}`,
                            borderRadius: '6px',
                            color: isVoted ? '#4ade80' : '#86efac',
                            padding: '4px 10px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: isVoted ? 'bold' : 'normal',
                            transition: 'all 0.15s ease',
                          }}
                          title={isVoted ? 'Quitar voto útil (Me gusta)' : 'Marcar como respuesta útil (Me gusta)'}
                        >
                          {isVoted ? '✅ Útil' : '👍 Útil'} ({reply.upvotes || 0})
                        </button>

                        {/* Botón Borrar Respuesta */}
                        {canDeleteReply && (
                          <button
                            onClick={() => handleDeleteReply(reply.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#f87171',
                              cursor: 'pointer',
                              fontSize: '11px',
                              padding: '2px 6px',
                              opacity: 0.85,
                            }}
                            title="Borrar este comentario"
                          >
                            🗑️ Borrar
                          </button>
                        )}

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
                      {renderReplyBody(reply.body || reply.content)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Banner indicador si se está respondiendo a alguien en particular */}
          {replyingTo && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(96, 165, 250, 0.12)',
                border: '1px solid rgba(96, 165, 250, 0.3)',
                borderRadius: '6px',
                padding: '6px 12px',
                marginBottom: '8px',
                fontSize: '12px',
                color: '#93c5fd',
              }}
            >
              <span>
                💬 Respondiendo a <strong>@{replyingTo}</strong>
              </span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#93c5fd',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
                title="Cancelar respuesta directa"
              >
                ✕
              </button>
            </div>
          )}

          {/* Formulario para Responder en tiempo real */}
          <form onSubmit={handleAddReply} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder={replyingTo ? `Respondiendo a @${replyingTo}...` : 'Escribe tu respuesta o aporte académico...'}
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
