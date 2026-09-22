// =============================================================================
// SERVICIO DE CUENTA E IDENTIDAD (ACCOUNT SERVICE)
// Referencia del Patrón: AccountService con update(), loadAccount(), retrieveAccount(),
// hasAnyAuthorityAndCheckAuth() y checkAuthorities()
// =============================================================================

import { api, getStoredToken, setStoredToken, clearStoredToken } from './api';
import accountStore from '../store/account-store';

export class AccountService {
  constructor() {
    this.store = accountStore;
  }

  /**
   * Obtiene el token de autenticación guardado
   */
  getToken() {
    return getStoredToken();
  }

  /**
   * Actualiza los perfiles y la cuenta del usuario.
   * Combina retrieveProfiles() + loadAccount()
   */
  async update() {
    await this.retrieveProfiles();
    await this.loadAccount();
  }

  /**
   * Carga los perfiles de configuración si aplica
   */
  async retrieveProfiles() {
    this.store.state.profilesLoaded = true;
  }

  /**
   * Revisa si existe token en localStorage o sessionStorage bajo 'jhi-authenticationToken'.
   * Si ya hay sesión autenticada en el store, NO vuelve a pedir el account.
   */
  async loadAccount() {
    const token = this.getToken();
    if (!token) {
      this.store.actions.logout();
      return false;
    }

    // Si ya existe sesión autenticada en el store y hay token válido, no vuelve a pedir la cuenta
    if (this.store.state.authenticated && this.store.state.userIdentity) {
      return true;
    }

    return await this.retrieveAccount();
  }

  /**
   * Hace GET a api/account o /auth/profile.
   * Si responde 200 con login válido llama a store.setAuthentication(account);
   * Si falla, llama a store.logout()
   */
  async retrieveAccount() {
    try {
      const response = await api.get('/auth/profile');

      if (response && (response.email || response.id || response.login || response.name)) {
        this.store.actions.setAuthentication(response);
        return true;
      } else {
        this.store.actions.logout();
        return false;
      }
    } catch (error) {
      console.error('Error al recuperar la cuenta:', error);
      this.store.actions.logout();
      return false;
    }
  }

  /**
   * Inicia sesión, guarda el token y recupera la cuenta
   */
  async login(email, password, rememberMe = true) {
    const promise = api.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    });

    const data = await this.store.actions.authenticate(promise);

    if (data?.token) {
      setStoredToken(data.token, rememberMe);
    }

    if (data?.user) {
      this.store.actions.setAuthentication(data.user);
    } else {
      await this.retrieveAccount();
    }

    return data;
  }

  /**
   * Valida si el usuario tiene alguno de los roles/autoridades requeridos.
   * Comprueba primero la autenticación.
   */
  async hasAnyAuthorityAndCheckAuth(authorities) {
    if (!this.store.state.authenticated) {
      const loaded = await this.loadAccount();
      if (!loaded) return false;
    }

    return this.checkAuthorities(authorities);
  }

  /**
   * Valida las autoridades/roles de la identidad actual
   */
  checkAuthorities(authorities) {
    if (!this.store.state.authenticated || !this.store.state.userIdentity) {
      return false;
    }

    if (!authorities) {
      return true;
    }

    const authList = Array.isArray(authorities) ? authorities : [authorities];
    if (authList.length === 0) {
      return true;
    }

    const currentRole = (this.store.getters.userRole() || '').toString().toLowerCase();
    const identityRole = (this.store.state.userIdentity?.role || '').toString().toLowerCase();
    const userAuthorities = (this.store.state.userIdentity?.authorities || []).map((a) =>
      a.toString().toLowerCase()
    );

    const userRoles = new Set([currentRole, identityRole, ...userAuthorities].filter(Boolean));

    // Mapeo bidireccional de sinónimos para compatibilidad total
    if (userRoles.has('teacher') || userRoles.has('functionary') || userRoles.has('role_teacher') || userRoles.has('role_functionary')) {
      userRoles.add('teacher');
      userRoles.add('functionary');
      userRoles.add('role_teacher');
      userRoles.add('role_functionary');
    }
    if (userRoles.has('moderator') || userRoles.has('front_desk_cs') || userRoles.has('role_moderator') || userRoles.has('role_front_desk_cs')) {
      userRoles.add('moderator');
      userRoles.add('front_desk_cs');
      userRoles.add('role_moderator');
      userRoles.add('role_front_desk_cs');
    }
    if (userRoles.has('admin') || userRoles.has('role_admin')) {
      userRoles.add('admin');
      userRoles.add('role_admin');
    }
    if (userRoles.has('student') || userRoles.has('user') || userRoles.has('role_student') || userRoles.has('role_user')) {
      userRoles.add('student');
      userRoles.add('user');
      userRoles.add('role_student');
      userRoles.add('role_user');
    }

    return authList.some((requiredAuth) => {
      const normalized = requiredAuth.toString().toLowerCase();
      return userRoles.has(normalized);
    });
  }

  /**
   * Cierra la sesión: borra el token del localStorage/sessionStorage
   * y limpia el estado del store en memoria.
   */
  logout() {
    clearStoredToken();
    this.store.actions.logout();
  }
}

export const accountService = new AccountService();
export default accountService;
