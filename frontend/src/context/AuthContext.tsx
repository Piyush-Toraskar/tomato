import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as authApi from "../api/auth";
import {
  clearSessionTokens,
  hasStoredRefreshToken,
  onSessionExpired,
  restoreStoredSession,
} from "../api/client";
import { getStableDeviceId } from "../lib/device";
import type {
  AuthUser,
  RegisterRequest,
  RegisterResponse,
} from "../types/auth";
import { useToast } from "./ToastContext";

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isInitialising: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  register: (payload: RegisterRequest) => Promise<RegisterResponse>;
  refreshProfile: () => Promise<AuthUser>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitialising, setIsInitialising] = useState(true);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const clearLocalSession = useCallback(() => {
    clearSessionTokens();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const refreshProfile = useCallback(async () => {
    const profile = await authApi.getCurrentUser();
    setUser(profile);
    return profile;
  }, []);

  useEffect(() => {
    let active = true;

    const initialise = async () => {
      try {
        if (!hasStoredRefreshToken()) {
          return;
        }

        const restored = await restoreStoredSession();
        if (!restored) {
          clearLocalSession();
          return;
        }

        const profile = await authApi.getCurrentUser();
        if (active) {
          setUser(profile);
        }
      } catch {
        if (active) {
          clearLocalSession();
        }
      } finally {
        if (active) {
          setIsInitialising(false);
        }
      }
    };

    void initialise();

    const unsubscribe = onSessionExpired(() => {
      clearLocalSession();
      showToast({
        title: "Session expired",
        description: "Please sign in again to continue.",
        tone: "info",
      });
    });

    if (!hasStoredRefreshToken()) {
      setIsInitialising(false);
    }

    return () => {
      active = false;
      unsubscribe();
    };
  }, [clearLocalSession, showToast]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    await authApi.loginAccount({
      ...credentials,
      device_id: getStableDeviceId(),
    });

    const profile = await authApi.getCurrentUser();
    setUser(profile);
    return profile;
  }, []);

  const register = useCallback((payload: RegisterRequest) => {
    return authApi.registerAccount(payload);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logoutCurrentDevice();
    } finally {
      clearLocalSession();
    }
  }, [clearLocalSession]);

  const logoutAll = useCallback(async () => {
    try {
      await authApi.logoutEveryDevice();
    } finally {
      clearLocalSession();
    }
  }, [clearLocalSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isInitialising,
      isAuthenticated: Boolean(user),
      login,
      register,
      refreshProfile,
      logout,
      logoutAll,
    }),
    [
      isInitialising,
      login,
      logout,
      logoutAll,
      refreshProfile,
      register,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
