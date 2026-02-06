import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useCallback, useState } from "react";
import { StrengthProfileChart } from "~/components/charts/StrengthProfileChart";
import { ScoreHistoryChart } from "~/components/charts/ScoreHistoryChart";

import { SafeAreaView } from "react-native-safe-area-context";
import { H1, H4, P } from "~/components/ui/typography";
import { Card } from "~/components/ui/card";
import { Text } from "~/components/ui/text";
import {
  Zap,
  ChevronRight,
  TrendingUp,
  Brain,
  Calculator,
  Languages,
  Target,
  Puzzle,
  Eye,
} from "lucide-react-native";
import { AuthenticatedHeader } from "~/components/AuthenticatedHeader";
import { useUserStats, CategoryStats } from "~/contexts/UserStatsContext";

import { router } from "expo-router";
import { cn } from "~/lib/utils";
import { FeatureCard } from "~/components/FeatureCard";
import { useTranslation } from "react-i18next";
// --- Components ---

function getCategoryIcon(categoryName: string) {
  const name = categoryName.toLowerCase();
  if (name.includes("memory")) return Brain;
  if (name.includes("logic") || name.includes("math")) return Calculator;
  if (name.includes("speed") || name.includes("reaction")) return Zap;
  if (name.includes("language") || name.includes("verbal")) return Languages;
  if (name.includes("focus") || name.includes("attention")) return Target;

  // Fallbacks or specific other cases
  if (name.includes("problem")) return Puzzle;
  if (name.includes("visual")) return Eye;

  return Zap; // Defaulti
}

interface CategoryRowProps {
  category: CategoryStats;
  isLast: boolean;
  index: number;
  onPress?: () => void;
}

function CategoryRow({ category, isLast, index, onPress }: CategoryRowProps) {
  const { t } = useTranslation();
  const hasScore = category.score !== null;
  const IconComponent = getCategoryIcon(category.name);

  // Semantic variant alternation: even = primary, odd = secondary
  const variant = index % 2 === 0 ? "primary" : "secondary";

  // Map variant to text/bg colors
  // Note: We use specific text classes to ensure good contrast on white bg
  const iconColorClass =
    variant === "primary" ? "text-primary" : "text-secondary";
  const progressBgClass = variant === "primary" ? "bg-primary" : "bg-secondary";

  const validPercentiles = category.gameStats
    .map((g) => g.percentile)
    .filter((p): p is number => p !== null);

  const avgPercentile =
    validPercentiles.length > 0
      ? Math.round(
          (validPercentiles.reduce((a, b) => a + b, 0) /
            validPercentiles.length) *
            100,
        )
      : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={cn("flex-col py-4 px-4", !isLast && "border-b border-muted")}
    >
      {/* Top Row: Icon + Title */}
      <View className="flex-row items-center gap-3 mb-3">
        {/* Icon bubble */}
        <View className="w-10 h-10 rounded-xl bg-muted/30 items-center justify-center">
          <IconComponent
            size={20}
            className={iconColorClass}
            strokeWidth={2.5}
          />
        </View>
        <H4 className="text-lg font-bold text-foreground pt-0.5">
          {category.name}
        </H4>
      </View>

      {/* Bottom Row: Bar + Score + Chevron */}
      <View className="flex-row items-center justify-between pl-1">
        {hasScore ? (
          <>
            {/* Progress Bar captures available width */}
            <View className="flex-1 h-3 bg-muted/40 rounded-full overflow-hidden mr-3">
              <View
                className={cn("h-full rounded-full", progressBgClass)}
                style={{ width: `${category.progress}%` }}
              />
            </View>
            <View className="flex-row items-center gap-2">
              {avgPercentile !== null && (
                <View className="bg-muted px-2 py-0.5 rounded">
                  <Text className="text-xs font-bold text-muted-foreground">
                    {t("stats.bpi.top_percentile", {
                      count: Math.max(1, 100 - avgPercentile),
                    })}
                  </Text>
                </View>
              )}
              <Text className="text-xl font-black text-foreground min-w-[30px] text-right">
                {category.score}
              </Text>
              <ChevronRight size={20} className="text-muted-foreground ml-1" />
            </View>
          </>
        ) : (
          <View className="flex-1 flex-row items-center justify-between">
            <P className="text-muted-foreground text-sm font-bold">
              {t("stats.categories.no_games")}
            </P>
            <ChevronRight size={20} className="text-muted-foreground" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function StatsScreen() {
  const { t } = useTranslation();
  const {
    overallBPI,
    categoryStats,
    isLoading,
    error,
    refresh,
    overallScoreHistory,
  } = useUserStats();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const hasOverallBPI = overallBPI !== null;
  const categoriesWithData = categoryStats.filter(
    (c) => c.score !== null,
  ).length;
  // const hasHistory = overallScoreHistory.length > 0;

  const allGameStats = categoryStats.flatMap((c) => c.gameStats);
  const validOverallPercentiles = allGameStats
    .map((g) => g.percentile)
    .filter((p): p is number => p !== null);

  const overallAvgPercentile =
    validOverallPercentiles.length > 0
      ? Math.round(
          (validOverallPercentiles.reduce((a, b) => a + b, 0) /
            validOverallPercentiles.length) *
            100,
        )
      : null;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      {/* Sticky Top Bar */}
      <View className="px-6 pt-4 pb-2 bg-background z-10">
        <AuthenticatedHeader />
      </View>

      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="px-6 pb-6">
          {/* Page Title */}
          <H1 className="mb-6 pt-4 text-3xl font-black">{t("stats.title")}</H1>

          {/* BPI HERO CARD */}
          {/* Use standard bg-primary/border-primary classes */}
          <Card className="mb-6 bg-primary p-6">
            <View className="flex-row justify-between items-start mb-6">
              <View>
                <P className="text-primary-foreground/80 text-sm font-black tracking-widest uppercase mb-1">
                  {t("stats.bpi.overall_performance")}
                </P>
                <H4 className="text-3xl font-black text-primary-foreground">
                  {t("stats.bpi.brain_index")}
                </H4>
              </View>
              <View className="bg-white/20 p-2 rounded-xl">
                <TrendingUp size={24} className="text-primary-foreground" />
              </View>
            </View>

            <View className="items-center py-4">
              {hasOverallBPI ? (
                <>
                  <Text className="text-8xl font-black text-primary-foreground ">
                    {overallBPI}
                  </Text>
                  {overallAvgPercentile !== null && (
                    <View className="bg-white/20 px-3 py-1 rounded-full mt-2">
                      <Text className="text-primary-foreground font-bold">
                        {t("stats.bpi.top_percentile", {
                          count: Math.max(1, 100 - overallAvgPercentile),
                        })}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <Text className="text-6xl font-black text-primary-foreground/30">
                  ---
                </Text>
              )}
            </View>

            <View className="mt-4 bg-black/10 rounded-xl p-3 flex-row items-center justify-center border border-black/5">
              {hasOverallBPI ? (
                <Text className="text-primary-foreground font-bold">
                  {t("stats.bpi.update_msg")}
                </Text>
              ) : (
                <Text className="text-primary-foreground/90 font-bold text-center">
                  {t("stats.bpi.unlock_msg", { count: 3 - categoriesWithData })}
                </Text>
              )}
            </View>
          </Card>

          {/* TRAINING AREAS HEADER */}
          <H4 className="mb-4 text-2xl font-black px-1 py-1">
            {t("stats.training_areas")}
          </H4>

          {/* CATEGORIES LIST - UNIFIED CARD */}
          <Card className="mb-8 bg-card">
            {isLoading && !categoryStats.length ? (
              <ActivityIndicator size="large" className="py-8 text-primary" />
            ) : error ? (
              <P className="text-destructive text-center py-8 font-bold">
                {t("stats.error_loading")}
              </P>
            ) : (
              <View>
                {categoryStats.map((category, index) => (
                  <CategoryRow
                    key={category.id}
                    category={category}
                    index={index}
                    isLast={index === categoryStats.length - 1} // Ensure last item has no border
                    onPress={() => router.push(`/stat/${category.id}`)}
                  />
                ))}
              </View>
            )}
          </Card>

          {/* Premium Sections - Updated Visuals */}
          <H4 className="mb-4 text-2xl font-black px-1 py-1">
            {t("stats.analysis.title")}
          </H4>

          <FeatureCard
            title={t("stats.analysis.strength_profile")}
            variant="primary"
            isLocked={false}
          >
            <StrengthProfileChart categoryStats={categoryStats} />
          </FeatureCard>

          <FeatureCard
            title={t("stats.analysis.progress_history")}
            variant="secondary"
            noPadding
          >
            <ScoreHistoryChart history={overallScoreHistory} />
          </FeatureCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
