import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('zaika-user');
    return stored ? JSON.parse(stored) : null;
  });
  const [tokenReady, setTokenReady] = useState(false);

  useEffect(() => {
    setTokenReady(true);
  }, []);

  const persistSession = (session) => {
    localStorage.setItem('zaika-token', session.token);
    localStorage.setItem('zaika-user', JSON.stringify(session.user));
    setUser(session.user);
  };

  const login = async (email, password) => {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    persistSession(data);
    return data;
  };

  const register = async (payload) => {
    const data = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    persistSession({ token: data.token, user: { id: data.id, name: data.name, email: data.email, role: data.role } });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('zaika-token');
    localStorage.removeItem('zaika-user');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, register, logout, isReady: tokenReady }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
