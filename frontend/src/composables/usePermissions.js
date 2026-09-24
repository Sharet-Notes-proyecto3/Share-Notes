// =============================================================================
// COMPOSABLE DE MATRIZ DE PERMISOS (USE PERMISSIONS)
// Referencia del Patrón: Matriz de permisos por rol e indemnidad por subject
// Sistema paralelo e independiente del guard de rutas (defensa en profundidad)
// =============================================================================

import accountStore from '../store/account-store';

/**
 * Matriz de permisos estructurada por rol y subject
 */
export const PERMISSIONS_MATRIX = {
  admin: {
    all: true,
  },
  ADMIN: {
    all: true,
  },
  moderator: {
    notes: ['view', 'create', 'edit', 'delete', 'export'],
    forum: ['view', 'create', 'reply', 'moderate'],
    admin: ['view'],
    profile: ['view', 'edit'],
  },
  FRONT_DESK_CS: {
    notes: ['view', 'create', 'edit', 'delete', 'export'],
    forum: ['view', 'create', 'reply', 'moderate'],
    admin: ['view'],
    profile: ['view', 'edit'],
  },
  teacher: {
    notes: ['view', 'create', 'edit'],
    forum: ['view', 'create', 'reply'],
    profile: ['view', 'edit'],
  },
  FUNCTIONARY: {
    notes: ['view', 'create', 'edit'],
    forum: ['view', 'create', 'reply'],
    profile: ['view', 'edit'],
  },
  student: {
    notes: ['view', 'create'],
    forum: ['view', 'create', 'reply'],
    profile: ['view', 'edit'],
  },
  USER: {
    notes: ['view', 'create'],
    forum: ['view', 'create', 'reply'],
    profile: ['view', 'edit'],
  },
};

export function usePermissions() {
  /**
   * Evalúa si la identidad actual puede realizar una acción sobre un subject.
   * a) Si role === 'admin' o posee bypass 'all: true' → true siempre
   * b) Si no, busca permissions[role][subject] y verifica que incluya la acción
   *
   * @param {string} action - Acción a realizar (ej: 'create', 'view', 'delete')
   * @param {string} subject - Recurso u objeto (ej: 'notes', 'forum', 'admin', 'profile')
   * @returns {boolean}
   */
  const can = (action, subject) => {
    const rawRole = (accountStore.getters.userRole() || 'student').toString().toLowerCase();

    // a) Si el rol es admin o tiene bypass total, retorna true siempre
    if (rawRole === 'admin' || PERMISSIONS_MATRIX[rawRole]?.all) {
      return true;
    }

    const rolePermissions = PERMISSIONS_MATRIX[rawRole];
    if (!rolePermissions || !rolePermissions[subject]) {
      return false;
    }

    // b) Busca permissions[role][subject] y verifica si incluye la acción
    return rolePermissions[subject].includes(action);
  };

  return {
    can,
    matrix: PERMISSIONS_MATRIX,
  };
}

export default usePermissions;
