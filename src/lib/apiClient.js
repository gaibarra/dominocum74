const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const API_KEY = import.meta.env.VITE_API_KEY || '';
const UPLOADS_BASE_URL = import.meta.env.VITE_UPLOADS_PUBLIC_BASE_URL || API_BASE_URL;

const defaultHeaders = ({ includeJson = true } = {}) => ({
  ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
  'x-api-key': API_KEY,
});

const authHeaders = () => ({
  'x-api-key': API_KEY,
});

const handleResponse = async (response) => {
  if (response.ok) {
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }
  let message = 'Error inesperado en la API';
  try {
    const body = await response.json();
    message = body?.message || body?.error || message;
  } catch {}
  const error = new Error(message);
  error.status = response.status;
  throw error;
};

export const apiClient = {
  get: async (path) => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: defaultHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  },
  post: async (path, body) => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify(body),
      credentials: 'include',
    });
    return handleResponse(res);
  },
  patch: async (path, body) => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PATCH',
      headers: defaultHeaders(),
      body: JSON.stringify(body),
      credentials: 'include',
    });
    return handleResponse(res);
  },
  put: async (path, body) => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      headers: defaultHeaders(),
      body: JSON.stringify(body),
      credentials: 'include',
    });
    return handleResponse(res);
  },
  delete: async (path, body) => {
    const hasBody = body !== undefined && body !== null;
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: defaultHeaders({ includeJson: hasBody }),
      body: hasBody ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });
    return handleResponse(res);
  },
  postForm: async (path, formData) => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
      credentials: 'include',
    });
    return handleResponse(res);
  },
};

export const apiConfig = {
  baseUrl: API_BASE_URL,
  apiKey: API_KEY,
  uploadsBaseUrl: UPLOADS_BASE_URL,
};
