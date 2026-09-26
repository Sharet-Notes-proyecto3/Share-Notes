// =============================================================================
// MODIFICACIÓN 2 — COMPONENTE: TARJETA DE APUNTE UNIVERSITARIO
// Responsable: Integrante 2 (Apuntes, Archivos, Visor & QR)
// =============================================================================

import { useAuth } from '../../context/AuthContext';
import { notesService } from '../../services/notes.service';
import VerifiedBadge from '../teacher/VerifiedBadge';
import NoteVerifyButton from '../teacher/NoteVerifyButton';
import ContentModerateButton from '../moderator/ContentModerateButton';

export default function NoteCard({ note, onOpenQR, onOpenPreview, onDeleteNote, onVerifiedNote }) {
  const { user, token, isModerator } = useAuth();

  const isPDF =
    note.original_name?.toLowerCase().endsWith('.pdf') ||
    note.mimetype === 'application/pdf' ||
    note.file_path?.toLowerCase().endsWith('.pdf');

  const uploaderName = note.uploader_name || note.user_name || 'Compañero';

  // Verificar permisos de eliminación: si es el dueño del apunte o es moderador/admin
  const canDelete =
    isModerator ||
    (user && (user.id === note.uploader_id || user.email === uploaderName || user.name === uploaderName));

  const handleDownloadDirect = async () => {
    try {
      const blob = await notesService.getNoteBlob(token, note.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = note.original_name || note.title || 'apunte';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error al descargar el archivo protegido: ' + err.message);
    }
  };

  return (
    <div
      className="note-card"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '14px',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        boxShadow: 'var(--card-shadow)',
        position: 'relative',
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'var(--primary-bg)',
                border: '1px solid var(--primary-border)',
                color: 'var(--color-info-text)',
                fontWeight: '600',
              }}
            >
              📖 {note.subject_name || 'Materia General'}
            </span>
            {Boolean(note.verified) && <VerifiedBadge />}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: isPDF ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
                border: `1px solid ${isPDF ? 'var(--color-danger-border)' : 'var(--color-success-border)'}`,
                color: isPDF ? 'var(--color-danger-text)' : 'var(--color-success-text)',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {isPDF ? '📄 PDF' : '🖼️ Imagen'}
            </span>

            {canDelete && (
              <button
                onClick={() => onDeleteNote(note)}
                style={{
                  background: 'var(--color-danger-bg)',
                  border: '1px solid var(--color-danger-border)',
                  color: 'var(--color-danger-text)',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
                title="Eliminar apunte"
              >
                🗑️
              </button>
            )}
          </div>
        </div>

        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: 'var(--text-primary)', lineHeight: 1.3 }}>
          {note.title}
        </h3>

        {note.description && (
          <p
            style={{
              margin: '0 0 12px 0',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {note.description}
          </p>
        )}

        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
          👤 <strong>Subido por:</strong> {uploaderName}
        </div>
      </div>

      {/* Botones de Acción */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
        {/* Botón Principal: Vista Previa Integrada */}
        <button
          onClick={() => onOpenPreview(note)}
          className="primary-btn"
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          👁️ Vista Previa
        </button>

        {/* Botón de verificación para docente asignado */}
        <NoteVerifyButton note={note} onVerified={onVerifiedNote} />

        {/* Botón de moderación para moderadores y administradores */}
        <ContentModerateButton contentType="note" contentId={note.id} currentStatus={note.moderation_status || 'visible'} />

        {/* Botones Secundarios: Descarga Directa y QR */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleDownloadDirect}
            style={{
              flex: 1,
              textAlign: 'center',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'background 0.2s',
            }}
          >
            ⬇️ Descargar
          </button>

          <button
            onClick={() => onOpenQR(note)}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '6px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'background 0.2s',
            }}
            title="Ver código QR para móvil"
          >
            📱 QR
          </button>
        </div>
      </div>
    </div>
  );
}
