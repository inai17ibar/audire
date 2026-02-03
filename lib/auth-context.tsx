import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Auth modes
export type AuthMode = "authenticated" | "guest" | "none";

// User type for authenticated users
export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}

// Auth context state
interface AuthContextState {
  mode: AuthMode;
  user: AuthUser | null;
  isLoading: boolean;
  // Actions
  loginAsGuest: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextState | undefined>(undefined);

const AUTH_STORAGE_KEY = "@audire_auth";

interface StoredAuth {
  mode: AuthMode;
  user: AuthUser | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AuthMode>("none");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state from storage on mount
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed: StoredAuth = JSON.parse(stored);
          setMode(parsed.mode);
          setUser(parsed.user);
        }
      } catch (error) {
        console.error("Failed to load auth state:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAuth();
  }, []);

  // Save auth state to storage
  const saveAuth = useCallback(async (newMode: AuthMode, newUser: AuthUser | null) => {
    try {
      const data: StoredAuth = { mode: newMode, user: newUser };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save auth state:", error);
    }
  }, []);

  // Login as guest
  const loginAsGuest = useCallback(async () => {
    const guestUser: AuthUser = {
      id: `guest_${Date.now()}`,
      name: "ゲストユーザー",
    };
    setMode("guest");
    setUser(guestUser);
    await saveAuth("guest", guestUser);
  }, [saveAuth]);

  // Login with email/password (mock implementation - replace with real auth)
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // For demo purposes, accept any non-empty credentials
    if (!email || !password) return false;
    
    const authUser: AuthUser = {
      id: `user_${Date.now()}`,
      name: email.split("@")[0],
      email,
    };
    setMode("authenticated");
    setUser(authUser);
    await saveAuth("authenticated", authUser);
    return true;
  }, [saveAuth]);

  // Register new user (mock implementation - replace with real auth)
  const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    if (!name || !email || !password) return false;
    
    const authUser: AuthUser = {
      id: `user_${Date.now()}`,
      name,
      email,
    };
    setMode("authenticated");
    setUser(authUser);
    await saveAuth("authenticated", authUser);
    return true;
  }, [saveAuth]);

  // Logout
  const logout = useCallback(async () => {
    setMode("none");
    setUser(null);
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        mode,
        user,
        isLoading,
        loginAsGuest,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAppAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAppAuth must be used within an AuthProvider");
  }
  return context;
}
