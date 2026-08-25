// =============================================================================
// MODIFICACIÓN 2 — COMPONENTE: TARJETA DE APUNTE UNIVERSITARIO
// Responsable: Integrante 2 (Apuntes, Archivos, Visor & QR)
// =============================================================================

import { API_BASE_URL } from '../../services/api';

export default function NoteCard({ note, onOpenQR, onOpenPreview }) {
  // Construir la URL completa del archivo alojado en backend/uploads/
  const fileUrl = note.file_path 
    ? `${API_BASE_URL.replace('/api', '')}/${note.file_path}`
    : '#';

  const isPDF = note.file_path?.toLowerCase().endsWith('.pdf');

  return (
    <div
      style={{
        background: 'var(--sidebar-bg, #1e293b)',
        border: '1px solid var(--border-color, #334155)',
        borderRadius: '14px',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <span
            style={{
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'rgba(96, 165, 250, 0.15)',
              color: '#60a5fa',
              fontWeight: '600',
            }}
          >
            📖 {note.subject_name || 'Materia General'}
          </span>
          <span
            style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '6px',
              background: isPDF ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: isPDF ? '#f87171' : '#34d399',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {isPDF ? '📄 PDF' : '🖼️ Imagen'}
          </span>
        </div>

        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#fff', lineHeight: 1.3 }}>
          {note.title}
        </h3>

        {note.description && (
          <p
            style={{
              margin: '0 0 12px 0',
              fontSize: '13px',
              color: 'var(--text-secondary, #94a3b8)',
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

        <div style={{ fontSize: '12px', color: 'var(--text-secondary, #94a3b8)', marginBottom: '14px' }}>
          👤 <strong>Subido por:</strong> {note.user_name || 'Compañero'}
        </div>
      </div>

      {/* Botones de Acción */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-color, #334155)', paddingTop: '12px' }}>
        {/* Botón Principal: Vista Previa Integrada */}
        <button
          onClick={() => onOpenPreview(note)}
          style={{
            width: '100%',
            background: 'var(--primary-color, #3b82f6)',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'background 0.2s ease',
          }}
        >
          👁️ Vista Previa
        </button>

        {/* Botones Secundarios: Descarga Directa y QR */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <a
            href={fileUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-color, #334155)',
              color: '#fff',
              padding: '6px 10px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '12px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            ⬇️ Descargar
          </a>

          <button
            onClick={() => onOpenQR(note)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-color, #334155)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
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
