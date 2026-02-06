import LoadingScreen from "../Loading";
import { Stack } from "expo-router";
import { useAuth } from "~/contexts/AuthProvider";

export default function UnAuthenticatedLayout() {
  const { isLoading } = useAuth();

  // Show loading screen while auth status is being determined
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Stack.Protected in root _layout.tsx handles routing based on auth
  // This layout just renders the unauthenticated screens
  return (
    <Stack screenOptions={{ headerShown: false, animation: "default" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
