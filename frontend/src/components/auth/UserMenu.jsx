import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth.service';
import ProfileModal from './ProfileModal';

// Reutiliza la misma clave que ProfileModal (Integrante 1 – Anna)
const getPhotoKey = (userId) => `sharenotes-avatar-${userId}`;
const getNameKey  = (userId) => `sharenotes-name-${userId}`;

export default function UserMenu() {
  const { user, logout, isAdmin, isModerator, isTeacher, isStudent } =
    useAuth();

  const [open, setOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [wikiTopic, setWikiTopic] = useState('Desarrollo de software');
  const [wikiUrl, setWikiUrl] = useState('');
  const [loadingWiki, setLoadingWiki] = useState(false);
  const menuRef = useRef(null);

  // ── Foto de perfil y nombre (Integrante 1 – Anna) ─────────────────────────
  const [avatar, setAvatar] = useState(
    () => user ? localStorage.getItem(getPhotoKey(user.id)) || null : null
  );
  const [displayName, setDisplayName] = useState(
    () => user ? localStorage.getItem(getNameKey(user.id)) || user?.name || '' : ''
  );

  // Sincroniza cuando cambia el usuario o cuando el menú se abre/cierra
  useEffect(() => {
    if (!user) return;
    setAvatar(localStorage.getItem(getPhotoKey(user.id)) || null);
    setDisplayName(localStorage.getItem(getNameKey(user.id)) || user.name || '');
  }, [user, open]);
  // ─────────────────────────────────────────────────────────────────────────

  const fetchWiki = async (topic) => {
    const query = topic || wikiTopic;
    if (!query?.trim()) return;
    try {
      setLoadingWiki(true);
      const res = await authService.getRelatedTopic(query);
      setWikiUrl(res?.articulo || '');
    } catch (err) {
      console.error('Error al obtener artículo de Wikipedia:', err);
      setWikiUrl('');
    } finally {
      setLoadingWiki(false);
    }
  };

  const handleToggleMenu = () => {
    const nextState = !open;
    setOpen(nextState);
    if (nextState && !wikiUrl && !loadingWiki) {
      fetchWiki(wikiTopic);
    }
  };

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
    return 'Estudiante';
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
        onClick={handleToggleMenu}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <div className="user-avatar" style={{ overflow: 'hidden' }}>
          {avatar
            ? <img src={avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            : getInitials()
          }
        </div>

        <div className="user-trigger-info">
          <strong>{displayName || user.name || 'Usuario'}</strong>
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
            <div className="profile-avatar-large" style={{ overflow: 'hidden' }}>
              {avatar
                ? <img src={avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : getInitials()
              }
            </div>

            <div className="profile-main-info">
              <h3>{displayName || user.name || 'Usuario'}</h3>
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

          {/* Sección de Artículo Wikipedia de Interés Académico */}
          <div style={{ padding: '12px 16px', background: 'rgba(15, 23, 42, 0.4)', borderBottom: '1px solid var(--border-color, #334155)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                🌐 Artículo Académico (Wikipedia)
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchWiki(wikiTopic);
              }}
              style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}
            >
              <input
                type="text"
                value={wikiTopic}
                onChange={(e) => setWikiTopic(e.target.value)}
                placeholder="Tema o carrera..."
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  background: '#0f172a',
                  color: '#fff',
                  fontSize: '11px',
                }}
              />
              <button
                type="submit"
                disabled={loadingWiki}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#0284c7',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
                title="Consultar en Wikipedia"
              >
                {loadingWiki ? '...' : '🔍'}
              </button>
            </form>

            {wikiUrl ? (
              <a
                href={wikiUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8',
                  fontSize: '11px',
                  textDecoration: 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>📖</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{wikiUrl}</span>
              </a>
            ) : (
              <div style={{ fontSize: '10px', color: '#64748b' }}>
                {loadingWiki ? 'Buscando artículo en Wikipedia...' : 'No se encontró un artículo directo.'}
              </div>
            )}
          </div>

          <div className="profile-actions">
            <button
              type="button"
              className="profile-action"
              onClick={() => {
                setOpen(false);
                setShowProfile(true);
              }}
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

      {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
}