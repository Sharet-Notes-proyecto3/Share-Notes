// src/directives/RoleGate.jsx
import { useAuth } from '../context/AuthContext';
import accountStore from '../store/account-store';

/**
 * Componente Wrapper RoleGate para renderizado condicional según rol.
 * Uso: <RoleGate allow={['TEACHER', 'FUNCTIONARY', 'ADMIN']}>{children}</RoleGate>
 */
export function RoleGate({ allow = [], fallback = null, children }) {
  const { user } = useAuth();
  const currentRole = (accountStore.getters.userRole() || '').toString().toLowerCase();
  const rawRole = (user?.role || '').toString().toLowerCase();

  const allowedRoles = allow.map((r) => r.toString().toLowerCase());

  // Mapeo de roles activos con sus sinónimos
  const activeRoles = new Set([currentRole, rawRole].filter(Boolean));
  if (activeRoles.has('teacher') || activeRoles.has('functionary')) {
    activeRoles.add('teacher');
    activeRoles.add('functionary');
  }
  if (activeRoles.has('moderator') || activeRoles.has('front_desk_cs')) {
    activeRoles.add('moderator');
    activeRoles.add('front_desk_cs');
  }
  if (activeRoles.has('admin')) {
    activeRoles.add('admin');
  }
  if (activeRoles.has('student') || activeRoles.has('user')) {
    activeRoles.add('student');
    activeRoles.add('user');
  }

  // Verificar si coincide o si tiene bypass admin
  const isAllowed =
    (allowedRoles.includes('admin') && activeRoles.has('admin')) ||
    allowedRoles.some((r) => activeRoles.has(r));

  if (!isAllowed) {
    return fallback;
  }

  return children;
}

export default RoleGate;
