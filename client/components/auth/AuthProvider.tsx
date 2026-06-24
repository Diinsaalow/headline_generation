"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { apiFetch } from "@/lib/api";
import {
  getStoredToken,
  removeStoredToken,
  storeToken,
} from "@/lib/auth-storage";
import type { AuthResponse, User } from "@/lib/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  token: string | null;
  user: User | null;
  setSession: (payload: AuthResponse) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      const savedToken = getStoredToken();
      if (!savedToken) {
        if (!cancelled) {
          setStatus("unauthenticated");
        }
        return;
      }

      if (!cancelled) {
        setToken(savedToken);
      }

      try {
        const profile = await apiFetch<User>("/auth/me", { token: savedToken });
        if (cancelled) {
          return;
        }

        setUser(profile);
        setStatus("authenticated");
      } catch {
        if (cancelled) {
          return;
        }

        removeStoredToken();
        setToken(null);
        setUser(null);
        setStatus("unauthenticated");
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  function setSession(payload: AuthResponse) {
    storeToken(payload.access_token);
    setToken(payload.access_token);
    setUser(payload.user);
    setStatus("authenticated");
  }

  function logout() {
    removeStoredToken();
    setToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }

  async function refreshUser() {
    if (!token) {
      setStatus("unauthenticated");
      setUser(null);
      return;
    }

    const profile = await apiFetch<User>("/auth/me", { token });
    setUser(profile);
    setStatus("authenticated");
  }

  return (
    <AuthContext.Provider
      value={{ status, token, user, setSession, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
