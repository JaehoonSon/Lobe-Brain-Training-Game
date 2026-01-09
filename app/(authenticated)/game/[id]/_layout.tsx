import { Stack } from "expo-router";
import { GameSessionProvider } from "~/contexts/GameSessionContext";

export default function GameLayout() {
  return (
    <GameSessionProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
    </GameSessionProvider>
  );
}
