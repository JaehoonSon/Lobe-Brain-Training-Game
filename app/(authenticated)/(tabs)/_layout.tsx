import { Tabs } from "expo-router";
import { Sun, Gamepad2, BarChart3, Lightbulb } from "lucide-react-native";
import { useColorScheme } from "react-native";

export default function TabsLayout() {
  const colorScheme = useColorScheme();

  // Colors from global.css design system
  const colors = {
    light: {
      primary: "#fa8b4b", // --primary: 21.9 94.6% 63.7%
      muted: "#6e6e6e", // --muted-foreground: 0 0% 43.1%
      border: "#d4d4d4", // --border: 0 0% 83.1%
      background: "#fef8f0", // --background: 34.3 87.5% 96.9%
    },
    dark: {
      primary: "#fafafa", // --primary (dark): 0 0% 98%
      muted: "#a3a3a3", // --muted-foreground (dark): 240 5% 64.9%
      border: "#282828", // --border (dark): 240 3.7% 15.9%
      background: "#0a0a0b", // --background (dark): 240 10% 3.9%
    },
  };

  const theme = colorScheme === "dark" ? colors.dark : colors.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.muted,
        tabBarStyle: {
          paddingTop: 8,
          height: 90,
          borderTopWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.background,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ color }) => (
            <Sun color={color} size={24} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: "Games",
          tabBarIcon: ({ color }) => (
            <Gamepad2 color={color} size={24} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
          tabBarIcon: ({ color }) => (
            <BarChart3 color={color} size={24} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ color }) => (
            <Lightbulb color={color} size={24} strokeWidth={2.5} />
          ),
        }}
      />
    </Tabs>
  );
}
