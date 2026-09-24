import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { authService } from '../services/auth.service';
import { setUnauthorizedHandler } from '../services/api';
import OnboardingModal from '../components/auth/OnboardingModal';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // ---------------------------------------------------------------------------
  // ESTADO DE SESIÓN
  // ---------------------------------------------------------------------------

  const [token, setToken] = useState(
    () => localStorage.getItem('token') || null
  );

  const [user, setUser] = useState(null);

  // Indica si todavía estamos comprobando la sesión almacenada.
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------------------------------
  // CERRAR SESIÓN
  // ---------------------------------------------------------------------------

  const logout = () => {
    localStorage.removeItem('token');
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
    if (!u || u.role === 'admin') {
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

    const loadUser = async () => {
      setLoading(true);

      // No existe token guardado.
      if (!token) {
        if (isActive) {
          setUser(null);
          setLoading(false);
        }

        return;
      }

      try {
        // Consultamos el perfil utilizando el token almacenado.
        const profileData = await authService.getProfile(token);

        if (!isActive) return;

        setUser(profileData);
        checkOnboarding(profileData);
      } catch (error) {
        console.error(
          'La sesión almacenada no es válida:',
          error
        );

        if (!isActive) return;

        // Si el token ya no es válido, limpiamos la sesión.
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadUser();

    // Evita actualizar estados si el componente deja de estar activo.
    return () => {
      isActive = false;
    };
  }, [token]);

  // ---------------------------------------------------------------------------
  // INICIAR SESIÓN
  // ---------------------------------------------------------------------------

  const login = async (email, password) => {
    const data = await authService.login(email, password);

    if (!data?.token) {
      throw new Error(
        'El servidor no devolvió un token de autenticación.'
      );
    }

    // Guardamos el token para mantener la sesión.
    localStorage.setItem('token', data.token);

    setToken(data.token);

    // Si el backend ya devuelve el usuario, lo mostramos inmediatamente.
    if (data.user) {
      setUser(data.user);
    }

    return data;
  };

  // ---------------------------------------------------------------------------
  // REGISTRO
  // ---------------------------------------------------------------------------

  const register = async (
    name,
    email,
    password,
    role = 'student'
  ) => {
    return await authService.register(
      name,
      email,
      password,
      role
    );
  };

  // ---------------------------------------------------------------------------
  // ROLES DEL USUARIO (Solo Administrador y Estudiante)
  // ---------------------------------------------------------------------------

  const isAdmin = user?.role === 'admin';

  const isStudent = user?.role === 'student' || !user?.role || user?.role === 'teacher' || user?.role === 'moderator';

  // Alias para mantener compatibilidad si algún componente consulta isModerator/isTeacher
  const isModerator = isAdmin;
  const isTeacher = false;

  // ---------------------------------------------------------------------------
  // ESTADO DE AUTENTICACIÓN
  // ---------------------------------------------------------------------------

  const isAuthenticated =
    Boolean(token) && Boolean(user);

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
    throw new Error(
      'useAuth debe ser utilizado dentro de un AuthProvider'
    );
  }

  return context;
};