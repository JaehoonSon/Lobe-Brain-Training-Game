import "~/global.css";

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
import { SplashScreenController } from "./splash";
import { OnboardingProvider } from "~/contexts/OnboardingContext";
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

  const { isAuthenticated, isLoading } = useAuth();

  // Debug: Log auth state for routing decisions
  console.log("=== Root Layout Routing ===");
  console.log("isAuthenticated:", isAuthenticated);
  console.log("isLoading:", isLoading);
  console.log("Show authenticated:", isAuthenticated);
  console.log("Show unauthenticated:", !isAuthenticated);
  console.log("===========================");

  return (
    <ThemeProvider value={isDarkColorScheme ? LIGHT_THEME : LIGHT_THEME}>
      <StatusBar style={isDarkColorScheme ? "light" : "light"} />
      <Stack screenOptions={{ headerShown: false, animation: "none" }}>
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen
            name="(authenticated)"
            options={{ headerRight: () => <ThemeToggle /> }}
          />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={!isAuthenticated}>
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
} from "@expo-google-fonts/nunito";
import { ThemeProvider as AppThemeProvider } from "~/contexts/ThemeContext";

export default function RootLayout() {
  usePlatformSpecificSetup();

  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <AuthProvider>
          <OnboardingProvider>
            <SplashScreenController />
            <AppContent />
            <Toast config={toastConfig} />
          </OnboardingProvider>
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
