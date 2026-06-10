const BASE_URL = 'http://127.0.0.1:8000/api';

export interface FetchOptions extends RequestInit {
  data?: any;
}

export async function apiFetch(path: string, options: FetchOptions = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('e_rw_token') : null;

  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let body = options.body;
  if (options.data && !body) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(options.data);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    body,
  });

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('e_rw_token');
      localStorage.removeItem('e_rw_user');
      // If we are not on the login page, redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || 'Terjadi kesalahan sistem.';
    const errors = data?.errors || null;
    throw { message: errorMsg, errors, status: response.status };
  }

  return data;
}
