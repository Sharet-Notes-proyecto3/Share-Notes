// =============================================================================
// CONTEXTO GLOBAL DE AUTENTICACIÓN, SESIÓN Y ROLES
// Integración con AccountService, AccountStore y JWT Pattern
// =============================================================================

import { createContext, useContext, useEffect, useState } from 'react';

import { accountService } from '../services/account.service';
import accountStore from '../store/account-store';
import { authService } from '../services/auth.service';
import { setUnauthorizedHandler } from '../services/api';
import OnboardingModal from '../components/auth/OnboardingModal';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // ---------------------------------------------------------------------------
  // ESTADO DE SESIÓN DESDE ACCOUNT SERVICE / STORE
  // ---------------------------------------------------------------------------

  const [token, setToken] = useState(() => accountService.getToken());
  const [user, setUser] = useState(() => accountStore.getters.account());
  const [loading, setLoading] = useState(
    () =>
      !accountStore.getters.isAuthenticated() &&
      Boolean(accountService.getToken()),
  );

  // ---------------------------------------------------------------------------
  // CERRAR SESIÓN
  // ---------------------------------------------------------------------------

  const logout = () => {
    accountService.logout();
    setToken(null);
    setUser(null);
  };

  // ---------------------------------------------------------------------------
  // INTERCEPTOR GLOBAL DE SESIÓN EXPIRADA
  // ---------------------------------------------------------------------------

  useEffect(() => {
    setUnauthorizedHandler(() => {
      alert('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
      logout();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // ONBOARDING ACADÉMICO (Carrera y Semestre) — primer inicio de sesión
  // ---------------------------------------------------------------------------

  const getOnboardingKey = (userId) => `sharenotes-onboarding-${userId}`;
  const getAcademicKey = (userId) => `sharenotes-academic-${userId}`;

  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const checkOnboarding = (u) => {
    const role = (u?.role || '').toString().toLowerCase();
    if (!u || role !== 'student') {
      setNeedsOnboarding(false);
      return;
    }
    const done = localStorage.getItem(getOnboardingKey(u.id));
    setNeedsOnboarding(!done);
  };

  const completeOnboarding = ({ career, semester }) => {
    if (!user) return;
    localStorage.setItem(
      getAcademicKey(user.id),
      JSON.stringify({ career, semester })
    );
    localStorage.setItem(getOnboardingKey(user.id), '1');
    setNeedsOnboarding(false);
  };

  const getAcademicProfile = () => {
    if (!user) return null;
    const raw = localStorage.getItem(getAcademicKey(user.id));
    return raw ? JSON.parse(raw) : null;
  };

  // ---------------------------------------------------------------------------
  // RECUPERAR SESIÓN AL INICIAR LA APLICACIÓN
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let isActive = true;

    const loadSession = async () => {
      const currentToken = accountService.getToken();

      if (!currentToken) {
        if (isActive) {
          setUser(null);
          setToken(null);
          setLoading(false);
        }
        return;
      }

      if (!accountStore.getters.isAuthenticated()) {
        setLoading(true);
      }

      try {
        const success = await accountService.loadAccount();
        if (!isActive) return;

        if (success) {
          const currentUser = accountStore.getters.account();
          setUser(currentUser);
          setToken(accountService.getToken());
          checkOnboarding(currentUser);
        } else {
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        console.error('La sesión almacenada no es válida:', error);
        if (!isActive) return;
        accountService.logout();
        setUser(null);
        setToken(null);
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
    const data = await accountService.login(email, password, rememberMe);
    const storedToken = accountService.getToken();
    const currentUser = accountStore.getters.account();

    setToken(storedToken);
    setUser(currentUser);
    checkOnboarding(currentUser);

    return data;
  };

  // ---------------------------------------------------------------------------
  // REGISTRO
  // ---------------------------------------------------------------------------

  const register = async (name, email, password, role = 'student') => {
    return await authService.register(name, email, password, role);
  };

  // ---------------------------------------------------------------------------
  // EVALUACIÓN DE ROLES CON PRIORIDAD Y AUTORIDADES
  // Roles unificados con backend: admin | moderator | teacher | student
  // ---------------------------------------------------------------------------

  const userRole = (accountStore.getters.userRole() || user?.role || 'student')
    .toString()
    .toLowerCase();
  const isAdmin = userRole === 'admin';
  const isModerator =
    isAdmin || userRole === 'moderator' || userRole === 'front_desk_cs';
  const isTeacher = userRole === 'teacher' || userRole === 'functionary';
  const isStudent =
    userRole === 'student' ||
    userRole === 'user' ||
    (!isAdmin && !isModerator && !isTeacher);

  const hasAnyAuthority = (authorities) => {
    return accountService.checkAuthorities(authorities);
  };

  // ---------------------------------------------------------------------------
  // ESTADO DE AUTENTICACIÓN
  // ---------------------------------------------------------------------------

  const isAuthenticated =
    Boolean(token) && Boolean(user) && accountStore.getters.isAuthenticated();

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

        isAuthenticated,
        userRole,
        hasAnyAuthority,

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