import {
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "~/contexts/AuthProvider";
import { H1, H3, H4, P, Muted, Large } from "~/components/ui/typography";
import { Card, CardHeader, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import {
  X,
  Lock,
  Calculator,
  BookA,
  Heart,
  Mountain,
  Clock,
  Zap,
} from "lucide-react-native";
import { router } from "expo-router";
import { Database } from "~/lib/database.types";
import { useState } from "react";
import React from "react";
import { AuthenticatedHeader } from "~/components/AuthenticatedHeader";

// define Game using the DB type
type Game = Database["public"]["Tables"]["games"]["Row"];

// Mock data conforming to the type
const MOCK_GAMES: Game[] = [
  {
    id: "1",
    name: "Math",
    description: "Challenge your estimation and calculation skills.",
    icon_url: "math",
    banner_url: null,
    category_id: "math",
    created_at: new Date().toISOString(),
    instructions: null,
    is_active: true,
  },
  {
    id: "2",
    name: "Language",
    description: "Dive deep into your vocabulary and reading skills.",
    icon_url: "language",
    banner_url: null,
    category_id: "language",
    created_at: new Date().toISOString(),
    instructions: null,
    is_active: true,
  },
  {
    id: "3",
    name: "Favorites",
    description: "Treat your brain to the games you play the most.",
    icon_url: "favorites",
    banner_url: null,
    category_id: "favorites",
    created_at: new Date().toISOString(),
    instructions: null,
    is_active: true,
  },
  {
    id: "4",
    name: "Strengthen",
    description: "Play your weakest games and raise your low game scores.",
    icon_url: "strengthen",
    banner_url: null,
    category_id: "strengthen",
    created_at: new Date().toISOString(),
    instructions: null,
    is_active: true,
  },
  {
    id: "5",
    name: "Quick",
    description: "Race through short games in 8 minutes or less.",
    icon_url: "quick",
    banner_url: null,
    category_id: "quick",
    created_at: new Date().toISOString(),
    instructions: null,
    is_active: true,
  },
];

const getGameIcon = (iconUrl: string | null, color: string) => {
  const size = 36; // Increased for better mobile visibility
  switch (iconUrl) {
    case "math":
      return <Calculator color={color} size={size} />;
    case "language":
      return <BookA color={color} size={size} />;
    case "favorites":
      return <Heart color={color} size={size} />;
    case "strengthen":
      return <Mountain color={color} size={size} />;
    case "quick":
      return <Clock color={color} size={size} />;
    default:
      return <Zap color={color} size={size} />;
  }
};

// Decorative: unique game category colors for visual variety
const getGameColor = (iconUrl: string | null) => {
  switch (iconUrl) {
    case "math":
      return "bg-accent"; // Pink/Rose from theme
    case "language":
      return "bg-secondary"; // Magenta from theme
    case "favorites":
      return "bg-primary"; // Orange from theme
    case "strengthen":
      return "bg-accent"; // Uses accent color
    case "quick":
      return "bg-secondary"; // Uses secondary color
    default:
      return "bg-primary";
  }
};

export default function Dashboard() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const userName = user?.user_metadata?.full_name || "User";
  const firstName = userName.split(" ")[0];

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      {/* Sticky Top Bar */}
      <View className="px-6 pt-2 pb-2 bg-background z-10">
        <AuthenticatedHeader />
      </View>

      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="px-6 pb-6">
          {/* Greetings */}
          <H1 className="mb-6 pt-4">Hi, {firstName}</H1>

          {/* Daily Workout Card */}
          <Card className="mb-6 overflow-hidden border-border bg-card shadow-sm">
            <CardContent className="p-8 items-center gap-4">
              {/* Placeholder for Brain Icon */}
              <View className="w-28 h-28 rounded-full bg-primary/20 items-center justify-center mb-2">
                <View className="w-20 h-20 rounded-full bg-primary items-center justify-center">
                  <Zap size={48} color="white" fill="white" />
                </View>
              </View>

              <View className="items-center">
                <H3 className="text-3xl font-bold text-center">
                  Daily Workout
                </H3>
                <P className="text-muted-foreground text-center mt-2 text-lg">
                  {today} | 3 Games
                </P>
              </View>

              <Button size="xl" className="w-52 bg-primary active:bg-primary/80 rounded-full mt-3">
                <Text className="text-primary-foreground font-bold">
                  Start
                </Text>
              </Button>
            </CardContent>
          </Card>

          {/* More Workouts Section */}
          <View className="flex-row justify-between items-center mb-4">
            <H3 className="text-2xl">More Workouts</H3>
            <TouchableOpacity className="bg-secondary rounded-full px-4 py-2 flex-row items-center">
              <Text className="text-secondary-foreground text-sm font-bold mr-1.5">
                UNLOCK
              </Text>
              <Lock size={14} color="white" />
            </TouchableOpacity>
          </View>

          <View className="gap-4">
            {MOCK_GAMES.map((game) => (
              <Card
                key={game.id}
                className="overflow-hidden bg-card border-border shadow-sm"
              >
                <CardContent className="p-5 flex-row items-center gap-4">
                  <View
                    className={`w-16 h-16 rounded-full ${getGameColor(
                      game.icon_url
                    )} items-center justify-center`}
                  >
                    {getGameIcon(game.icon_url, "white")}
                    <View className="absolute bottom-0 right-0 bg-background rounded-full p-1 border border-border">
                      <Lock size={12} className="text-foreground" />
                    </View>
                  </View>
                  <View className="flex-1 gap-1.5">
                    <View className="flex-row justify-between items-start">
                      <H4>{game.name}</H4>
                      <View className="flex-row items-center gap-1.5">
                        <View className="w-2 h-2 rounded-full bg-primary" />
                        <Muted className="text-sm">0/5</Muted>
                      </View>
                    </View>
                    <P className="text-base text-muted-foreground leading-6">
                      {game.description}
                    </P>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

