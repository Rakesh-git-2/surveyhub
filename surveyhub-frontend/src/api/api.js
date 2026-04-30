const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
const getRefreshToken = () => (typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null);

const setTokens = (access, refresh) => {
  localStorage.setItem('token', access);
  if (refresh) localStorage.setItem('refreshToken', refresh);
};

const clearTokens = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const res = await fetch(`${BASE_URL}/api/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    clearTokens();
    return null;
  }

  const data = await res.json();
  setTokens(data.access, data.refresh);
  return data.access;
}

export const apiRequest = async ({ method = 'GET', url, params, data, headers = {} }, _retry = false) => {
  const token = getToken();

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  let fullUrl = `${BASE_URL}${url}`;
  if (method === 'GET' && params) {
    const query = new URLSearchParams(params).toString();
    if (query) fullUrl += `?${query}`;
  }

  const res = await fetch(fullUrl, {
    method,
    headers: defaultHeaders,
    body: method !== 'GET' && data ? JSON.stringify(data) : undefined,
  });

  if (res.status === 401 && !_retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiRequest({ method, url, params, data, headers }, true);
    }
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || errData.detail || `Request failed with status ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
};
