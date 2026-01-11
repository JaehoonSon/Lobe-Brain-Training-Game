import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useCallback, useState } from "react";
import { useWindowDimensions } from "react-native";
import { StrengthProfileChart } from "~/components/charts/StrengthProfileChart";
import { OverallPerformanceChart } from "~/components/charts/OverallPerformanceChart";
import { ComparisonChart } from "~/components/charts/ComparisonChart";
import { LineChart } from "react-native-gifted-charts";

import { SafeAreaView } from "react-native-safe-area-context";
import { H1, H4, P } from "~/components/ui/typography";
import { Card } from "~/components/ui/card";
import { Text } from "~/components/ui/text";
import {
  Zap,
  ChevronRight,
  Lock,
  Sparkles,
  TrendingUp,
  BarChart2,
  Brain,
  Calculator,
  Languages,
  Target,
  Puzzle,
  Eye,
  BookType,
} from "lucide-react-native";
import { AuthenticatedHeader } from "~/components/AuthenticatedHeader";
import { useUserStats, CategoryStats, ScoreHistoryPoint } from "~/contexts/UserStatsContext";

import { router, useFocusEffect } from "expo-router";
import { cn } from "~/lib/utils";
import { FeatureCard } from "~/components/FeatureCard";
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
        (validPercentiles.reduce((a, b) => a + b, 0) / validPercentiles.length) * 100
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
                    Top {Math.max(1, 100 - avgPercentile)}%
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
              No games played
            </P>
            <ChevronRight size={20} className="text-muted-foreground" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// Reusable Content Components for locked states
// Adjusted to use standard colors

function StrengthContent() {
  return (
    <View className="h-24 justify-center gap-2 opacity-60 px-4">
      <View className="flex-row items-center gap-2">
        <View className="w-16 h-2 bg-muted rounded-full" />
        <View className="flex-1 h-2 bg-primary rounded-full" />
      </View>
      <View className="flex-row items-center gap-2">
        <View className="w-16 h-2 bg-muted rounded-full" />
        <View className="w-3/4 h-2 bg-secondary rounded-full" />
      </View>
      <View className="flex-row items-center gap-2">
        <View className="w-16 h-2 bg-muted rounded-full" />
        <View className="w-1/2 h-2 bg-primary rounded-full" />
      </View>
    </View>
  );
}

function HistoryContent({ history }: { history: ScoreHistoryPoint[] }) {
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - 140; // Account for card padding + y-axis

  if (history.length === 0) {
    return (
      <P className="text-center py-8">
        No history yet
      </P>
    );
  }

  // Transform data (last 7 days)
  const recentHistory = history.slice(-7);
  const chartData = recentHistory.map((point, index) => ({
    value: point.score,
    label: index === 0 || index === recentHistory.length - 1
      ? point.date.slice(5)
      : "",
    dataPointLabelComponent: () => null,
  }));

  const maxScore = Math.max(...chartData.map((d) => d.value), 100);

  // Round maxValue to nice intervals (multiples of 200)
  const roundedMax = Math.ceil(maxScore / 200) * 200;

  // Format Y-axis labels
  const formatY = (val: string) => {
    const num = Number(val);
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return String(Math.round(num));
  };

  return (
    <View className="h-56 w-full mt-4">
      <LineChart
        data={chartData}
        width={chartWidth}
        height={180}
        curved
        color="#d925b5"
        thickness={2}
        hideDataPoints={chartData.length > 3}
        dataPointsColor="#d925b5"
        dataPointsRadius={4}
        yAxisThickness={1}
        yAxisColor="#e5e7eb"
        yAxisTextStyle={{ color: "#6b7280", fontSize: 10 }}
        formatYLabel={formatY}
        noOfSections={4}
        xAxisThickness={1}
        xAxisColor="#e5e7eb"
        xAxisLabelTextStyle={{ color: "#6b7280", fontSize: 9 }}
        hideRules={false}
        rulesType="dashed"
        rulesColor="#f3f4f6"
        maxValue={roundedMax}
        yAxisOffset={0}
        spacing={chartData.length > 1 ? chartWidth / chartData.length : chartWidth / 2}
        initialSpacing={20}
        endSpacing={20}
        isAnimated
      />
    </View>
  );
}


export default function StatsScreen() {
  const { overallBPI, categoryStats, isLoading, error, refresh, overallScoreHistory } = useUserStats();


  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const hasOverallBPI = overallBPI !== null;
  const categoriesWithData = categoryStats.filter(
    (c) => c.score !== null
  ).length;
  const hasHistory = overallScoreHistory.length > 0;

  const allGameStats = categoryStats.flatMap((c) => c.gameStats);
  const validOverallPercentiles = allGameStats
    .map((g) => g.percentile)
    .filter((p): p is number => p !== null);

  const overallAvgPercentile =
    validOverallPercentiles.length > 0
      ? Math.round(
        (validOverallPercentiles.reduce((a, b) => a + b, 0) /
          validOverallPercentiles.length) * 100
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
          <H1 className="mb-6 pt-4 text-3xl font-black">My stats</H1>

          {/* BPI HERO CARD */}
          {/* Use standard bg-primary/border-primary classes */}
          <Card className="mb-6 bg-primary p-6">
            <View className="flex-row justify-between items-start mb-6">
              <View>
                <P className="text-primary-foreground/80 text-sm font-black tracking-widest uppercase mb-1">
                  OVERALL PERFORMANCE
                </P>
                <H4 className="text-3xl font-black text-primary-foreground">
                  Brain Index
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
                        Top {Math.max(1, 100 - overallAvgPercentile)}%
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
                  Scores update after each game
                </Text>
              ) : (
                <Text className="text-primary-foreground/90 font-bold text-center">
                  Play {3 - categoriesWithData} more categories to unlock
                </Text>
              )}
            </View>
          </Card>

          {/* TRAINING AREAS HEADER */}
          <H4 className="mb-4 text-2xl font-black px-1 py-1">Training Areas</H4>

          {/* CATEGORIES LIST - UNIFIED CARD */}
          <Card className="mb-8 bg-card">
            {isLoading && !categoryStats.length ? (
              <ActivityIndicator size="large" className="py-8 text-primary" />
            ) : error ? (
              <P className="text-destructive text-center py-8 font-bold">
                Could not load stats.
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
            Detailed Analysis
          </H4>


          <FeatureCard
            title="Strength Profile"
            variant="primary"
            isLocked={false}
          >
            <StrengthProfileChart categoryStats={categoryStats} />
          </FeatureCard>

          <FeatureCard title="Progress History" variant="secondary">
            <HistoryContent history={overallScoreHistory} />
          </FeatureCard>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
