import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // Instale com: npm install jwt-decode

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('authToken'));

  useEffect(() => {
    try {
      if (token) {
        const decodedUser = jwtDecode(token);
        // Verifica se o token não expirou
        if (decodedUser.exp * 1000 > Date.now()) {
          setUser(decodedUser);
        } else {
          // Limpa se o token expirou
          localStorage.removeItem('authToken');
          setToken(null);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to decode JWT:", error);
      setUser(null);
    }
  }, [token]);

  // Função para ser chamada no login
  const login = (newToken) => {
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
  };

  // Função para ser chamada no logout
  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
  };

  const value = { user, token, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
