// utils/api.js
export async function apiFetch(url, options = {}) {
    const response = await fetch(`/api${url}`, {
      ...options,
      credentials: 'include', // importante se estiver usando cookies para sessão
    });
  
    if (response.status === 401) {
      // Redireciona para login se o token estiver expirado ou sessão inválida
      window.location.href = '/login';
      return;
    }
  
    return response;
  }
  