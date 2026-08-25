import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function UserMenu() {
  const { user, logout, isAdmin, isModerator, isTeacher, isStudent } =
    useAuth();

  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  if (!user) return null;

  const getRoleName = () => {
    if (isAdmin) return 'Administrador';
    if (isModerator) return 'Moderador';
    if (isTeacher) return 'Docente';
    if (isStudent) return 'Estudiante';

    return 'Usuario';
  };

  const getInitials = () => {
    const name = user.name || user.email || 'U';

    const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (
      parts[0][0] + parts[parts.length - 1][0]
    ).toUpperCase();
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
  };

  return (
    <div
      className="user-menu-wrapper"
      ref={menuRef}
    >
      <button
        type="button"
        className={`user-menu-trigger ${
          open ? 'user-menu-trigger-active' : ''
        }`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <div className="user-avatar">
          {getInitials()}
        </div>

        <div className="user-trigger-info">
          <strong>{user.name || 'Usuario'}</strong>
          <span>{getRoleName()}</span>
        </div>

        <span
          className={`user-menu-chevron ${
            open ? 'chevron-open' : ''
          }`}
        >
          ↓
        </span>
      </button>

      {open && (
        <div className="profile-menu">
          <div className="profile-header">
            <div className="profile-avatar-large">
              {getInitials()}
            </div>

            <div className="profile-main-info">
              <h3>{user.name || 'Usuario'}</h3>
              <p>{user.email}</p>
            </div>
          </div>

          <div className="profile-status">
            <span className="status-dot"></span>

            <span>Sesión activa</span>

            <span className="profile-role">
              {getRoleName()}
            </span>
          </div>

          <div className="profile-divider"></div>

          <div className="profile-actions">
            <button
              type="button"
              className="profile-action"
              onClick={() => setOpen(false)}
            >
              <span className="action-icon">◉</span>

              <span>
                <strong>Mi perfil</strong>
                <small>
                  Consulta tu información personal
                </small>
              </span>

              <span className="action-arrow">›</span>
            </button>

            <button
              type="button"
              className="profile-action"
              onClick={() => setOpen(false)}
            >
              <span className="action-icon">⚙</span>

              <span>
                <strong>Preferencias</strong>
                <small>
                  Personaliza tu experiencia
                </small>
              </span>

              <span className="action-arrow">›</span>
            </button>
          </div>

          <div className="profile-divider"></div>

          <button
            type="button"
            className="logout-action"
            onClick={handleLogout}
          >
            <span className="logout-icon">↪</span>

            <span>
              <strong>Cerrar sesión</strong>
              <small>Salir de tu cuenta</small>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}