// src/directives/RoleGate.jsx
import { useAuth } from '../context/AuthContext';

/**
 * Componente Wrapper RoleGate para renderizado condicional según rol.
 * Fuente de verdad reactiva: useAuth()
 * Uso: <RoleGate allow={['teacher', 'admin']}>{children}</RoleGate>
 */
export function RoleGate({ allow = [], fallback = null, children }) {
  const { user, userRole } = useAuth();
  const currentRole = (userRole || user?.role || '').toString().toLowerCase();

  const allowedRoles = allow.map((r) => r.toString().toLowerCase());

  // Administrador tiene acceso total o el rol coincide directamente
  const isAllowed =
    (allowedRoles.includes('admin') && currentRole === 'admin') ||
    allowedRoles.includes(currentRole);

  if (!isAllowed) {
    return fallback;
  }

  return children;
}

export default RoleGate;
