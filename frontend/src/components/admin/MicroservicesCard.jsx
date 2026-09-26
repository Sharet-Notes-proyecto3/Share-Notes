import { useEffect, useState } from 'react';
import { adminService } from '../../services/admin.service';
import { useAuth } from '../../context/AuthContext';

export default function MicroservicesCard() {
  const { token } = useAuth();
  const [status, setStatus] = useState({
    msPdf: false,
    msEmail: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchStatus = async () => {
      try {
        setLoading(true);
        const res = await adminService.getMicroservicesStatus(token);
        const payload = res?.services || res?.data || {};

        if (isMounted) {
          setStatus({
            msPdf: String(payload['ms-pdf'] || payload.msPdf || '').includes('🟢') || payload['ms-pdf'] === 'activo' || payload.msPdf === true,
            msEmail: String(payload['ms-email'] || payload.msEmail || '').includes('🟢') || payload['ms-email'] === 'activo' || payload.msEmail === true,
          });
        }
      } catch (err) {
        console.error('Error consultando microservicios:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (token) fetchStatus();
    return () => { isMounted = false; };
  }, [token]);

  return (
    <div
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '18px 20px',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Monitoreo en vivo
          </div>
          <h3 style={{ margin: '6px 0 0', color: 'var(--text-primary)', fontSize: '20px' }}>Microservicios</h3>
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '999px',
            background: loading ? 'var(--bg-elevated)' : 'var(--color-success-bg)',
            border: `1px solid ${loading ? 'var(--border-color)' : 'var(--color-success-border)'}`,
            color: loading ? 'var(--text-secondary)' : 'var(--color-success-text)',
            fontSize: '12px',
            fontWeight: 700,
          }}
        >
          {loading ? '⏳ Verificando' : '🟢 En línea'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>MS-PDF</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: status.msPdf ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
            {status.msPdf ? 'Activo' : 'Inactivo'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>Puerto 3002</div>
        </div>

        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>MS-Email</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: status.msEmail ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
            {status.msEmail ? 'Activo' : 'Inactivo'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>Puerto 3001</div>
        </div>
      </div>
    </div>
  );
}
