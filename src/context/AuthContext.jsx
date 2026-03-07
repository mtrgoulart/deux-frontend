import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('authToken'));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refreshToken'));
  const [requires2FA, setRequires2FA] = useState(false);

  useEffect(() => {
    try {
      if (token) {
        const decodedUser = jwtDecode(token);
        if (decodedUser.exp * 1000 > Date.now()) {
          // Map Keycloak JWT fields to app user format
          setUser({
            user_id: decodedUser.neo_user_id || decodedUser.user_id,
            group: extractGroup(decodedUser),
            username: decodedUser.preferred_username || decodedUser.username,
            exp: decodedUser.exp,
            iat: decodedUser.iat
          });
        } else {
          clearAuth();
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to decode JWT:", error);
      setUser(null);
    }
  }, [token]);

  // Auto-refresh timer: refresh 2 minutes before expiry
  useEffect(() => {
    if (!token || !refreshToken) return;

    try {
      const decoded = jwtDecode(token);
      const msUntilRefresh = (decoded.exp * 1000) - Date.now() - 120000; // 2 min before expiry

      const timer = setTimeout(async () => {
        try {
          const res = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
          });
          if (res.ok) {
            const data = await res.json();
            localStorage.setItem('authToken', data.access_token);
            localStorage.setItem('refreshToken', data.refresh_token);
            setToken(data.access_token);
            setRefreshToken(data.refresh_token);
          } else {
            clearAuth();
          }
        } catch {
          clearAuth();
        }
      }, Math.max(msUntilRefresh, 0));

      return () => clearTimeout(timer);
    } catch {
      // Invalid token, ignore
    }
  }, [token, refreshToken]);

  const login = useCallback((accessToken, refreshTkn, requires2fa = false) => {
    if (requires2fa) {
      setRequires2FA(true);
      sessionStorage.setItem('pending2faUsername', accessToken); // temporarily store username
      return;
    }
    localStorage.setItem('authToken', accessToken);
    if (refreshTkn) {
      localStorage.setItem('refreshToken', refreshTkn);
      setRefreshToken(refreshTkn);
    }
    setToken(accessToken);
    setRequires2FA(false);
  }, []);

  const logout = useCallback(async () => {
    const rt = localStorage.getItem('refreshToken');
    if (rt) {
      try {
        await fetch('/api/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: rt })
        });
      } catch {
        // Best effort
      }
    }
    clearAuth();
  }, []);

  const clearAuth = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('pending2faUsername');
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    setRequires2FA(false);
  };

  const value = { user, token, refreshToken, requires2FA, login, logout, setRequires2FA };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

function extractGroup(decoded) {
  // Keycloak: realm_access.roles contains role names
  const roles = decoded.realm_access?.roles || [];
  for (const role of ['Admin', 'Developer', 'User', 'Guest']) {
    if (roles.includes(role)) return role;
  }
  // Fallback for legacy tokens
  return decoded.group || 'User';
}

export const useAuth = () => {
  return useContext(AuthContext);
};
