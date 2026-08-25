// =============================================================================
// MODIFICACIÓN 4 — CLIENTE HTTP CENTRALIZADO (API BASE)
// Responsable: Integrante 4 (Admin / Arquitectura de Conexión)
// =============================================================================

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const getStoredToken = () => localStorage.getItem('token') || '';

export const setStoredToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  }
};

export const clearStoredToken = () => localStorage.removeItem('token');

/**
 * Helper para realizar peticiones fetch estandarizadas al backend
 */
export async function apiRequest(endpoint, options = {}) {
  const { method = 'GET', body, token, isFormData: customIsFormData, headers = {}, ...restOptions } = options;
  const isFormData = customIsFormData || (typeof FormData !== 'undefined' && body instanceof FormData);

  const nextHeaders = { ...headers };
  if (!isFormData && !nextHeaders['Content-Type'] && !nextHeaders['content-type']) {
    nextHeaders['Content-Type'] = 'application/json';
  }

  const authToken = token || getStoredToken();
  if (authToken && !nextHeaders.Authorization) {
    nextHeaders.Authorization = `Bearer ${authToken}`;
  }

  const config = {
    method,
    headers: nextHeaders,
    ...restOptions,
  };

  if (body !== undefined) {
    config.body = isFormData ? body : (typeof body === 'string' ? body : JSON.stringify(body));
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  const contentType = response.headers.get('content-type') || '';
  const isBinary = contentType.includes('application/pdf') || /application\/octet-stream|image\//i.test(contentType);

  if (isBinary) {
    if (!response.ok) throw new Error('Error al descargar archivo binario');
    return response.blob();
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    // Respuesta vacía o no JSON
  }

  if (!response.ok) {
    const errorMsg = (data && data.message) || (data && data.error) || `Error HTTP ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  get: (endpoint, tokenOrOptions) => {
    const options = typeof tokenOrOptions === 'string' ? { token: tokenOrOptions } : (tokenOrOptions || {});
    return apiRequest(endpoint, { ...options, method: 'GET' });
  },
  post: (endpoint, body, tokenOrOptions, isFormData = false) => {
    let options = {};
    if (typeof tokenOrOptions === 'string') {
      options = { token: tokenOrOptions, isFormData };
    } else if (tokenOrOptions && typeof tokenOrOptions === 'object') {
      options = tokenOrOptions;
    }
    return apiRequest(endpoint, { ...options, method: 'POST', body, isFormData: isFormData || options.isFormData });
  },
  patch: (endpoint, body, tokenOrOptions) => {
    const options = typeof tokenOrOptions === 'string' ? { token: tokenOrOptions } : (tokenOrOptions || {});
    return apiRequest(endpoint, { ...options, method: 'PATCH', body });
  },
  put: (endpoint, body, tokenOrOptions) => {
    const options = typeof tokenOrOptions === 'string' ? { token: tokenOrOptions } : (tokenOrOptions || {});
    return apiRequest(endpoint, { ...options, method: 'PUT', body });
  },
  delete: (endpoint, tokenOrOptions) => {
    const options = typeof tokenOrOptions === 'string' ? { token: tokenOrOptions } : (tokenOrOptions || {});
    return apiRequest(endpoint, { ...options, method: 'DELETE' });
  },
};

export default api;
