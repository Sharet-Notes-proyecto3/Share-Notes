// =============================================================================
// MODIFICACIÓN 1 — COMPONENTE: ONBOARDING ACADÉMICO (ACTUALIZADO)
// Responsable: Integrante 1 (Autenticación, Sesión y Perfil)
// Se dispara automáticamente en el primer inicio de sesión del estudiante
// si no cuenta con tipo de programa o semestre configurado.
// =============================================================================

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth.service';

export default function OnboardingModal() {
  const { user, token, completeOnboarding } = useAuth();

  const [programType, setProgramType] = useState('');
  const [semester, setSemester] = useState('');
  const [careerId, setCareerId] = useState('');
  const [careers, setCareers] = useState([]);
  const [loadingCareers, setLoadingCareers] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Opciones dinámicas de semestre:
  // - Tecnólogo: 1 a 6
  // - Ingeniería: 7 a 10
  const semesterOptions = useMemo(() => {
    if (programType === 'tecnologo') {
      return [1, 2, 3, 4, 5, 6];
    }
    if (programType === 'ingenieria') {
      return [7, 8, 9, 10];
    }
    return [];
  }, [programType]);

  const handleProgramTypeChange = (e) => {
    const nextType = e.target.value;
    setProgramType(nextType);
    setSemester(''); // Resetear semestre si cambia el programa
  };

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

    if (!programType) {
      setError('Por favor selecciona tu tipo de programa académico.');
      return;
    }

    if (!semester) {
      setError('Por favor selecciona tu semestre actual.');
      return;
    }

    try {
      setSaving(true);
      await completeOnboarding({
        careerId: careerId ? Number(careerId) : null,
        semester: Number(semester),
        programType,
      });
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
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '18px',
          padding: '28px 26px',
          maxWidth: '440px',
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
            Completa tu perfil académico para personalizar tus apuntes y materias.
          </p>
        </div>

        {/* Tipo de Programa */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '600' }}>
            Tipo de programa académico *
          </label>
          <select
            value={programType}
            onChange={handleProgramTypeChange}
            required
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
            <option value="">Selecciona tu programa...</option>
            <option value="tecnologo">Tecnólogo (Semestres 1 a 6)</option>
            <option value="ingenieria">Ingeniería (Semestres 7 a 10)</option>
          </select>
        </div>

        {/* Semestre (Dinámico según programa) */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '600' }}>
            Semestre actual *
          </label>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            disabled={!programType}
            required
            style={{
              width: '100%',
              padding: '10px 8px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              opacity: !programType ? 0.6 : 1,
            }}
          >
            <option value="">
              {!programType
                ? 'Selecciona primero el tipo de programa'
                : 'Selecciona tu semestre...'}
            </option>
            {semesterOptions.map((s) => (
              <option key={s} value={s}>{s}° semestre</option>
            ))}
          </select>
        </div>

        {/* Carrera (Opcional) */}
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '600' }}>
            Carrera (opcional)
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
              {loadingCareers ? 'Cargando carreras...' : 'Selecciona tu carrera (opcional)...'}
            </option>
            {careers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
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