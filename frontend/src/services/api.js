// =============================================================================
// MODIFICACIÓN 4 — CLIENTE HTTP CENTRALIZADO (API BASE)
// Responsable: Integrante 4 (Admin / Arquitectura de Conexión)
// =============================================================================

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Helper para realizar peticiones fetch estandarizadas al backend
 */
async function request(endpoint, options = {}) {
  const { method = 'GET', body, token, isFormData = false } = options;
  
  const headers = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // Si la respuesta es un archivo binario (ej. PDF)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/pdf')) {
    if (!response.ok) throw new Error('Error al descargar el archivo PDF');
    return response.blob();
  }

  // Parsear JSON
  let data = {};
  try {
    data = await response.json();
  } catch (e) {
    // Respuesta vacía o no JSON
  }

  if (!response.ok) {
    const errorMsg = data.message || data.error || `Error HTTP ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  get: (endpoint, token) => request(endpoint, { method: 'GET', token }),
  post: (endpoint, body, token, isFormData = false) => request(endpoint, { method: 'POST', body, token, isFormData }),
  patch: (endpoint, body, token) => request(endpoint, { method: 'PATCH', body, token }),
  delete: (endpoint, token) => request(endpoint, { method: 'DELETE', token }),
};
