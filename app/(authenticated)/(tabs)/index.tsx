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
import { WorkoutGameCard } from "~/components/Authenticated/WorkoutGameCard";
import { useGames } from "~/contexts/GamesContext";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

export default function Dashboard() {
  const { getDailyWorkout, dailyCompletedGameIds, refreshDailyProgress } =
    useGames();
  const [dailyGames, setDailyGames] = useState<
    Database["public"]["Tables"]["games"]["Row"][]
  >([]);

  React.useEffect(() => {
    // In a real app, you might want to wrap this in useMemo or similar if the date changes
    const games = getDailyWorkout(3);
    setDailyGames(games);
  }, [getDailyWorkout]);

  // Refresh progress when focusing the screen
  useFocusEffect(
    useCallback(() => {
      refreshDailyProgress();
    }, [refreshDailyProgress])
  );

  // Mock progress for now
  // const [completedGameIds, setCompletedGameIds] = useState<string[]>([]);

  const handlePlayGame = (gameId: string) => {
    router.push(`/game/${gameId}`);
  };

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
        <View className="px-6 py-6">
          <View className="flex-row justify-between items-end mb-6">
            <View>
              <H3>Today's Training</H3>
              <P className="text-muted-foreground">
                Keep your streak alive! 🔥
              </P>
            </View>
            {/* <Link href="/(authenticated)/(tabs)/games" asChild>
                    <TouchableOpacity>
                        <P className="text-primary font-medium">See all</P>
                    </TouchableOpacity>
                </Link> */}
          </View>

          {dailyGames.length > 0 ? (
            <View>
              {dailyGames.map((game, index) => {
                // Logic for status:
                // - If previous game is not completed, this one is locked (unless it's the first one)
                // - If this game is in dailyCompletedGameIds, it's completed
                // - Otherwise, if it's the first uncompleted one, it's active

                const isCompleted = dailyCompletedGameIds.includes(game.id);
                const isPrevCompleted =
                  index === 0 ||
                  dailyCompletedGameIds.includes(dailyGames[index - 1].id);

                let status: "locked" | "active" | "completed" = "locked";
                if (isCompleted) {
                  status = "completed";
                } else if (isPrevCompleted) {
                  status = "active";
                }

                return (
                  <WorkoutGameCard
                    key={game.id}
                    game={game}
                    index={index}
                    isLast={index === dailyGames.length - 1}
                    status={status}
                    onPress={() => handlePlayGame(game.id)}
                  />
                );
              })}
            </View>
          ) : (
            <Card className="p-6 items-center justify-center border-dashed">
              <P className="text-muted-foreground text-center">
                Loading workout...
              </P>
            </Card>
          )}

          <View className="mt-8">
            <H3 className="mb-4">Relaxing Games</H3>
            <Card className="p-4 flex-row items-center border-border/50 bg-card/50">
              <View className="w-12 h-12 bg-blue-100 rounded-xl mr-4 items-center justify-center">
                <BookA className="text-blue-500" size={24} />
              </View>
              <View className="flex-1">
                <H4>Quick Zen</H4>
                <P className="text-muted-foreground text-xs">
                  Stress relief • 5 min
                </P>
              </View>
            </Card>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
