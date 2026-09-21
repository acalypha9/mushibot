"use client";

import { createContext, useContext, useState, type ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, setToken, isTokenExpired, registerOnUnauthorized } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "CUSTOMER" | "CS_AGENT" | "ADMIN" | "MEMBER" | "USER";
  is_active: boolean;
  avatar_url?: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  setError: (err: string | null) => void;
}

const AUTH_TOKEN_KEY = "auth_token";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getInitialToken(): string | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!stored || isTokenExpired(stored)) {
    if (stored) localStorage.removeItem(AUTH_TOKEN_KEY);
    return null;
  }
  return stored;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setLocalToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setErrorState] = useState<string | null>(null);
  const router = useRouter();

  // Listen to 401 unauthorized triggers across the app
  useEffect(() => {
    const unbind = registerOnUnauthorized(() => {
      setLocalToken(null);
      setUser(null);
    });
    return () => unbind();
  }, []);

  // Initialize auth state safely on client mount to prevent SSR hydration mismatch
  useEffect(() => {
    const initialToken = getInitialToken();
    if (!initialToken) {
      setToken(null);
      setLocalToken(null);
      setUser(null);
      setLoading(false);
      return;
    }

    setToken(initialToken);
    setLocalToken(initialToken);
    api.get<User>("/api/auth/me")
      .then((me) => {
        setUser(me);
      })
      .catch(() => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setToken(null);
        setLocalToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === AUTH_TOKEN_KEY) {
        const newToken = e.newValue;
        if (newToken && !isTokenExpired(newToken)) {
          setToken(newToken);
          setLocalToken(newToken);
          setLoading(true);
          api.get<User>("/api/auth/me")
            .then((me) => setUser(me))
            .catch(() => {
              setToken(null);
              setLocalToken(null);
              setUser(null);
            })
            .finally(() => setLoading(false));
        } else {
          setToken(null);
          setLocalToken(null);
          setUser(null);
          setLoading(false);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    // Purge previous stale token before login
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setLocalToken(null);
    setUser(null);
    setLoading(true);
    setErrorState(null);

    try {
      const data = await api.post<{ access_token: string }>("/api/auth/login", { email, password });

      const accessToken = data.access_token;
      localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
      setToken(accessToken);
      setLocalToken(accessToken);

      const meData = await api.get<User>("/api/auth/me");
      setUser(meData);
      setLoading(false);
      return meData;
    } catch (err) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : "An error occurred";
      setErrorState(msg);
      throw err;
    }
  };

  const register = async (email: string, password: string, fullName: string): Promise<void> => {
    setLoading(true);
    setErrorState(null);
    try {
      await api.post("/api/auth/register-customer", { email, password, full_name: fullName });
      setLoading(false);
    } catch (err) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : "An error occurred";
      setErrorState(msg);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setLocalToken(null);
    setUser(null);
    setErrorState(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        error,
        login,
        register,
        logout,
        setError: setErrorState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
