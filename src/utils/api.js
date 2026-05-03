// utils/api.js
export async function apiFetch(url, options = {}) {
    const token = localStorage.getItem('authToken');
    const headers = { ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let response = await fetch(`/api${url}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    const isAuthEndpoint = ['/auth/refresh', '/auth/wallet-login', '/auth/wallet-nonce'].includes(url);
    if (response.status === 401 && !isAuthEndpoint) {
      // Try refresh
      const refreshTkn = localStorage.getItem('refreshToken');
      if (refreshTkn) {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshTkn }),
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          localStorage.setItem('authToken', data.access_token);
          localStorage.setItem('refreshToken', data.refresh_token);
          headers['Authorization'] = `Bearer ${data.access_token}`;
          response = await fetch(`/api${url}`, { ...options, headers, credentials: 'include' });
        } else {
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return;
        }
      } else {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        return;
      }
    }

    return response;
  }
