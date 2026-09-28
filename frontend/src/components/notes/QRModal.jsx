// =============================================================================
// MODIFICACIÓN 2 — COMPONENTE: MODAL DE CÓDIGO QR
// Responsable: Integrante 2 (Apuntes & QR)
// =============================================================================

import { useEffect, useState } from 'react';
import { notesService } from '../../services/notes.service';
import { useAuth } from '../../context/AuthContext';

export default function QRModal({ note, onClose }) {
  const { token } = useAuth();
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const downloadQr = async () => {
    if (!qrDataUrl) return;
    try {
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `QR_Apunte_${note.id || 'sharenotes'}.png`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      const anchor = document.createElement('a');
      anchor.href = qrDataUrl;
      anchor.download = `QR_Apunte_${note.id || 'sharenotes'}.png`;
      anchor.click();
    }
  };

  useEffect(() => {
    async function loadQR() {
      if (!note) return;
      try {
        setLoading(true);
        const res = await notesService.getNoteQR(token, note.id);
        if (res.qrCodeDataUrl || res.qr) {
          setQrDataUrl(res.qrCodeDataUrl || res.qr);
        } else {
          setError('No se pudo generar el código QR');
        }
      } catch (err) {
        setError(err.message || 'Error al obtener el código QR');
      } finally {
        setLoading(false);
      }
    }
    loadQR();
  }, [note, token]);

  if (!note) return null;

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
          padding: '24px',
          maxWidth: '360px',
          width: '100%',
          textAlign: 'center',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <h3 style={{ margin: '0 0 4px', color: 'var(--text-primary)', fontSize: '18px' }}>📱 Código QR del Apunte</h3>
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{note.title}</p>

        {loading && <p style={{ color: 'var(--primary-color)', margin: '30px 0' }}>⏳ Generando código QR...</p>}

        {error && (
          <div style={{ color: 'var(--color-danger-text)', background: 'var(--color-danger-bg)', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            ⚠️ {error}
          </div>
        )}

        {qrDataUrl && (
          <>
            <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', display: 'inline-block', marginBottom: '16px' }}>
              <img id="qr-img-element" src={qrDataUrl} alt="Código QR del apunte" style={{ width: '200px', height: '200px', display: 'block' }} />
            </div>

            <button
              onClick={downloadQr}
              style={{
                width: '100%',
                padding: '9px',
                background: 'var(--primary-bg)',
                border: '1px solid var(--primary-border)',
                borderRadius: '8px',
                color: 'var(--color-info-text)',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              📥 Descargar Imagen QR (.png)
            </button>
          </>
        )}

        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
          Escanea este código con la cámara de tu teléfono para acceder directamente al apunte.
        </p>

        <button
          onClick={onClose}
          className="primary-btn"
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
