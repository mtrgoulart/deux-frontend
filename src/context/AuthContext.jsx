import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

function formatWalletAddress(addr) {
  return addr ? addr.slice(0, 6) + '...' + addr.slice(-4) : null;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('authToken'));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refreshToken'));
  const [requires2FA, setRequires2FA] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    try {
      if (token) {
        const decodedUser = jwtDecode(token);
        if (decodedUser.exp * 1000 > Date.now()) {
          // Set user from JWT claims, preserving walletAddress from previous state
          // to avoid race condition during token refresh
          setUser(prev => ({
            user_id: decodedUser.neo_user_id || decodedUser.user_id,
            group: extractGroup(decodedUser),
            displayName: decodedUser.display_name || decodedUser.preferred_username || formatWalletAddress(decodedUser.wallet_address),
            walletAddress: decodedUser.wallet_address || prev?.walletAddress,
            username: decodedUser.preferred_username || decodedUser.username,
            exp: decodedUser.exp,
            iat: decodedUser.iat
          }));
          // Hydrate user from server (DB-backed, has wallet_address even if JWT doesn't)
          fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
            .then(res => res.ok ? res.json() : null)
            .then(serverUser => {
              if (serverUser) {
                setUser(prev => prev ? {
                  ...prev,
                  walletAddress: serverUser.wallet_address || prev.walletAddress,
                  displayName: serverUser.display_name || prev.displayName,
                  group: serverUser.group || prev.group,
                } : prev);
              }
              setProfileLoaded(true);
            })
            .catch(() => { setProfileLoaded(true); });
        } else {
          clearAuth();
        }
      } else {
        setUser(null);
        setProfileLoaded(false);
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

  const updateUser = useCallback((updates) => {
    setUser(prev => prev ? { ...prev, ...updates } : prev);
  }, []);

  const value = { user, token, refreshToken, requires2FA, profileLoaded, login, logout, setRequires2FA, updateUser };

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
