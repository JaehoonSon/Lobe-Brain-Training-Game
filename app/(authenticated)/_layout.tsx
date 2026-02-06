import LoadingScreen from "../Loading";
import { Redirect, Stack } from "expo-router";
import { useAuth } from "~/contexts/AuthProvider";
import { GamesProvider } from "~/contexts/GamesContext";
import { UserStatsProvider } from "~/contexts/UserStatsContext";

export default function AuthenticatedLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading screen while auth status is being determined
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Double-check: If user somehow got here without auth, redirect away
  if (!isAuthenticated) {
    console.log(
      "Authenticated layout: User should not be here, redirecting...",
    );
    return <Redirect href="/" />;
  }

  return (
    <GamesProvider>
      <UserStatsProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="game/[id]"
            options={{
              gestureEnabled: false,
              presentation: "card",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              presentation: "pageSheet",
              animation: "default",
            }}
          />
          <Stack.Screen
            name="dev_setting"
            options={{
              presentation: "pageSheet",
              animation: "default",
            }}
          />
          <Stack.Screen
            name="streak"
            options={{
              presentation: "card",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="stat/[id]"
            options={{
              presentation: "card",
              animation: "slide_from_right",
            }}
          />
        </Stack>
      </UserStatsProvider>
    </GamesProvider>
  );
}
