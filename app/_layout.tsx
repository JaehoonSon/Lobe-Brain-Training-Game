import "~/global.css";
import "~/lib/i18n";

import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as React from "react";
import { Appearance, Platform } from "react-native";
import { NAV_THEME } from "~/lib/constants";
import { useColorScheme } from "~/lib/useColorScheme";
import { PortalHost } from "@rn-primitives/portal";
import { ThemeToggle } from "~/components/ThemeToggle";
import { setAndroidNavigationBar } from "~/lib/android-navigation-bar";
import { AuthProvider, useAuth } from "~/contexts/AuthProvider";
import {
  RevenueCatProvider,
  useRevenueCat,
} from "~/contexts/RevenueCatProvider";
import { PostHogProvider } from "~/contexts/PostHogProvider";
import { SplashScreenController } from "./splash";
import {
  OnboardingProvider,
  useOnboarding,
} from "~/contexts/OnboardingContext";
import Toast from "react-native-toast-message";
import { toastConfig } from "~/components/ui/toast";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const LIGHT_THEME: Theme = {
  ...DefaultTheme,
  colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
  ...DarkTheme,
  colors: NAV_THEME.dark,
};

const PROFILE_LOAD_FALLBACK_MS = 8000;

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

const usePlatformSpecificSetup = Platform.select({
  web: useSetWebBackgroundClassName,
  android: useSetAndroidNavigationBar,
  default: noop,
});

function AppContent() {
  const { isDarkColorScheme } = useColorScheme();

  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    onboardingComplete,
    isProfileLoading,
  } = useAuth();
  const { isComplete, isLoading: isOnboardingLoading } = useOnboarding();
  const { isPro } = useRevenueCat();

  const [profileLoadTimedOut, setProfileLoadTimedOut] = React.useState(false);

  React.useEffect(() => {
    if (!isAuthenticated || !isProfileLoading) {
      setProfileLoadTimedOut(false);
      return;
    }

    const timer = setTimeout(() => {
      setProfileLoadTimedOut(true);
    }, PROFILE_LOAD_FALLBACK_MS);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isProfileLoading]);

  const isAppLoading =
    isAuthLoading ||
    isOnboardingLoading ||
    (isAuthenticated && isProfileLoading && !profileLoadTimedOut);

  const allowUnauthenticated = !isAuthenticated || profileLoadTimedOut;
  const allowOnboarding =
    isAuthenticated && !onboardingComplete && !profileLoadTimedOut;
  const allowAuthenticated =
    isAuthenticated && onboardingComplete && !profileLoadTimedOut;

  // Debug: Log auth state for routing decisions
  console.log("=== Root Layout Routing ===");
  console.log("isAuthenticated:", isAuthenticated);
  console.log("isAuthLoading:", isAuthLoading);
  console.log("isOnboardingLoading:", isOnboardingLoading);
  console.log("isComplete:", isComplete);
  console.log("onboardingComplete:", onboardingComplete);
  console.log("isPro:", isPro);
  console.log("===========================");

  if (isAppLoading) {
    return null;
  }

  return (
    <ThemeProvider value={isDarkColorScheme ? LIGHT_THEME : LIGHT_THEME}>
      <StatusBar style={isDarkColorScheme ? "light" : "light"} />
      <Stack screenOptions={{ headerShown: false, animation: "none" }}>
        {/* Onboarding Flow: Authenticated but not complete */}
        <Stack.Protected guard={allowOnboarding}>
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        </Stack.Protected>

        {/* Authenticated Flow: Authenticated and complete */}
        <Stack.Protected guard={allowAuthenticated}>
          <Stack.Screen
            name="(authenticated)"
            options={{ headerRight: () => <ThemeToggle /> }}
          />
        </Stack.Protected>

        {/* Unauthenticated Flow: Not authenticated */}
        <Stack.Protected guard={allowUnauthenticated}>
          <Stack.Screen
            name="(unauthenticated)"
            options={{ headerShown: false }}
          />
        </Stack.Protected>
      </Stack>
      <PortalHost />
    </ThemeProvider>
  );
}

import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from "@expo-google-fonts/nunito";
import { ThemeProvider as AppThemeProvider } from "~/contexts/ThemeContext";

export default function RootLayout() {
  usePlatformSpecificSetup();

  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <AuthProvider>
          <PostHogProvider>
            <OnboardingProvider>
              <RevenueCatProvider>
                <SplashScreenController />
                <AppContent />
                <Toast config={toastConfig} />
              </RevenueCatProvider>
            </OnboardingProvider>
          </PostHogProvider>
        </AuthProvider>
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}

const useIsomorphicLayoutEffect =
  Platform.OS === "web" && typeof window === "undefined"
    ? React.useEffect
    : React.useLayoutEffect;

function useSetWebBackgroundClassName() {
  useIsomorphicLayoutEffect(() => {
    // Adds the background color to the html element to prevent white background on overscroll.
    document.documentElement.classList.add("bg-background");
  }, []);
}

function useSetAndroidNavigationBar() {
  React.useLayoutEffect(() => {
    setAndroidNavigationBar(Appearance.getColorScheme() ?? "light");
  }, []);
}

function noop() {}
