// =============================================================================
// CONTEXTO GLOBAL DE AUTENTICACIÓN, SESIÓN Y ROLES
// Responsable: Integrante 1 - Autenticación y Sesión
// =============================================================================

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { authService } from '../services/auth.service';

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
  // ROLES DEL USUARIO
  // ---------------------------------------------------------------------------

  const isAdmin = user?.role === 'admin';

  const isModerator =
    user?.role === 'admin' ||
    user?.role === 'moderator';

  const isTeacher = user?.role === 'teacher';

  const isStudent = user?.role === 'student';

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
      }}
    >
      {children}
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