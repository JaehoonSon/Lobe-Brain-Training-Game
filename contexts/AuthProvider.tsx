import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "~/lib/supabase";
import type { User } from "@supabase/supabase-js";
import * as AppleAuthentication from "expo-apple-authentication";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean; // auth loading (Supabase)
  user: User | null;
  logout: () => Promise<void>;
  signInApple: () => Promise<void>;
  signInGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false); // Track sign-in in progress

  // Debug: Log auth state
  useEffect(() => {
    console.log("=== Auth State Debug ===");
    console.log("user:", user?.id ?? "null");
    console.log("========================");
  }, [user]);

  // ----- Supabase session boot + listener -----
  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsLoading(false);
    };
    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ----- Auth actions -----
  const logout = async () => {
    console.log("Logging out...");

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    console.log("Signed out from Supabase");

    console.log("Logout complete");
  };

  const signInApple = async () => {
    setIsSigningIn(true); // Start signing in - prevents premature redirects

    try {
      const cred = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!cred.identityToken) throw new Error("No identityToken.");

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: cred.identityToken,
      });
      if (error) throw error;
      const id = await data.user.id;
    } finally {
      setIsSigningIn(false); // Done signing in
    }
  };

  const signInGoogle = async () => {
    // Placeholder for Google Sign In
    console.warn("Google Sign In not yet configured with native libraries");
    // TODO: Install @react-native-google-signin/google-signin and configure
  };

  // ----- Memoized context value -----
  const value = useMemo<AuthContextType>(
    () => ({
      isAuthenticated: !!user,
      isLoading: isLoading || isSigningIn, // Include signing in as loading state
      user,
      logout,
      signInApple,
      signInGoogle,
    }),
    [user, isLoading, isSigningIn, logout, signInApple]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
