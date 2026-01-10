import {
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { H1, H3, H4, P, Muted, Large } from "~/components/ui/typography";
import { Card, CardHeader, CardContent } from "~/components/ui/card";

import {
  X,
  Lock,
  Calculator,
  BookA,
  Heart,
  Mountain,
  Clock,
  Zap,
  Lightbulb,
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
import { useDailyInsight } from "~/hooks/useDailyInsight";

export default function Dashboard() {
  const { getDailyWorkout, dailyCompletedGameIds, refreshDailyProgress } =
    useGames();
  const [dailyGames, setDailyGames] = useState<
    Database["public"]["Tables"]["games"]["Row"][]
  >([]);

  React.useEffect(() => {
    // In a real app, you might want to wrap this in useMemo or similar if the date changes
    const games = getDailyWorkout(5);
    setDailyGames(games);
  }, [getDailyWorkout]);

  // Refresh progress when focusing the screen
  useFocusEffect(
    useCallback(() => {
      refreshDailyProgress();
    }, [refreshDailyProgress])
  );

  // Fetch today's brain fact
  const { insight, isLoading: insightLoading } = useDailyInsight();

  // Mock progress for now
  // const [completedGameIds, setCompletedGameIds] = useState<string[]>([]);

  const handlePlayGame = (gameId: string) => {
    router.push(`/game/${gameId}`);
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      {/* Sticky Top Bar */}
      <View className="px-6 pt-4 pb-2 bg-background z-10">
        <AuthenticatedHeader />
      </View>

      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="px-6 py-6">
          <View className="flex-row justify-between items-end mb-6">
            <View>
              <H3 className="text-3xl font-black mb-1">Today's Training</H3>
              <P className="text-muted-foreground font-bold">
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
                //
                // Note: dailyCompletedGameIds check might need to be robust against strings/numbers
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
            <Card variant="muted" className="p-6 items-center justify-center">
              <P className="text-muted-foreground text-center">
                Loading workout...
              </P>
            </Card>
          )}

          <View className="mt-8">
            <H3 className="mb-4 text-2xl font-black">Daily Insight</H3>
            <Card variant="muted" className="p-4 flex-row items-start">
              <View className="w-12 h-12 bg-white rounded-xl mr-4 items-center justify-center shrink-0">
                <Lightbulb className="text-secondary" size={24} strokeWidth={2.5} />
              </View>
              <View className="flex-1">
                {insightLoading ? (
                  <>
                    <H4 className="text-secondary font-black text-xl mb-1">Loading...</H4>
                    <P className="text-muted-foreground text-sm font-bold leading-tight">
                      Fetching today's brain fact...
                    </P>
                  </>
                ) : insight ? (
                  <>
                    <H4 className="text-secondary font-black text-xl mb-1">Did you know?</H4>
                    <P className="text-muted-foreground text-sm font-bold leading-tight mb-2">
                      {insight.content}
                    </P>
                    {insight.source && (
                      <Muted className="text-xs italic">
                        Source: {insight.source}
                      </Muted>
                    )}
                  </>
                ) : (
                  <>
                    <H4 className="text-secondary font-black text-xl mb-1">Did you know?</H4>
                    <P className="text-muted-foreground text-sm font-bold leading-tight">
                      Your brain is amazing! Check back tomorrow for a new fact.
                    </P>
                  </>
                )}
              </View>
            </Card>
          </View>

          <View className="mt-8 gap-4">
            <H3 className="mb-2 text-2xl font-black">Relaxing Games</H3>

            <Card variant="secondary" className="p-4 flex-row items-center">
              <View className="w-12 h-12 bg-white/20 rounded-xl mr-4 items-center justify-center">
                <BookA className="text-white" size={24} />
              </View>
              <View className="flex-1">
                <H4 className="text-white font-black text-xl">Quick Zen</H4>
                <P className="text-white/80 text-sm font-bold text-secondary-foreground">
                  Stress relief • 5 min
                </P>
              </View>
            </Card>

            <Card variant="primary" className="p-4 flex-row items-center">
              <View className="w-12 h-12 bg-white/20 rounded-xl mr-4 items-center justify-center">
                <Mountain className="text-white" size={24} />
              </View>
              <View className="flex-1">
                <H4 className="text-white font-black text-xl">Mindful Walk</H4>
                <P className="text-white/80 text-sm font-bold text-primary-foreground">
                  Walking meditation • 10 min
                </P>
              </View>
            </Card>

            <Card variant="accent" className="p-4 flex-row items-center">
              <View className="w-12 h-12 bg-white/20 rounded-xl mr-4 items-center justify-center">
                <Clock className="text-white" size={24} />
              </View>
              <View className="flex-1">
                <H4 className="text-white font-black text-xl">Focus Timer</H4>
                <P className="text-white/80 text-sm font-bold text-accent-foreground">
                  Productivity • 25 min
                </P>
              </View>
            </Card>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
