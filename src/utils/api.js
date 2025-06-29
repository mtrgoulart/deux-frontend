export async function apiFetch(url, options = {}) {
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    const response = await fetch(`/api${url}`, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
        credentials: 'include',
    });

    if (response.status === 401) {
        window.location.href = '/login';
        return;
    }

    return response;
}
  