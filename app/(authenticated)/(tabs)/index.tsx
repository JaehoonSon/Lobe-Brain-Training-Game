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
import { Text } from "~/components/ui/text";

import {
  Zap,
  Lightbulb,
  Globe,
  TrendingUp,
  Users,
  Trophy,
} from "lucide-react-native";
import { router } from "expo-router";
import { cn } from "~/lib/utils";
import { Database } from "~/lib/database.types";
import { useState } from "react";
import React from "react";
import { AuthenticatedHeader } from "~/components/AuthenticatedHeader";
import { WorkoutGameCard } from "~/components/Authenticated/WorkoutGameCard";
import { useGames } from "~/contexts/GamesContext";
import { useAuth } from "~/contexts/AuthProvider";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { useDailyInsight } from "~/hooks/useDailyInsight";

export default function Dashboard() {
  const { games, getDailyWorkout, dailyCompletedGameIds, refreshDailyProgress } =
    useGames();
  const { user } = useAuth();
  const [dailyGames, setDailyGames] = useState<
    Database["public"]["Tables"]["games"]["Row"][]
  >([]);
  const [quickPlayGames, setQuickPlayGames] = useState<
    Database["public"]["Tables"]["games"]["Row"][]
  >([]);

  React.useEffect(() => {
    // In a real app, you might want to wrap this in useMemo or similar if the date changes
    if (user?.id) {
      const workout = getDailyWorkout(user.id, 3);
      setDailyGames(workout);

      // Pick two games not in the daily workout for Quick Play
      const workoutIds = new Set(workout.map(g => g.id));
      const others = games.filter(g => !workoutIds.has(g.id)).slice(0, 2);
      setQuickPlayGames(others);
    }
  }, [getDailyWorkout, user?.id, games]);

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
    if (!gameId) return;
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
                    <P className="text-muted-foreground text-sm font-bold">
                      Fetching today's brain fact...
                    </P>
                  </>
                ) : insight ? (
                  <>
                    <H4 className="text-info font-black text-xl mb-1">Did you know?</H4>
                    <P className="text-muted-foreground text-sm font-bold mb-2">
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
                    <P className="text-muted-foreground text-sm font-bold">
                      Your brain is amazing! Check back tomorrow for a new fact.
                    </P>
                  </>
                )}
              </View>
            </Card>
          </View>

          <View className="mt-8 gap-4">
            <H3 className="mb-2 text-2xl font-black">Community & Growth</H3>

            {/* Global Challenge Card */}
            <TouchableOpacity onPress={() => handlePlayGame(dailyGames[0]?.id || '')} activeOpacity={0.8}>
              <Card className="bg-info-edge border-b-[8px] border-black/20 p-5">
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-1">
                    <View className="bg-white/20 self-start px-2 py-0.5 rounded-md mb-2">
                      <Text className="text-[10px] font-black text-white uppercase tracking-wider">GLOBAL CHALLENGE</Text>
                    </View>
                    <H4 className="text-white font-black text-2xl mb-1">Elite Focus</H4>
                    <P className="text-white/80 font-bold leading-5">Everyone is playing {dailyGames[0]?.name || 'Memory Matrix'} today! Can you reach the top 10%?</P>
                  </View>
                  <View className="w-16 h-16 bg-white/10 rounded-2xl items-center justify-center border border-white/20">
                    <Globe size={32} color="white" strokeWidth={2.5} />
                  </View>
                </View>
                <View className="bg-white rounded-2xl py-3 items-center">
                  <Text className="text-info-edge font-black uppercase text-sm tracking-widest">Join 12,402 Others</Text>
                </View>
              </Card>
            </TouchableOpacity>

            {/* Quick Play Games Row */}
            <View className="flex-row gap-4 mb-4">
              {quickPlayGames.map((game, idx) => (
                <View key={game.id} className="flex-1">
                  <TouchableOpacity onPress={() => handlePlayGame(game.id)} activeOpacity={0.8}>
                    <Card variant={idx === 0 ? "primary" : "secondary"} className={cn(
                      "p-4 h-44 justify-between",
                      idx === 0 ? "border-b-[6px] border-primary-edge" : "border-b-[6px] border-secondary-edge"
                    )}>
                      <View className="flex-row justify-between items-start">
                        <Zap size={20} color="white" />
                        <Text className="text-[10px] font-black text-white/60 uppercase">QUICK PLAY</Text>
                      </View>
                      <View className="flex-1 justify-center items-center py-2">
                        <H4 className="text-white font-black text-lg text-center" numberOfLines={2}>{game.name}</H4>
                      </View>
                      <View className="bg-white/10 py-1.5 rounded-lg items-center">
                        <Text className="text-white font-black text-[10px] uppercase tracking-widest">TAP TO START</Text>
                      </View>
                    </Card>
                  </TouchableOpacity>
                </View>
              ))}
              {quickPlayGames.length === 0 && (
                <Card variant="muted" className="flex-1 h-44 items-center justify-center border-b-[6px]">
                  <Text className="text-muted-foreground font-bold">More games coming soon!</Text>
                </Card>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
