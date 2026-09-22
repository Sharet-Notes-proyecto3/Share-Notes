// =============================================================================
// STORE DE CUENTA Y SESIÓN (ACCOUNT STORE)
// Roles unificados con backend: student | teacher | moderator | admin
// =============================================================================

export const createAccountState = () => ({
  userIdentity: null,
  authenticated: false,
  logon: false,
  profilesLoaded: false,
});

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
     *
     * Compatible con ambos formatos: rol directo (backend ShareNotes)
     * o array de authorities (patrón JHipster legacy).
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

      // Fallback: evaluar authorities legacy (compatibilidad JHipster)
      const authorities = Array.isArray(identity.authorities)
        ? identity.authorities.map((a) => a.toString().toUpperCase())
        : [];

      if (authorities.some((a) => a === 'ADMIN' || a === 'ROLE_ADMIN')) {
        return 'admin';
      }
      if (authorities.some((a) => a === 'MODERATOR' || a === 'ROLE_MODERATOR' || a === 'FRONT_DESK_CS' || a === 'ROLE_FRONT_DESK_CS')) {
        return 'moderator';
      }
      if (authorities.some((a) => a === 'TEACHER' || a === 'ROLE_TEACHER' || a === 'FUNCTIONARY' || a === 'ROLE_FUNCTIONARY')) {
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
