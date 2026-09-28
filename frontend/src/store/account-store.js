// =============================================================================
// STORE DE CUENTA Y SESIÓN (ACCOUNT STORE)
// Roles unificados con backend: student | teacher | moderator | admin
// =============================================================================

import {
  getStoredToken,
  getStoredUser,
  setStoredUser,
  clearStoredUser,
} from '../services/api';

export const createAccountState = () => {
  const initialUser = getStoredUser();
  const initialToken = getStoredToken();
  return {
    userIdentity: initialUser,
    authenticated: Boolean(initialUser && initialToken),
    logon: false,
    profilesLoaded: false,
  };
};

export const accountStore = {
  state: createAccountState(),

  // ---------------------------------------------------------------------------
  // GETTERS
  // ---------------------------------------------------------------------------
  getters: {
    /**
     * Retorna la identidad del usuario actual (userIdentity)
     */
    account(state = accountStore.state) {
      return state.userIdentity;
    },

    /**
     * Retorna el rol del usuario usando los nombres reales del backend:
     * 'admin' > 'moderator' > 'teacher' > 'student'
     */
    userRole(state = accountStore.state) {
      const identity = state.userIdentity;
      if (!identity) return 'student';

      // Si el identity ya tiene un campo role (backend ShareNotes), usarlo directamente
      if (identity.role) {
        const role = identity.role.toString().toLowerCase();
        if (['admin', 'moderator', 'teacher', 'student'].includes(role)) {
          return role;
        }
      }

      // Evaluar authorities si vienen como array
      const authorities = Array.isArray(identity.authorities)
        ? identity.authorities.map((a) => a.toString().toLowerCase())
        : [];

      if (authorities.includes('admin')) {
        return 'admin';
      }
      if (authorities.includes('moderator')) {
        return 'moderator';
      }
      if (authorities.includes('teacher')) {
        return 'teacher';
      }
      return 'student';
    },

    /**
     * Revisa si está autenticado
     */
    isAuthenticated(state = accountStore.state) {
      return Boolean(state.authenticated && state.userIdentity);
    },
  },

  // ---------------------------------------------------------------------------
  // ACTIONS
  // ---------------------------------------------------------------------------
  actions: {
    /**
     * Estructura y establece la identidad en el estado del store
     */
    setAuthentication(identity) {
      accountStore.state.userIdentity = identity || null;
      accountStore.state.authenticated = Boolean(identity);
      accountStore.state.logon = false;
      if (identity) {
        setStoredUser(identity);
      } else {
        clearStoredUser();
      }
    },

    /**
     * Limpia únicamente las variables en memoria del store.
     * (El borrado físico del token de localStorage/sessionStorage se realiza en la capa del servicio)
     */
    logout() {
      accountStore.state.userIdentity = null;
      accountStore.state.authenticated = false;
      accountStore.state.logon = false;
      accountStore.state.profilesLoaded = false;
      clearStoredUser();
    },

    /**
     * Autentica resolviendo una promesa (ej. llamada a login)
     */
    async authenticate(promise) {
      accountStore.state.logon = true;
      try {
        const result = await promise;
        return result;
      } catch (error) {
        accountStore.actions.logout();
        throw error;
      } finally {
        accountStore.state.logon = false;
      }
    },
  },
};

export default accountStore;
