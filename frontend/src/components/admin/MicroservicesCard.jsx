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
        background: 'var(--sidebar-bg, #1e293b)',
        border: '1px solid var(--border-color, #334155)',
        borderRadius: '12px',
        padding: '18px 20px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Monitoreo en vivo
          </div>
          <h3 style={{ margin: '6px 0 0', color: '#fff', fontSize: '20px' }}>Microservicios</h3>
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 10px',
            borderRadius: '999px',
            background: loading ? 'rgba(148, 163, 184, 0.12)' : 'rgba(34, 197, 94, 0.15)',
            color: loading ? '#cbd5e1' : '#86efac',
            fontSize: '12px',
            fontWeight: 700,
          }}
        >
          {loading ? '⏳ Verificando' : '🟢 En línea'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '14px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>MS-PDF</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: status.msPdf ? '#86efac' : '#fca5a5' }}>
            {status.msPdf ? 'Activo' : 'Inactivo'}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>Puerto 3002</div>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '14px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>MS-Email</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: status.msEmail ? '#86efac' : '#fca5a5' }}>
            {status.msEmail ? 'Activo' : 'Inactivo'}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>Puerto 3001</div>
        </div>
      </div>
    </div>
  );
}
