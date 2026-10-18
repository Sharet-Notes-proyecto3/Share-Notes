// =============================================================================
// CONTEXTO GLOBAL DE AUTENTICACIÓN, SESIÓN Y ROLES
// Fuente única de verdad del estado de sesión en React
// =============================================================================

import { createContext, useContext, useEffect, useState } from 'react';
import {
  getStoredToken,
  setStoredToken,
  clearStoredToken,
  getStoredUser,
  setStoredUser,
  clearStoredUser,
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
      alert('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
      logout();
    });
  }, []);

  // ---------------------------------------------------------------------------
  // ONBOARDING ACADÉMICO (Carrera y Semestre) — primer inicio de sesión
  // ---------------------------------------------------------------------------

  const [needsOnboarding, setNeedsOnboarding] = useState(false);

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