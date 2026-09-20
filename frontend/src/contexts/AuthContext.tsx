import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api, getToken, setToken } from '../lib/api';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
  setUser: (u: User) => void;
}

export interface RegisterData {
  name: string;
  mobile: string;
  email?: string;
  password: string;
  state: string;
  district: string;
  taluk?: string;
  village?: string;
  language: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUserState(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<{ user: User }>('/api/profile');
      setUserState(res.user);
    } catch {
      setToken(null);
      setUserState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (identifier: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>('/api/auth/login', { identifier, password });
    setToken(res.token);
    setUserState(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const res = await api.post<{ token: string; user: User }>('/api/auth/register', data);
    setToken(res.token);
    setUserState(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUserState(null);
  }, []);

  const setUser = useCallback((u: User) => setUserState(u), []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh, setUser }),
    [user, loading, login, register, logout, refresh, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
