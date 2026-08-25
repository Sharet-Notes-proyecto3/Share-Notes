// =============================================================================
// MODIFICACIÓN 2 — COMPONENTE: VISOR / PREVISUALIZADOR INTEGRADO DE APUNTES
// Responsable: Integrante 2 (Apuntes, Visor In-App & Multimedia)
// =============================================================================

import { useState } from 'react';
import { API_BASE_URL } from '../../services/api';

export default function PreviewModal({ note, onClose }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);

  if (!note) return null;

  const fileUrl = note.file_path
    ? `${API_BASE_URL.replace('/api', '')}/${note.file_path}`
    : '#';

  const isPDF = note.file_path?.toLowerCase().endsWith('.pdf');

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px',
      }}
    >
      <div
        style={{
          background: 'var(--sidebar-bg, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: '16px',
          width: '95%',
          maxWidth: '1000px',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
      >
        {/* Barra Superior del Visor */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-color, #334155)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
            <span style={{ fontSize: '24px' }}>{isPDF ? '📄' : '🖼️'}</span>
            <div>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {note.title}
              </h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px', fontSize: '12px', color: 'var(--text-secondary, #94a3b8)' }}>
                <span style={{ color: '#60a5fa' }}>📖 {note.subject_name || 'Materia'}</span>
                <span>•</span>
                <span>👤 {note.user_name || 'Compañero'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Controles de Imagen */}
            {!isPDF && (
              <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.06)', padding: '4px', borderRadius: '8px' }}>
                <button
                  onClick={handleZoomIn}
                  style={controlBtnStyle}
                  title="Acercar (Zoom In)"
                >
                  🔍+
                </button>
                <button
                  onClick={handleZoomOut}
                  style={controlBtnStyle}
                  title="Alejar (Zoom Out)"
                >
                  🔍-
                </button>
                <button
                  onClick={handleRotate}
                  style={controlBtnStyle}
                  title="Rotar 90°"
                >
                  🔄
                </button>
                <button
                  onClick={handleReset}
                  style={controlBtnStyle}
                  title="Restablecer vista"
                >
                  ↺
                </button>
              </div>
            )}

            {/* Descarga directa */}
            <a
              href={fileUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'var(--primary-color, #3b82f6)',
                color: '#fff',
                padding: '8px 14px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              ⬇️ Descargar
            </a>

            {/* Cerrar modal */}
            <button
              onClick={onClose}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
              title="Cerrar visor"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Área de Visualización */}
        <div
          style={{
            flex: 1,
            background: '#0b0f19',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'auto',
            position: 'relative',
            padding: '12px',
          }}
        >
          {loading && (
            <div
              style={{
                position: 'absolute',
                color: '#60a5fa',
                fontSize: '14px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div style={{ fontSize: '28px' }}>⏳</div>
              Cargando visor del apunte...
            </div>
          )}

          {isPDF ? (
            <iframe
              src={fileUrl}
              title={`Visor PDF - ${note.title}`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: '8px',
              }}
              onLoad={() => setLoading(false)}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'auto',
              }}
            >
              <img
                src={fileUrl}
                alt={note.title}
                onLoad={() => setLoading(false)}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                  borderRadius: '6px',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const controlBtnStyle = {
  background: 'transparent',
  border: 'none',
  color: '#fff',
  padding: '6px 8px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '13px',
};
