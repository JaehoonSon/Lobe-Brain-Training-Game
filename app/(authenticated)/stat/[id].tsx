import { useEffect } from "react";
import {
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import {
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  TrendingUp,
  Zap,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { FeatureCard } from "~/components/FeatureCard";
import { ScoreHistoryChart } from "~/components/charts/ScoreHistoryChart";
import { Card, CardContent } from "~/components/ui/card";
import { Text } from "~/components/ui/text";
import { H1, H4, Muted, P } from "~/components/ui/typography";
import { useGames } from "~/contexts/GamesContext";
import { useUserStats } from "~/contexts/UserStatsContext";
import { INSIGHTS } from "~/lib/insights-data";

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { categoryStats, categoryScoreHistory, isLoading } = useUserStats();

  const { games } = useGames();

  // Refresh stats when focusing the screen
  // useFocusEffect(
  //   useCallback(() => {
  //     refresh();
  //   }, [refresh])
  // );

  const categoryHistory = categoryScoreHistory[id] || [];

  // Floating animation for the brain
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2000 }),
        withTiming(0, { duration: 2000 }),
      ),
      -1,
      true,
    );
  }, []);

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Find the category stats for this ID
  const category = categoryStats.find((c) => c.id === id);

  // Compute category percentile
  const gamePercentiles =
    category?.gameStats
      .map((gs) => gs.percentile)
      .filter((p): p is number => p !== null && p !== undefined) ?? [];

  const categoryPercentileRaw =
    gamePercentiles.length > 0
      ? gamePercentiles.reduce((a, b) => a + b, 0) / gamePercentiles.length
      : null;

  const categoryTopPercent =
    categoryPercentileRaw !== null
      ? Math.max(1, 100 - Math.round(categoryPercentileRaw * 100))
      : null;

  // Get games in this category
  const categoryGames = games.filter((g) => g.category_id === id);

  // Get relevant insights
  const relevantInsights = INSIGHTS.filter(
    (i) => i.category.toLowerCase() === category?.name.toLowerCase(),
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
            <H1 className="text-xl">{t("stat_detail.not_found")}</H1>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const hasScore = category.score !== null;
  const scoreText = hasScore ? String(category.score) : "--";
  const useCompactScore = scoreText.length >= 4;

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
          <H1 className="text-xl">
            {t("stat_detail.score_title", {
              name: t(`common.categories.${id.toLowerCase()}`, {
                defaultValue: category.name,
              }),
            })}
          </H1>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-6">
          {/* Hero BPI Section */}
          <View className="mb-10 pt-6 flex-row items-center justify-between px-2">
            <Animated.View
              entering={FadeInDown.delay(200).duration(600)}
              className="flex-1"
            >
              <View className="relative">
                {/* 3D Drop Shadow Text Layer */}
                {useCompactScore ? (
                  <Text className="font-black text-primary/20 absolute top-1.5 left-1.5 leading-none tracking-tight text-7xl">
                    {scoreText}
                  </Text>
                ) : (
                  <Text className="font-black text-primary/20 absolute top-1.5 left-1.5 leading-none tracking-tight text-8xl">
                    {scoreText}
                  </Text>
                )}
                {/* Main Text Layer */}
                {useCompactScore ? (
                  <Text className="font-black text-primary leading-none tracking-tight text-7xl">
                    {scoreText}
                  </Text>
                ) : (
                  <Text className="font-black text-primary leading-none tracking-tight text-8xl">
                    {scoreText}
                  </Text>
                )}
              </View>

              <View className="-mt-1 flex-row flex-wrap gap-2">
                <View className="bg-primary/10 px-3 py-1 rounded-full border-b-4 border-primary/20 flex-row items-center gap-2">
                  <Text className="text-sm font-black text-primary uppercase tracking-wider">
                    {t("stat_detail.current_score")}
                  </Text>
                  {hasScore && categoryScoreHistory[id]?.length > 0 && (
                    <TrendingUp
                      size={14}
                      className="text-primary"
                      strokeWidth={3}
                    />
                  )}
                </View>

                {categoryTopPercent !== null && (
                  <View className="bg-accent/10 px-3 py-1 rounded-full border-b-4 border-accent/20 flex-row items-center gap-2">
                    <Zap
                      size={14}
                      className="text-accent"
                      fill="currentColor"
                    />
                    <Text className="text-sm font-black text-accent uppercase tracking-wider">
                      {t("stat_detail.top_percent", {
                        count: categoryTopPercent,
                      })}
                    </Text>
                  </View>
                )}
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
                  cachePolicy="disk"
                  contentFit="contain"
                />
              </Animated.View>
            </Animated.View>
          </View>

          {/* Performance History Chart */}
          <FeatureCard
            title={t("stat_detail.history")}
            variant="secondary"
            isLocked={false}
          >
            <ScoreHistoryChart history={categoryHistory} />
          </FeatureCard>

          {/* Category Games Section */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <View className="flex-row justify-between items-center mb-3">
              <H4 className="text-lg font-bold">
                {t("stat_detail.games_title", {
                  name: t(`common.categories.${id.toLowerCase()}`, {
                    defaultValue: category.name,
                  }),
                })}
              </H4>
            </View>

            {categoryGames.length === 0 ? (
              <Muted className="text-center py-8">
                {t("stat_detail.no_games")}
              </Muted>
            ) : (
              <View className="gap-3 mb-8">
                {categoryGames.map((game) => {
                  const gameStats = category.gameStats.find(
                    (gs) => gs.gameId === game.id,
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
                                      {t("stat_detail.played_count", {
                                        count: gameStats.gamesPlayed,
                                      })}
                                    </Text>
                                  </View>
                                  <Text className="text-xs font-bold text-muted-foreground">
                                    {t("stat_detail.best_score", {
                                      score: gameStats.highestScore ?? "--",
                                    })}
                                  </Text>
                                </View>
                              ) : (
                                <View className="bg-muted/20 px-2 py-0.5 rounded-md self-start">
                                  <Text className="text-xs font-bold text-muted-foreground">
                                    {t("stat_detail.new_game")}
                                  </Text>
                                </View>
                              )}
                            </View>
                            {hasPlayed && gameStats.averageScore && (
                              <View className="flex-row gap-2">
                                <View className="items-end bg-secondary/10 px-3 py-2 rounded-lg">
                                  <P className="text-2xl font-black text-secondary">
                                    {gameStats.averageScore}
                                  </P>
                                  <Text className="text-[10px] font-black text-secondary/60 text-right">
                                    {t("stat_detail.avg_score_label")}
                                  </Text>
                                </View>
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
              <H4 className="text-lg font-bold mb-3">
                {t("stat_detail.recommended")}
              </H4>
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
