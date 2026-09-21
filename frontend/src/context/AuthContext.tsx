"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  getCurrentUser,
  getToken,
  loginUser,
  registerUser,
  setToken,
} from "@/lib/api";
import type { User, UserRole } from "@/types/user";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (
    name: string,
    email: string,
    password: string,
    role?: UserRole,
  ) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Restore the session on first load (page refresh, new tab, etc.)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }

      try {
        const current = await getCurrentUser();
        if (!cancelled) setUser(current);
      } catch {
        setToken(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: loggedInUser } = await loginUser({ email, password });
    setToken(token);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const signup = useCallback(
    async (name: string, email: string, password: string, role?: UserRole) => {
      const { token, user: newUser } = await registerUser({
        name,
        email,
        password,
        role,
      });
      setToken(token);
      setUser(newUser);
      return newUser;
    },
    [],
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
