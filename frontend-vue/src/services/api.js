const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export function getStoredUser() {
  const raw = localStorage.getItem('digiaduana_user');
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    clearSession();
    return null;
  }
}

export function getToken() {
  return localStorage.getItem('digiaduana_token');
}

export function saveSession(data) {
  localStorage.setItem('digiaduana_token', data.token);
  localStorage.setItem('digiaduana_user', JSON.stringify(data.usuario));
}

export function clearSession() {
  localStorage.removeItem('digiaduana_token');
  localStorage.removeItem('digiaduana_user');
}

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (getToken()) headers.Authorization = `Bearer ${getToken()}`;

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.mensaje || 'No se pudo completar la solicitud');
  return data;
}
