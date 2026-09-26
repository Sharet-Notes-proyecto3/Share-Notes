// =============================================================================
// MODIFICACIÓN 1 — COMPONENTE: ONBOARDING ACADÉMICO (NUEVO)
// Responsable: Integrante 1 (Autenticación, Sesión y Perfil)
// Se dispara automáticamente en el primer inicio de sesión del estudiante.
// =============================================================================

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth.service';

const SEMESTRES = Array.from({ length: 10 }, (_, i) => i + 1);

export default function OnboardingModal() {
  const { user, token, completeOnboarding } = useAuth();

  const [careers, setCareers] = useState([]);
  const [loadingCareers, setLoadingCareers] = useState(true);
  const [careerId, setCareerId] = useState('');
  const [semester, setSemester] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isActive = true;
    authService.getCareers(token)
      .then((res) => {
        if (isActive) setCareers(Array.isArray(res) ? res : res.data || []);
      })
      .catch((err) => {
        console.error('Error al cargar carreras:', err);
        if (isActive) setError('No se pudieron cargar las carreras disponibles.');
      })
      .finally(() => {
        if (isActive) setLoadingCareers(false);
      });
    return () => { isActive = false; };
  }, [token]);

  if (!user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!careerId || !semester) {
      setError('Selecciona tu carrera y tu semestre para continuar.');
      return;
    }

    try {
      setSaving(true);
      await completeOnboarding({ careerId: Number(careerId), semester: Number(semester) });
    } catch (err) {
      setError('No se pudo guardar tu información: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

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
        zIndex: 1200,
        padding: '20px',
      }}
      // Sin onClick de cierre: el onboarding es obligatorio.
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '18px',
          padding: '28px 26px',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '34px', marginBottom: '8px' }}>🎓</div>
          <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '19px' }}>
            ¡Bienvenido/a, {user.name || 'Estudiante'}!
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Cuéntanos tu carrera y semestre para personalizar tus apuntes y foros.
          </p>
        </div>

        {/* Carrera */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>
            Carrera
          </label>
          <select
            value={careerId}
            onChange={(e) => setCareerId(e.target.value)}
            disabled={loadingCareers}
            style={{
              width: '100%',
              padding: '10px 8px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              fontSize: '13px',
            }}
          >
            <option value="">
              {loadingCareers ? 'Cargando carreras...' : 'Selecciona tu carrera...'}
            </option>
            {careers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Semestre */}
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>
            Semestre actual
          </label>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 8px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              fontSize: '13px',
            }}
          >
            <option value="">Selecciona tu semestre...</option>
            {SEMESTRES.map((s) => (
              <option key={s} value={s}>{s}° semestre</option>
            ))}
          </select>
        </div>

        {error && (
          <p style={{ color: 'var(--color-danger-text)', fontSize: '12px', margin: '8px 0 0' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          style={{
            width: '100%',
            marginTop: '18px',
            padding: '11px',
            background: 'var(--primary-color)',
            border: 'none',
            borderRadius: '10px',
            color: 'var(--text-inverse)',
            fontWeight: '700',
            fontSize: '13.5px',
            cursor: saving ? 'default' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Guardando...' : 'Guardar y continuar'}
        </button>
      </form>
    </div>
  );
}