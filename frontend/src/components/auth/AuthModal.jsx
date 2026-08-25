// =============================================================================
// MODIFICACIÓN 1 — COMPONENTE: FORMULARIO DE INGRESO Y REGISTRO
// Responsable: Integrante 1 (Autenticación & Perfil)
// =============================================================================

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AuthModal() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (password.length < 8) {
          throw new Error('La contraseña debe contener al menos 8 caracteres');
        }
        await register(name, email, password, role);
        setSuccess('¡Cuenta creada con éxito! Ahora puedes iniciar sesión.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      setError(err.message || 'Ocurrió un error en la autenticación');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div style={{ background: 'var(--sidebar-bg)', padding: '40px', borderRadius: '16px', width: '100%', maxWidth: '420px', border: '1px solid var(--border-color)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📚</div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '24px' }}>
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px' }}>
            Plataforma de Apuntes Universitarios ShareNotes
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid #22c55e', color: '#86efac', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLogin && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Nombre completo</label>
              <input
                type="text"
                placeholder="Ej. Ana Solarte"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Correo electrónico institucional</label>
            <input
              type="email"
              placeholder="tu_correo@uni.edu.co"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Contraseña (mínimo 8 caracteres)</label>
            <input
              type="password"
              placeholder="••••••••"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Rol académico</label>
              <select className="form-input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="student">🎓 Estudiante</option>
                <option value="teacher">👨‍🏫 Docente / Profesor</option>
                <option value="moderator">🛡️ Moderador</option>
              </select>
            </div>
          )}

          <button type="submit" className="primary-btn" disabled={submitting} style={{ marginTop: '8px' }}>
            {submitting ? 'Procesando...' : isLogin ? 'Ingresar a la Plataforma' : 'Registrarse'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
            style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}
          >
            {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión aquí'}
          </button>
        </div>
      </div>
    </div>
  );
}
