import { defineStore } from 'pinia';

const STORAGE_TOKEN = 'digiaduana_token';
const STORAGE_USER = 'digiaduana_user';

const ROLE_ALIASES = {
  forwarder: 'forwarder',
  freight_forwarder: 'forwarder',
  agente_carga: 'forwarder',
  administrador: 'admin',
  administrador_del_sistema: 'admin',
  admin: 'admin',
  supervisor: 'supervisor',
  supervisor_de_operaciones: 'supervisor',
  cliente: 'cliente',
  soporte: 'soporte',
  soporte_tecnico: 'soporte'
};

function normalizeRole(role) {
  if (!role) return '';
  const key = String(role)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  return ROLE_ALIASES[key] || key;
}

function parseJwt(token) {
  if (!token || token.split('.').length < 2) return null;
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

function readStoredToken() {
  return localStorage.getItem(STORAGE_TOKEN) || null;
}

function readStoredUser() {
  try {
    const stored = localStorage.getItem(STORAGE_USER);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveSession(token, user) {
  localStorage.setItem(STORAGE_TOKEN, token);
  localStorage.setItem(STORAGE_USER, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(STORAGE_TOKEN);
  localStorage.removeItem(STORAGE_USER);
}

export const useAuthStore = defineStore('auth', {
  state: () => {
    const token = readStoredToken();
    const user = readStoredUser();
    return {
      user,
      token,
      rol: normalizeRole(user?.rol || user?.role || parseJwt(token)?.rol || ''),
      isLoading: false
    };
  },

  getters: {
    isAuthenticated: (state) => Boolean(state.token) && !isTokenExpired(state.token),
    userRole: (state) => normalizeRole(state.rol || state.user?.rol || state.user?.role || parseJwt(state.token)?.rol || ''),
    userName: (state) => state.user?.nombre || state.user?.name || state.user?.correo || state.user?.email || 'Usuario DigiAduana'
  },

  actions: {
    async login(credentials) {
      this.isLoading = true;
      try {
        const response = await fetch('/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(credentials)
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.mensaje || 'Error en el inicio de sesión');
        }

        const token = payload.token;
        const usuario = payload.usuario || payload.user || {};

        saveSession(token, usuario);
        this.token = token;
        this.user = usuario;
        this.rol = normalizeRole(usuario.rol || usuario.role || parseJwt(token)?.rol || '');

        return payload;
      } finally {
        this.isLoading = false;
      }
    },

    logout() {
      clearSession();
      this.user = null;
      this.token = null;
      this.rol = '';
    },

    checkAuth() {
      const token = readStoredToken();
      const user = readStoredUser();

      if (!token || isTokenExpired(token)) {
        this.logout();
        return false;
      }

      this.token = token;
      this.user = user;
      this.rol = normalizeRole(user?.rol || user?.role || parseJwt(token)?.rol || '');
      return true;
    },

    hasRole(requiredRoles) {
      const allowed = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      return allowed.map(normalizeRole).includes(this.userRole);
    }
  }
});
