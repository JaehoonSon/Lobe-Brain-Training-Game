import {
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "~/contexts/AuthProvider";
import { H1, H3, P, Muted } from "~/components/ui/typography";
import { Card, CardHeader, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
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
  const size = 32;
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

const getGameColor = (iconUrl: string | null) => {
  switch (iconUrl) {
    case "math":
      return "bg-pink-500";
    case "language":
      return "bg-cyan-500";
    case "favorites":
      return "bg-orange-400";
    case "strengthen":
      return "bg-teal-500";
    case "quick":
      return "bg-green-500";
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
              <View className="w-24 h-24 rounded-full bg-orange-100 dark:bg-orange-900/20 items-center justify-center mb-2">
                <View className="w-16 h-16 rounded-full bg-orange-500 items-center justify-center">
                  <Zap size={40} color="white" fill="white" />
                </View>
              </View>

              <View className="items-center">
                <H3 className="text-2xl font-bold text-center">
                  Daily Workout
                </H3>
                <Muted className="text-center mt-1">{today} | 3 Games</Muted>
              </View>

              <Button className="w-48 bg-orange-500 active:bg-orange-600 rounded-full h-12 mt-2">
                <P className="text-white font-bold text-lg">Start</P>
              </Button>
            </CardContent>
          </Card>

          {/* More Workouts Section */}
          <View className="flex-row justify-between items-center mb-4">
            <H3 className="text-xl">More Workouts</H3>
            <TouchableOpacity className="bg-green-500 rounded-full px-3 py-1 flex-row items-center">
              <P className="text-white text-xs font-bold mr-1">UNLOCK</P>
              <Lock size={10} color="white" />
            </TouchableOpacity>
          </View>

          <View className="gap-4">
            {MOCK_GAMES.map((game) => (
              <Card
                key={game.id}
                className="overflow-hidden bg-card border-border shadow-sm"
              >
                <CardContent className="p-4 flex-row items-center gap-4">
                  <View
                    className={`w-14 h-14 rounded-full ${getGameColor(
                      game.icon_url
                    )} items-center justify-center`}
                  >
                    {getGameIcon(game.icon_url, "white")}
                    <View className="absolute bottom-0 right-0 bg-background rounded-full p-0.5 border border-border">
                      <Lock size={10} className="text-foreground" />
                    </View>
                  </View>
                  <View className="flex-1 gap-1">
                    <View className="flex-row justify-between items-start">
                      <H3 className="text-lg">{game.name}</H3>
                      <View className="flex-row items-center gap-1">
                        <View className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                        <Muted className="text-xs">0/5</Muted>
                      </View>
                    </View>
                    <P className="text-sm text-muted-foreground leading-5">
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
