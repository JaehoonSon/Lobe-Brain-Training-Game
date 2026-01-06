import { Tabs } from "expo-router";
import { Sun, Gamepad2, BarChart3, Lightbulb } from "lucide-react-native";
import { useColorScheme } from "react-native";

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const activeTintColor = colorScheme === "dark" ? "#fff" : "#000";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeTintColor,
        tabBarStyle: {
          paddingTop: 8,
          height: 90,
          borderTopWidth: 1,
          borderColor: colorScheme === "dark" ? "#333" : "#e5e5e5",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ color }) => <Sun color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: "Games",
          tabBarIcon: ({ color }) => <Gamepad2 color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
          tabBarIcon: ({ color }) => <BarChart3 color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ color }) => <Lightbulb color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
