// =============================================================================
// MODIFICACIÓN 2 — COMPONENTE: TARJETA DE APUNTE UNIVERSITARIO
// Responsable: Integrante 2 (Apuntes, Archivos & QR)
// =============================================================================

import React from 'react';
import { API_BASE_URL } from '../../services/api';

export default function NoteCard({ note, onOpenQR }) {
  // Construir la URL completa del archivo alojado en backend/uploads/
  const fileUrl = note.file_path 
    ? `${API_BASE_URL.replace('/api', '')}/${note.file_path}`
    : '#';

  const isPDF = note.file_path?.toLowerCase().endsWith('.pdf');

  return (
    <div
      style={{
        background: 'var(--sidebar-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.2s ease, border-color 0.2s ease',
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '6px',
              background: 'rgba(96, 165, 250, 0.15)',
              color: '#60a5fa',
              fontWeight: '600',
            }}
          >
            📖 {note.subject_name || 'Materia General'}
          </span>
          <span style={{ fontSize: '18px' }}>{isPDF ? '📄' : '🖼️'}</span>
        </div>

        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#fff' }}>{note.title}</h3>
        {note.description && (
          <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {note.description}
          </p>
        )}

        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
          👤 <strong>Subido por:</strong> {note.user_name || 'Compañero'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1,
            textAlign: 'center',
            background: 'var(--primary-color, #3b82f6)',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          ⬇️ Ver / Descargar
        </a>

        <button
          onClick={() => onOpenQR(note)}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid var(--border-color)',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
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
  );
}
