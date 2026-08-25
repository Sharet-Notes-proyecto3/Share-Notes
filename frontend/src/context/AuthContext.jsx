// =============================================================================
// MODIFICACIÓN 1 — CONTEXTO GLOBAL DE AUTENTICACIÓN Y ROLES
// Responsable: Integrante 1 (Autenticación y Sesión)
// =============================================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar datos de perfil al iniciar o cambiar el token
  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const profileData = await authService.getProfile(token);
          setUser(profileData);
        } catch (error) {
          console.error('Error al cargar perfil:', error);
          logout();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  const register = async (name, email, password, role = 'student') => {
    return await authService.register(name, email, password, role);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'admin' || user?.role === 'moderator';
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';
  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        register,
        logout,
        isAdmin,
        isModerator,
        isTeacher,
        isStudent,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
