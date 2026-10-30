// =============================================================================
// CONTEXTO GLOBAL DE AUTENTICACIÓN, SESIÓN Y ROLES
// Fuente única de verdad del estado de sesión en React
// =============================================================================

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  clearStoredToken,
  clearStoredUser,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
  setUnauthorizedHandler,
} from '../services/api';
import { authService } from '../services/auth.service';
import OnboardingModal from '../components/auth/OnboardingModal';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // ---------------------------------------------------------------------------
  // ESTADO DE SESIÓN REACTIVO DESDE ALMACENAMIENTO LOCAL / API
  // loading inicia en true si hay un token guardado para evitar destellos de AuthModal
  // ---------------------------------------------------------------------------

  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(() => Boolean(getStoredToken()));
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  // ---------------------------------------------------------------------------
  // CERRAR SESIÓN
  // ---------------------------------------------------------------------------

  const logout = () => {
    clearStoredToken();
    clearStoredUser();
    setToken(null);
    setUser(null);
    setNeedsOnboarding(false);
  };

  // ---------------------------------------------------------------------------
  // INTERCEPTOR GLOBAL DE SESIÓN EXPIRADA
  // ---------------------------------------------------------------------------

  useEffect(() => {
    setUnauthorizedHandler(() => {
      // Evitar que el modal se dispare múltiples veces (p. ej. StrictMode o peticiones 401 concurrentes)
      if (sessionExpired) return;
      setSessionExpired(true);
    });
  }, [sessionExpired]);

  // ---------------------------------------------------------------------------
  // ONBOARDING ACADÉMICO (Carrera y Semestre) — primer inicio de sesión
  // ---------------------------------------------------------------------------

  const checkOnboarding = (u) => {
    const role = (u?.role || '').toString().toLowerCase();
    if (!u || role !== 'student') {
      setNeedsOnboarding(false);
      return;
    }
    // Disparar onboarding si la cuenta de estudiante no tiene tipo de programa o semestre
    setNeedsOnboarding(!u.program_type || !u.semester);
  };

  const completeOnboarding = async ({ careerId, semester, programType }) => {
    if (!user) return;
    const currentToken = token || getStoredToken();
    const updatedProfile = await authService.updateAcademicProfile(
      currentToken,
      careerId,
      semester,
      programType
    );
    // Sincronización inmediata: React State + Almacenamiento persistente
    setUser(updatedProfile);
    setStoredUser(updatedProfile);
    setNeedsOnboarding(false);
  };

  const getAcademicProfile = () => {
    if (!user) return null;
    return {
      career_id: user.career_id,
      semester: user.semester,
      program_type: user.program_type,
    };
  };

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    const rememberMe = Boolean(
      localStorage.getItem('jhi-authenticationToken') || localStorage.getItem('token')
    );
    setStoredUser(updatedUser, rememberMe);
  }, []);

  // ---------------------------------------------------------------------------
  // RECUPERAR SESIÓN AL INICIAR LA APLICACIÓN
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let isActive = true;

    const loadSession = async () => {
      const currentToken = getStoredToken();

      if (!currentToken) {
        if (isActive) {
          setUser(null);
          setToken(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const freshProfile = await authService.getProfile(currentToken);
        if (!isActive) return;

        if (freshProfile && (freshProfile.email || freshProfile.id)) {
          setUser(freshProfile);
          setStoredUser(freshProfile);
          setToken(currentToken);
          checkOnboarding(freshProfile);
        } else {
          logout();
        }
      } catch {
        if (!isActive) return;
        logout();
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadSession();

    return () => {
      isActive = false;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // INICIAR SESIÓN
  // ---------------------------------------------------------------------------

  const login = async (email, password, rememberMe = true) => {
    const data = await authService.login(email, password);

    if (data?.token && data?.user) {
      setStoredToken(data.token, rememberMe);
      setStoredUser(data.user, rememberMe);
      setToken(data.token);
      setUser(data.user);
      checkOnboarding(data.user);
    }

    return data;
  };

  // ---------------------------------------------------------------------------
  // REGISTRO
  // ---------------------------------------------------------------------------

  const register = async (name, email, password, role = 'student', programType = null, semester = null) => {
    return await authService.register(name, email, password, role, programType, semester);
  };

  // ---------------------------------------------------------------------------
  // EVALUACIÓN DE ROLES
  // Roles unificados con backend: admin | moderator | teacher | student
  // ---------------------------------------------------------------------------

  const userRole = (user?.role || 'student').toString().toLowerCase();
  const isAdmin = userRole === 'admin';
  const isModerator = isAdmin || userRole === 'moderator';
  const isTeacher = isAdmin || userRole === 'teacher';
  const isStudent =
    userRole === 'student' || (!isAdmin && !isModerator && !isTeacher);

  const checkAuthorities = (authorities) => {
    if (!token || !user) {
      return false;
    }
    if (!authorities) {
      return true;
    }
    const authList = Array.isArray(authorities) ? authorities : [authorities];
    if (authList.length === 0) {
      return true;
    }

    const current = (user?.role || '').toString().toLowerCase();
    if (current === 'admin') return true;

    return authList.some((req) => req.toString().toLowerCase() === current);
  };

  const hasAnyAuthority = (authorities) => {
    return checkAuthorities(authorities);
  };

  // ---------------------------------------------------------------------------
  // ESTADO DE AUTENTICACIÓN
  // ---------------------------------------------------------------------------

  const isAuthenticated = Boolean(token) && Boolean(user);

  // ---------------------------------------------------------------------------
  // CONTEXTO GLOBAL
  // ---------------------------------------------------------------------------

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,

        login,
        register,
        logout,
        updateUser,

        isAuthenticated,
        userRole,
        hasAnyAuthority,
        checkAuthorities,

        isAdmin,
        isModerator,
        isTeacher,
        isStudent,

        needsOnboarding,
        completeOnboarding,
        getAcademicProfile,
      }}
    >
      {children}
      {isAuthenticated && needsOnboarding && <OnboardingModal />}

      {/* Modal de sesión expirada (reemplaza al alert) */}
      {sessionExpired && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px',
            backdropFilter: 'blur(4px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '32px 40px',
              maxWidth: '420px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
            }}
          >
            <div style={{ fontSize: '36px', marginBottom: '14px' }}>⚠️</div>
            <h3
              style={{
                margin: '0 0 10px',
                color: 'var(--text-primary)',
                fontSize: '18px',
                fontWeight: '700',
              }}
            >
              Sesión expirada
            </h3>
            <p
              style={{
                margin: '0 0 22px',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                lineHeight: '1.5',
              }}
            >
              Tu sesión ha expirado. Por favor, inicia sesión de nuevo.
            </p>
            <button
              onClick={() => {
                setSessionExpired(false);
                logout();
              }}
              style={{
                width: '100%',
                padding: '10px 0',
                background: 'var(--primary-color)',
                color: 'var(--text-inverse)',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Iniciar sesión
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

// =============================================================================
// HOOK DE AUTENTICACIÓN
// =============================================================================

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }

  return context;
};