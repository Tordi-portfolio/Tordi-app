import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.get('/api/accounts/me/');
      setUser(me);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const register = async (phoneNumber, password) => {
    const data = await api.post('/api/accounts/register/', { phone_number: phoneNumber, password });
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const login = async (phoneNumber, password) => {
    const data = await api.post('/api/accounts/login/', { phone_number: phoneNumber, password });
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/api/accounts/logout/');
    } catch {
      // ignore — logging out client-side regardless
    }
    setToken(null);
    setUser(null);
  };

  const updateUser = (partial) => setUser((prev) => (prev ? { ...prev, ...partial } : prev));

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, refreshUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
