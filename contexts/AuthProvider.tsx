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
import { showErrorToast } from "~/components/ui/toast";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Required for web browser redirect handling
WebBrowser.maybeCompleteAuthSession();

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
          await loadProfile(nextUser);
        } else {
          setOnboardingComplete(false);
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
        await loadProfile(nextUser);
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
      await AsyncStorage.multiRemove([
        "onboarding_progress:anon",
        `onboarding_progress:${user?.id ?? "anon"}`,
      ]);
    } catch (storageError) {
      console.error("Failed to clear onboarding storage", storageError);
    }

    console.log("Logout complete");
  };

  const signInApple = async () => {
    setIsSigningIn(true);
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
    } finally {
      setIsSigningIn(false);
    }
  };

  const signInGoogle = async () => {
    setIsSigningIn(true);
    try {
      // Create redirect URL for your app
      const redirectUrl = makeRedirectUri();
      console.log("Google OAuth Redirect URI:", redirectUrl);
      // Add this URL to Supabase Dashboard > Auth > URL Configuration > Redirect URLs

      // Start OAuth flow - get the URL from Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true, // We handle the browser manually
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("No OAuth URL from Supabase");

      // Open browser for Google login
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl,
      );

      if (result.type === "success" && result.url) {
        // Parse the tokens from the URL (Supabase returns them as hash fragments)
        const hashParams = new URLSearchParams(result.url.split("#")[1]);
        const access_token = hashParams.get("access_token");
        const refresh_token = hashParams.get("refresh_token");

        if (access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (sessionError) throw sessionError;
        }
      }
    } catch (error) {
      console.log("Google Sign In Error:", error);
      showErrorToast("Error signing in with Google");
    } finally {
      setIsSigningIn(false);
    }
    setIsSigningIn(true);
    try {
      // Create redirect URL for your app
      const redirectUrl = makeRedirectUri();
      console.log("Google OAuth Redirect URI:", redirectUrl);
      // Add this URL to Supabase Dashboard > Auth > URL Configuration > Redirect URLs

      // Start OAuth flow - get the URL from Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true, // We handle the browser manually
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("No OAuth URL from Supabase");

      // Open browser for Google login
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl,
      );

      if (result.type === "success" && result.url) {
        // Parse the tokens from the URL (Supabase returns them as hash fragments)
        const hashParams = new URLSearchParams(result.url.split("#")[1]);
        const access_token = hashParams.get("access_token");
        const refresh_token = hashParams.get("refresh_token");

        if (access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (sessionError) throw sessionError;
        }
      }
    } catch (error) {
      console.log("Google Sign In Error:", error);
      showErrorToast("Error signing in with Google");
    } finally {
      setIsSigningIn(false);
    }
  };

  // ----- Allow external marking of onboarding complete -----
  const markOnboardingComplete = () => {
    setOnboardingComplete(true);
  };

  // ----- Memoized context value -----
  const value = useMemo<AuthContextType>(
    () => ({
      isAuthenticated: !!user,
      isLoading, // Don't include isSigningIn - it causes screen changes
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
