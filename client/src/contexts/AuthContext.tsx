import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";

interface AuthUser {
  id: number;
  username: string;
  email: string | null;
  name: string | null;
  role: string;
  themePreference: string;
  defaultModel: string | null;
  institution: string | null;
  fieldOfStudy: string | null;
  bio: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (username: string, password: string, email?: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "literai_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();
  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (meQuery.data) {
      setUser(meQuery.data as AuthUser);
      setLoading(false);
    } else if (meQuery.isError || (!token && !meQuery.isLoading)) {
      setUser(null);
      setLoading(false);
    }
  }, [meQuery.data, meQuery.isError, meQuery.isLoading, token]);

  const login = useCallback(async (identifier: string, password: string) => {
    const result = await loginMutation.mutateAsync({ identifier, password });
    localStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(result.user as AuthUser);
    // Set cookie for server-side auth
    document.cookie = `literai_token=${result.token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  }, [loginMutation]);

  const register = useCallback(async (username: string, password: string, email?: string, name?: string) => {
    const result = await registerMutation.mutateAsync({ username, password, email, name });
    localStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(result.user as AuthUser);
    document.cookie = `literai_token=${result.token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  }, [registerMutation]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("theme");
    setToken(null);
    setUser(null);
    document.cookie = "literai_token=; path=/; max-age=0";
    window.location.href = "/";
  }, []);

  const refreshUser = useCallback(() => {
    meQuery.refetch();
  }, [meQuery]);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
