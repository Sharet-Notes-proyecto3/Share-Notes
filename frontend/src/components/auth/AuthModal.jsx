import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

export default function AuthModal() {
  const { login, register } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getPasswordStrength = () => {
    if (!password) return 0;

    let strength = 0;

    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    return strength;
  };

  const passwordStrength = getPasswordStrength();

  const getStrengthLabel = () => {
    switch (passwordStrength) {
      case 1:
        return 'Débil';
      case 2:
        return 'Regular';
      case 3:
        return 'Buena';
      case 4:
        return 'Excelente';
      default:
        return '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (isLogin) {
        await login(email.trim(), password);
      } else {
        if (name.trim().length < 3) {
          throw new Error('Ingresa tu nombre completo.');
        }

        if (password.length < 8) {
          throw new Error(
            'La contraseña debe contener al menos 8 caracteres.'
          );
        }

        await register(
          name.trim(),
          email.trim(),
          password,
          role
        );

        setSuccess(
          '¡Cuenta creada correctamente! Ahora puedes iniciar sesión.'
        );

        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      setError(
        err?.message || 'Ocurrió un error durante la autenticación.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const changeMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setPassword('');
  };

  return (
    <div className="auth-page">
      <div className="auth-background-glow auth-glow-one"></div>
      <div className="auth-background-glow auth-glow-two"></div>

      <div className="auth-container">
        {/* Panel informativo */}
        <section className="auth-showcase">
          <div className="showcase-logo">
            <div className="showcase-logo-icon">SN</div>
            <span>ShareNotes</span>
          </div>

          <div className="showcase-content">
            <span className="showcase-badge">
              Plataforma académica
            </span>

            <h1>
              Comparte,
              <br />
              aprende y
              <br />
              <span>crece.</span>
            </h1>

            <p>
              Un espacio para compartir apuntes, resolver dudas
              y conectar con tu comunidad académica.
            </p>

            <div className="showcase-features">
              <div className="showcase-feature">
                <span className="feature-icon">01</span>
                <div>
                  <strong>Apuntes organizados</strong>
                  <small>
                    Encuentra material académico fácilmente.
                  </small>
                </div>
              </div>

              <div className="showcase-feature">
                <span className="feature-icon">02</span>
                <div>
                  <strong>Comunidad académica</strong>
                  <small>
                    Comparte conocimientos con otros estudiantes.
                  </small>
                </div>
              </div>

              <div className="showcase-feature">
                <span className="feature-icon">03</span>
                <div>
                  <strong>Acceso seguro</strong>
                  <small>
                    Tu información protegida en todo momento.
                  </small>
                </div>
              </div>
            </div>
          </div>

          <div className="showcase-footer">
            Proyecto de Software 3 · ShareNotes
          </div>
        </section>

        {/* Formulario */}
        <section className="auth-form-section">
          <div className="auth-card">
            <div className="auth-card-header">
              <div className="mobile-logo">
                <div className="showcase-logo-icon">SN</div>
              </div>

              <span className="auth-eyebrow">
                {isLogin ? 'BIENVENIDO DE NUEVO' : 'ÚNETE A SHAREDNOTES'}
              </span>

              <h2>
                {isLogin
                  ? 'Inicia sesión'
                  : 'Crea tu cuenta'}
              </h2>

              <p>
                {isLogin
                  ? 'Accede a tu espacio académico.'
                  : 'Comienza a compartir conocimiento.'}
              </p>
            </div>

            {error && (
              <div className="auth-alert auth-alert-error">
                <span className="alert-icon">!</span>
                <div>
                  <strong>No pudimos continuar</strong>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="auth-alert auth-alert-success">
                <span className="alert-icon">✓</span>
                <div>
                  <strong>¡Todo listo!</strong>
                  <p>{success}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <div className="auth-field">
                  <label htmlFor="name">
                    Nombre completo
                  </label>

                  <div className="input-wrapper">
                    <span className="input-icon">A</span>

                    <input
                      id="name"
                      type="text"
                      placeholder="Ej. Ana Milena Solarte"
                      value={name}
                      onChange={(e) =>
                        setName(e.target.value)
                      }
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="auth-field">
                <label htmlFor="email">
                  Correo electrónico
                </label>

                <div className="input-wrapper">
                  <span className="input-icon">@</span>

                  <input
                    id="email"
                    type="email"
                    placeholder="tu_correo@uni.edu.co"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <div className="field-label-row">
                  <label htmlFor="password">
                    Contraseña
                  </label>

                  {!isLogin && (
                    <span className="password-requirement">
                      Mínimo 8 caracteres
                    </span>
                  )}
                </div>

                <div className="input-wrapper">
                  <span className="input-icon">●</span>

                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    autoComplete={
                      isLogin
                        ? 'current-password'
                        : 'new-password'
                    }
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    aria-label={
                      showPassword
                        ? 'Ocultar contraseña'
                        : 'Mostrar contraseña'
                    }
                  >
                    {showPassword ? 'Ocultar' : 'Ver'}
                  </button>
                </div>

                {!isLogin && password && (
                  <div className="password-strength">
                    <div className="strength-bars">
                      {[1, 2, 3, 4].map((level) => (
                        <span
                          key={level}
                          className={
                            level <= passwordStrength
                              ? `strength-active strength-${passwordStrength}`
                              : ''
                          }
                        ></span>
                      ))}
                    </div>

                    <small>
                      Seguridad:{' '}
                      <strong>
                        {getStrengthLabel()}
                      </strong>
                    </small>
                  </div>
                )}
              </div>

              {!isLogin && (
                <div className="auth-field">
                  <label htmlFor="role">
                    Perfil académico
                  </label>

                  <div className="input-wrapper select-wrapper">
                    <span className="input-icon">◆</span>

                    <select
                      id="role"
                      value={role}
                      onChange={(e) =>
                        setRole(e.target.value)
                      }
                    >
                      <option value="student">
                        Estudiante
                      </option>

                      <option value="teacher">
                        Docente / Profesor
                      </option>

                      <option value="moderator">
                        Moderador
                      </option>
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="auth-submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="loading-spinner"></span>
                    Procesando...
                  </>
                ) : (
                  <>
                    {isLogin
                      ? 'Ingresar a ShareNotes'
                      : 'Crear mi cuenta'}
                    <span className="submit-arrow">→</span>
                  </>
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span></span>
              <small>o</small>
              <span></span>
            </div>

            <div className="auth-switch">
              <span>
                {isLogin
                  ? '¿Todavía no tienes una cuenta?'
                  : '¿Ya tienes una cuenta?'}
              </span>

              <button
                type="button"
                onClick={changeMode}
              >
                {isLogin
                  ? 'Crear cuenta'
                  : 'Iniciar sesión'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}