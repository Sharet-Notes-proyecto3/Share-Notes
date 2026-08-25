const API_BASE_URL = 'http://localhost:3000/api';

export const getStoredToken = () => localStorage.getItem('token') || '';

export const setStoredToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  }
};

export const clearStoredToken = () => localStorage.removeItem('token');

const buildHeaders = (headers = {}, isFormData = false) => {
  const nextHeaders = { ...headers };

  if (!isFormData && !nextHeaders['Content-Type'] && !nextHeaders['content-type']) {
    nextHeaders['Content-Type'] = 'application/json';
  }

  const token = getStoredToken();
  if (token && !nextHeaders.Authorization) {
    nextHeaders.Authorization = `Bearer ${token}`;
  }

  return nextHeaders;
};

export async function apiRequest(endpoint, options = {}) {
  const { body, headers = {}, ...restOptions } = options;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...restOptions,
    headers: buildHeaders(headers, isFormData),
    body: body !== undefined ? body : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json') || contentType.includes('+json');
  const isBinary = /application\/pdf|application\/octet-stream|image\//i.test(contentType) || contentType.includes('application/vnd');

  let payload;

  if (isBinary) {
    payload = await response.blob();
  } else if (isJson) {
    payload = await response.json();
  } else if (response.status === 204) {
    payload = null;
  } else {
    payload = await response.text();
  }

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && payload.message) ||
      (typeof payload === 'string' && payload) ||
      'Error en la petición';

    throw new Error(message);
  }

  return payload;
}

const api = {
  get: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) =>
    apiRequest(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),
  patch: (endpoint, body, options = {}) =>
    apiRequest(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),
  put: (endpoint, body, options = {}) =>
    apiRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),
  delete: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
