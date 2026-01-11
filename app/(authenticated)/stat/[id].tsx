import React, { useCallback, useEffect, useMemo } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import {
  ChevronLeft,
  Zap,
  Lock,
  TrendingUp,
  Lightbulb,
  ChevronRight,
} from "lucide-react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { H1, H4, P, Muted } from "~/components/ui/typography";
import { BlurView } from "expo-blur";
import { cn } from "~/lib/utils";
import { Card, CardContent } from "~/components/ui/card";
import { Text } from "~/components/ui/text";
import { useUserStats } from "~/contexts/UserStatsContext";
import { useGames } from "~/contexts/GamesContext";
import { FeatureCard } from "~/components/FeatureCard";
import { CategoryPerformanceChart } from "~/components/charts/CategoryPerformanceChart";
import { ComparisonChart } from "~/components/charts/ComparisonChart";
import { INSIGHTS } from "~/lib/insights-data";

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { categoryStats, isLoading, refresh, history, globalStats } =
    useUserStats();
  const { games } = useGames();

  // Refresh stats when focusing the screen
  // useFocusEffect(
  //   useCallback(() => {
  //     refresh();
  //   }, [refresh])
  // );

  const categoryHistory = useMemo(() => {
    const relevantGameIds = new Set(
      games.filter((g) => g.category_id === id).map((g) => g.id)
    );
    return history.filter((h) => relevantGameIds.has(h.game_id));
  }, [games, history, id]);

  useEffect(() => {
    console.log("categoryHistory", JSON.stringify(categoryHistory));
  }, [categoryHistory]);

  // Floating animation for the brain
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Find the category stats for this ID
  const category = categoryStats.find((c) => c.id === id);

  // Get games in this category
  const categoryGames = games.filter((g) => g.category_id === id);

  // Calculate category-specific percentile using globalStats
  const categoryPercentile = useMemo(() => {
    if (!category?.score || categoryGames.length === 0) return null;

    // Get global stats for games in this category
    const categoryGlobalGames = categoryGames
      .map((g) => globalStats.get(g.id))
      .filter((g) => !!g);

    if (categoryGlobalGames.length === 0) return null;

    // Calculate weighted global average for this category
    const totalWeight = categoryGlobalGames.reduce(
      (sum, g) => sum + (g?.averageGamesPlayed || 0),
      0
    );
    const weightedScore = categoryGlobalGames.reduce(
      (sum, g) => sum + (g?.averageScore || 0) * (g?.averageGamesPlayed || 0),
      0
    );

    if (totalWeight === 0) return null;

    const globalCategoryBPI = weightedScore / totalWeight;

    // Z-score approximation (same as overall percentile calculation)
    const stdDev = globalCategoryBPI * 0.25; // Assume 25% std dev
    if (stdDev === 0) return 50; // If no variance, user is at 50%

    const zScore = (category.score - globalCategoryBPI) / stdDev;
    // Logistic approximation for cumulative normal distribution
    const p = 1 / (1 + Math.exp(-1.7 * zScore));
    return Math.round(p * 100);
  }, [category?.score, categoryGames, globalStats]);

  // Get relevant insights
  const relevantInsights = INSIGHTS.filter(
    (i) => i.category.toLowerCase() === category?.name.toLowerCase()
  );

  if (isLoading) {
    return (
      <SafeAreaView
        edges={["top"]}
        className="flex-1 bg-background items-center justify-center"
      >
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!category) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-background">
        <View className="relative flex-row items-center px-4 py-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-muted items-center justify-center z-10"
          >
            <ChevronLeft size={24} className="text-foreground" />
          </TouchableOpacity>
          <View className="absolute left-0 right-0 items-center">
            <H1 className="text-xl">Category Not Found</H1>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const hasScore = category.score !== null;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      {/* Header with Back Button */}
      <View className="relative flex-row items-center px-4 py-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-muted items-center justify-center z-10"
        >
          <ChevronLeft size={24} className="text-foreground" />
        </TouchableOpacity>
        <View className="absolute left-0 right-0 items-center">
          <H1 className="text-xl">{category.name} BPI</H1>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-6">
          {/* Hero BPI Section */}
          {/* Hero BPI Section - Juicy Tactile Style */}
          <View className="mb-10 pt-6 flex-row items-center justify-between px-2">
            <Animated.View
              entering={FadeInDown.delay(200).duration(600)}
              className="flex-1"
            >
              <View className="relative">
                {/* 3D Drop Shadow Text Layer */}
                <Text
                  className="text-8xl font-black text-primary/20 absolute top-1.5 left-1.5"
                  style={{ lineHeight: 90 }}
                >
                  {hasScore ? category.score : "--"}
                </Text>
                {/* Main Text Layer */}
                <Text
                  className="text-8xl font-black text-primary"
                  style={{
                    lineHeight: 90,
                  }}
                >
                  {hasScore ? category.score : "--"}
                </Text>
              </View>

              <View className="-mt-1 flex-row">
                <View className="bg-primary/10 px-3 py-1 rounded-full border-b-4 border-primary/20 flex-row items-center gap-2">
                  <Text className="text-sm font-black text-primary uppercase tracking-wider">
                    current bpi
                  </Text>
                  {hasScore && (
                    <TrendingUp
                      size={14}
                      className="text-primary"
                      strokeWidth={3}
                    />
                  )}
                </View>
              </View>
            </Animated.View>

            {/* Big Floating Icon */}
            <Animated.View
              entering={FadeInDown.delay(400).duration(600)}
              style={{
                shadowColor: "#f97316", // orange-500
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
              }}
            >
              <Animated.View style={floatingStyle}>
                <Image
                  source={require("~/assets/brain_workout_clay_3d.png")}
                  style={{ width: 160, height: 160 }}
                  contentFit="contain"
                />
              </Animated.View>
            </Animated.View>
          </View>

          {/* Performance History Chart */}
          <FeatureCard
            title="Performance History"
            variant="secondary"
            isLocked={true}
          >
            <CategoryPerformanceChart history={categoryHistory} />
          </FeatureCard>

          {/* How You Compare Chart */}
          {categoryPercentile !== null && (
            <FeatureCard
              title="How You Compare"
              variant="primary"
              isLocked={false}
            >
              <ComparisonChart percentile={categoryPercentile} />
            </FeatureCard>
          )}

          {/* Category Games Section */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <View className="flex-row justify-between items-center mb-3">
              <H4 className="text-lg font-bold">{category.name} Games</H4>
            </View>

            {categoryGames.length === 0 ? (
              <Muted className="text-center py-8">
                No games in this category yet.
              </Muted>
            ) : (
              <View className="gap-3 mb-8">
                {categoryGames.map((game) => {
                  const gameStats = category.gameStats.find(
                    (gs) => gs.gameId === game.id
                  );
                  const hasPlayed = gameStats && gameStats.gamesPlayed > 0;

                  return (
                    <TouchableOpacity
                      key={game.id}
                      onPress={() => router.push(`/game/${game.id}`)}
                      activeOpacity={0.7}
                    >
                      <Card>
                        <CardContent className="p-4">
                          <View className="flex-row items-center justify-between">
                            <View className="flex-1">
                              <H4 className="text-lg font-black mb-1 text-foreground">
                                {game.name}
                              </H4>
                              {hasPlayed ? (
                                <View className="flex-row items-center gap-3">
                                  <View className="bg-primary/10 px-2 py-0.5 rounded-md">
                                    <Text className="text-xs font-bold text-primary">
                                      {gameStats.gamesPlayed} PLAYED
                                    </Text>
                                  </View>
                                  <Text className="text-xs font-bold text-muted-foreground">
                                    BEST: {gameStats.highestScore ?? "--"}
                                  </Text>
                                </View>
                              ) : (
                                <View className="bg-muted/20 px-2 py-0.5 rounded-md self-start">
                                  <Text className="text-xs font-bold text-muted-foreground">
                                    NEW
                                  </Text>
                                </View>
                              )}
                            </View>
                            {hasPlayed && gameStats.averageScore && (
                              <View className="items-end bg-secondary/10 px-3 py-2 rounded-lg">
                                <P className="text-2xl font-black text-secondary">
                                  {gameStats.averageScore}
                                </P>
                                <Text className="text-[10px] font-black text-secondary/60 text-right">
                                  AVG BPI
                                </Text>
                              </View>
                            )}
                          </View>
                        </CardContent>
                      </Card>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </Animated.View>

          {/* Recommended Insights Section */}
          {relevantInsights.length > 0 && (
            <Animated.View entering={FadeInDown.delay(600).duration(400)}>
              <H4 className="text-lg font-bold mb-3">Recommended Reading</H4>
              <View className="gap-3">
                {relevantInsights.map((insight) => (
                  <TouchableOpacity
                    key={insight.id}
                    activeOpacity={0.7}
                    onPress={() =>
                      router.push({
                        pathname: "/insight/[id]",
                        params: { id: insight.id },
                      } as any)
                    }
                  >
                    <Card>
                      <CardContent className="p-4 flex-row gap-4 items-center">
                        <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                          <Lightbulb size={20} className="text-primary" />
                        </View>
                        <View className="flex-1">
                          <H4 className="text-base font-bold text-foreground">
                            {insight.title}
                          </H4>
                          <P
                            className="text-xs text-muted-foreground line-clamp-1"
                            numberOfLines={1}
                          >
                            {insight.summary}
                          </P>
                        </View>
                        <ChevronRight
                          size={16}
                          className="text-muted-foreground"
                        />
                      </CardContent>
                    </Card>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
