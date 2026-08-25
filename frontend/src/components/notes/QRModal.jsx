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
        backgroundColor: 'rgba(0,0,0,0.7)',
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
          background: 'var(--sidebar-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '360px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
        }}
      >
        <h3 style={{ margin: '0 0 4px', color: '#fff', fontSize: '18px' }}>📱 Código QR del Apunte</h3>
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{note.title}</p>

        {loading && <p style={{ color: '#60a5fa', margin: '30px 0' }}>⏳ Generando código QR...</p>}

        {error && (
          <div style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            ⚠️ {error}
          </div>
        )}

        {qrDataUrl && (
          <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', display: 'inline-block', marginBottom: '16px' }}>
            <img src={qrDataUrl} alt="Código QR del apunte" style={{ width: '200px', height: '200px', display: 'block' }} />
          </div>
        )}

        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
          Escanea este código con la cámara de tu teléfono para acceder directamente al apunte.
        </p>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '10px',
            background: 'var(--primary-color, #3b82f6)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
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
