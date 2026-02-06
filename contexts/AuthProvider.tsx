import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "@supabase/supabase-js";
import * as AppleAuthentication from "expo-apple-authentication";
import Tenjin from "react-native-tenjin";
import { showErrorToast, showSuccessToast } from "~/components/ui/toast";
import { supabase } from "~/lib/supabase";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  onboardingComplete: boolean;
  isProfileLoading: boolean;
  logout: () => Promise<void>;
  signInApple: () => Promise<void>;
  signInGoogle: () => Promise<void>;
  markOnboardingComplete: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // Debug: Log auth state
  useEffect(() => {
    console.log("=== Auth State Debug ===");
    console.log("user:", user?.id ?? "null");
    console.log("onboardingComplete:", onboardingComplete);
    console.log("========================");
  }, [user, onboardingComplete]);

  // ----- Supabase session boot + listener -----
  useEffect(() => {
    let isMounted = true;

    const loadProfile = async (profileUser: User) => {
      try {
        setIsProfileLoading(true);
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("onboarding_completed_at")
          .eq("id", profileUser.id)
          .maybeSingle();

        if (!isMounted) return;

        if (error) {
          console.error("Failed to load onboarding status", error);
          setOnboardingComplete(false);
          return;
        }

        if (!profile) {
          console.warn("Profile missing; signing out");
          await supabase.auth.signOut();
          setOnboardingComplete(false);
          return;
        }

        setOnboardingComplete(!!profile.onboarding_completed_at);
      } catch (error) {
        if (!isMounted) return;
        console.error("Failed to load onboarding status", error);
        setOnboardingComplete(false);
      } finally {
        if (isMounted) setIsProfileLoading(false);
      }
    };

    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!isMounted) return;
        const nextUser = session?.user ?? null;
        setUser(nextUser);
        if (nextUser) {
          loadProfile(nextUser);
        } else {
          setOnboardingComplete(false);
          setIsProfileLoading(false);
        }
      } catch (error) {
        console.error("Failed to load auth session", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (nextUser) {
        loadProfile(nextUser);
      } else {
        setOnboardingComplete(false);
        setIsProfileLoading(false);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ----- Auth actions -----
  const logout = async () => {
    console.log("Logging out...");
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    console.log("Signed out from Supabase");

    try {
      if (user?.id) {
        await AsyncStorage.multiRemove([`onboarding_progress:${user.id}`]);
      }
    } catch (storageError) {
      console.error("Failed to clear onboarding storage", storageError);
    }

    console.log("Logout complete");
  };

  const signInApple = async () => {
    setIsSigningIn(true);
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
      console.log("Apple sign in result:", data, error);
      if (error) throw error;
      Tenjin.eventWithName("login");
    } finally {
      setIsSigningIn(false);
    }
  };

  // Google Sign-In is disabled for Expo Go compatibility
  // To enable, create a development build with native modules
  const signInGoogle = async () => {
    showErrorToast("Google Sign-In requires a development build");
    console.log("Google Sign-In is not available in Expo Go");
  };

  // ----- Allow external marking of onboarding complete -----
  const markOnboardingComplete = () => {
    setOnboardingComplete(true);
  };

  // ----- Memoized context value -----
  const value = useMemo<AuthContextType>(
    () => ({
      isAuthenticated: !!user,
      isLoading,
      user,
      onboardingComplete,
      isProfileLoading,
      logout,
      signInApple,
      signInGoogle,
      markOnboardingComplete,
    }),
    [
      user,
      isLoading,
      isSigningIn,
      onboardingComplete,
      isProfileLoading,
      logout,
      signInApple,
    ],
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
