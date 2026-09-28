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
   * Revisa si existe token en localStorage o sessionStorage.
   * Si ya hay sesión autenticada en el store, no vuelve a pedir la cuenta.
   */
  async loadAccount() {
    const token = this.getToken();
    if (!token) {
      this.store.actions.logout();
      return false;
    }

    if (this.store.state.authenticated && this.store.state.userIdentity) {
      return true;
    }

    return await this.retrieveAccount();
  }

  /**
   * Hace GET a /auth/profile.
   * Si responde 200 con usuario válido llama a store.setAuthentication(account);
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
    } catch {
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
   * Valida las autoridades/roles de la identidad actual con los 4 roles reales:
   * student | teacher | moderator | admin
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

    return authList.some((requiredAuth) => {
      const normalized = requiredAuth.toString().toLowerCase();
      // Admin tiene acceso total
      if (userRoles.has('admin')) return true;
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
