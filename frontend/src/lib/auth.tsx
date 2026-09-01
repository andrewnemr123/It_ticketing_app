import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { api, getToken, setToken } from "@/lib/api";
import type { AuthResponse, User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ME_KEY = ["auth", "me"] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [hasToken, setHasToken] = useState<boolean>(() => Boolean(getToken()));

  // When a token is present, resolve the current user from the backend.
  const {
    data: user = null,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ME_KEY,
    queryFn: async () => {
      const res = await api.get<{ user: User }>("/auth/me");
      return res.user;
    },
    enabled: hasToken,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // An invalid/expired token: /auth/me failed, so stop treating it as logged in.
  useEffect(() => {
    if (isError) setHasToken(false);
  }, [isError]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post<AuthResponse>("/auth/login", { email, password });
      setToken(res.token);
      setHasToken(true);
      queryClient.setQueryData(ME_KEY, res.user);
      return res.user;
    },
    [queryClient],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await api.post<AuthResponse>("/auth/register", {
        name,
        email,
        password,
      });
      setToken(res.token);
      setHasToken(true);
      queryClient.setQueryData(ME_KEY, res.user);
      return res.user;
    },
    [queryClient],
  );

  const logout = useCallback(() => {
    setToken(null);
    setHasToken(false);
    queryClient.setQueryData(ME_KEY, null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading: hasToken && isLoading,
      login,
      register,
      logout,
    }),
    [user, hasToken, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
