// =============================================================================
// MODIFICACIÓN 2 — COMPONENTE: VISOR / PREVISUALIZADOR INTEGRADO DE APUNTES
// Responsable: Integrante 2 (Apuntes, Visor In-App & Blobs protegidos con JWT)
// =============================================================================

import { useState, useEffect } from 'react';
import { notesService } from '../../services/notes.service';
import { useAuth } from '../../context/AuthContext';

export default function PreviewModal({ note, onClose }) {
  const { token } = useAuth();
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const isPDF =
    note?.original_name?.toLowerCase().endsWith('.pdf') ||
    note?.mimetype === 'application/pdf' ||
    note?.file_path?.toLowerCase().endsWith('.pdf');

  useEffect(() => {
    let currentUrl = null;
    let isMounted = true;

    async function loadProtectedBlob() {
      if (!note || !token) return;
      try {
        setLoading(true);
        setError('');
        const blob = await notesService.getNoteBlob(token, note.id);
        if (isMounted && blob) {
          currentUrl = URL.createObjectURL(blob);
          setBlobUrl(currentUrl);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Error al cargar la previsualización protegida.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProtectedBlob();

    return () => {
      isMounted = false;
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [note, token]);

  if (!note) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = note.original_name || note.title || 'apunte';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--modal-backdrop)',
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
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          width: '95%',
          maxWidth: '1000px',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--card-shadow)',
          overflow: 'hidden',
        }}
      >
        {/* Barra Superior del Visor */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
            <span style={{ fontSize: '24px' }}>{isPDF ? '📄' : '🖼️'}</span>
            <div>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '16px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {note.title}
              </h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--primary-color)' }}>📖 {note.subject_name || 'Materia'}</span>
                <span>•</span>
                <span>👤 {note.uploader_name || 'Compañero'}</span>
                <span>•</span>
                <span style={{ color: 'var(--color-success-text)', fontWeight: '600' }}>🔒 Protegido JWT</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Controles de Imagen */}
            {!isPDF && blobUrl && (
              <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-elevated)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <button onClick={handleZoomIn} style={controlBtnStyle} title="Acercar (Zoom In)">🔍+</button>
                <button onClick={handleZoomOut} style={controlBtnStyle} title="Alejar (Zoom Out)">🔍-</button>
                <button onClick={handleRotate} style={controlBtnStyle} title="Rotar 90°">🔄</button>
                <button onClick={handleReset} style={controlBtnStyle} title="Restablecer vista">↺</button>
              </div>
            )}

            {/* Descarga protegida */}
            {blobUrl && (
              <button
                onClick={handleDownload}
                className="primary-btn"
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                ⬇️ Descargar
              </button>
            )}


            {/* Cerrar modal */}
            <button
              onClick={onClose}
              style={{
                background: 'var(--color-danger-bg)',
                border: '1px solid var(--color-danger-border)',
                color: 'var(--color-danger-text)',
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
            background: 'var(--bg-canvas)',
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
                color: 'var(--primary-color)',
                fontSize: '14px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '32px' }}>⏳</div>
              <span>Solicitando archivo binario protegido con token JWT...</span>
            </div>
          )}

          {error && (
            <div
              style={{
                color: 'var(--color-danger-text)',
                background: 'var(--color-danger-bg)',
                border: '1px solid var(--color-danger-border)',
                padding: '20px 30px',
                borderRadius: '12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️</div>
              <h4 style={{ margin: '0 0 6px', color: 'var(--text-primary)' }}>No se pudo cargar la vista previa</h4>
              <p style={{ margin: 0, fontSize: '13px' }}>{error}</p>
            </div>
          )}

          {!loading && !error && blobUrl && (
            isPDF ? (
              <iframe
                src={blobUrl}
                title={`Visor PDF - ${note.title}`}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '8px',
                }}
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
                  src={blobUrl}
                  alt={note.title}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s ease',
                    boxShadow: 'var(--card-shadow)',
                    borderRadius: '6px',
                  }}
                />
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

const controlBtnStyle = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-primary)',
  padding: '6px 8px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '13px',
};
