import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { H1, H4, P, Muted } from "~/components/ui/typography";
import { Card, CardContent } from "~/components/ui/card";
import { Text } from "~/components/ui/text";
import {
  Zap,
  Info,
  ChevronRight,
  Lock,
  Sparkles,
  TrendingUp,
  BarChart2,
} from "lucide-react-native";
import { AuthenticatedHeader } from "~/components/AuthenticatedHeader";
import { useUserStats, CategoryStats } from "~/hooks/useUserStats";
import { router } from "expo-router";

// Category colors for progress bars
const CATEGORY_COLORS: Record<string, string> = {
  speed: "#F59E0B",
  memory: "#F59E0B",
  attention: "#F59E0B",
  flexibility: "#22C55E",
  "problem-solving": "#F59E0B",
  logic: "#8B5CF6",
  focus: "#3B82F6",
};

const DEFAULT_COLOR = "#F59E0B";

interface CategoryRowProps {
  category: CategoryStats;
  onPress?: () => void;
}

function CategoryRow({ category, onPress }: CategoryRowProps) {
  const hasScore = category.score !== null;
  const color = CATEGORY_COLORS[category.id] || DEFAULT_COLOR;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-between py-4 border-b border-border/50"
    >
      <View className="flex-1">
        <H4 className="text-lg font-bold mb-2">{category.name}</H4>
        {hasScore ? (
          <View className="flex-row items-center gap-2">
            {/* Progress bar */}
            <View className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${category.progress}%`,
                  backgroundColor: color,
                }}
              />
            </View>
            <Text className="font-bold text-foreground min-w-[50px] text-right">
              {category.score}
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center gap-2">
            {/* Empty indicator bar */}
            <View
              className="w-2 h-6 rounded-full"
              style={{ backgroundColor: color }}
            />
            <Muted className="text-base">--</Muted>
          </View>
        )}
      </View>
      <ChevronRight size={20} className="text-muted-foreground ml-3" />
    </TouchableOpacity>
  );
}

interface LockedSectionProps {
  icon: React.ReactNode;
  title: string;
}

function LockedSection({ icon, title }: LockedSectionProps) {
  return (
    <Card className="mb-4 overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <View className="flex-row justify-between items-center p-4">
          <View className="flex-row items-center gap-2">
            {icon}
            <Text className="text-sm font-bold text-muted-foreground tracking-wide">
              {title}
            </Text>
          </View>
          <TouchableOpacity className="flex-row items-center bg-secondary rounded-full px-3 py-1.5">
            <Text className="text-secondary-foreground text-xs font-bold mr-1">
              UNLOCK
            </Text>
            <Lock size={12} color="white" />
          </TouchableOpacity>
        </View>

        {/* Locked Content Overlay */}
        <View className="items-center justify-center py-8 bg-card/50">
          <Lock size={28} className="text-muted-foreground mb-3" />
          <P className="text-muted-foreground text-center px-8">
            This feature is available with a Premium subscription.
          </P>
        </View>
      </CardContent>
    </Card>
  );
}

export default function StatsScreen() {
  const { overallBPI, categoryStats, totalGamesPlayed, isLoading, error } =
    useUserStats();

  const hasOverallBPI = overallBPI !== null;
  const categoriesWithData = categoryStats.filter(
    (c) => c.score !== null
  ).length;

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
          {/* Page Title */}
          <H1 className="mb-6 pt-4">My stats</H1>

          {/* BPI Card */}
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              {/* BPI Header */}
              <View className="flex-row justify-between items-center p-4 border-b border-border/50">
                <View className="flex-row items-center gap-2">
                  <Zap size={20} className="text-yellow-500" fill="#eab308" />
                  <Text className="text-sm font-bold text-muted-foreground tracking-wide">
                    BRAIN PERFORMANCE INDEX
                  </Text>
                </View>
                <TouchableOpacity>
                  <Info size={20} className="text-muted-foreground" />
                </TouchableOpacity>
              </View>

              {/* Overall BPI Section */}
              <View className="p-4">
                <View className="flex-row items-center justify-between mb-2">
                  <H4 className="text-xl font-bold">Overall BPI</H4>
                  {hasOverallBPI && (
                    <Text className="text-3xl font-bold text-primary">
                      {overallBPI}
                    </Text>
                  )}
                </View>
                {!hasOverallBPI && (
                  <P className="text-muted-foreground text-base leading-6">
                    Your Overall BPI will be available after playing a game from
                    at least 3 Training Areas below.{" "}
                    {categoriesWithData > 0 && (
                      <Text className="text-primary font-semibold">
                        ({categoriesWithData}/{categoryStats.length} completed)
                      </Text>
                    )}
                  </P>
                )}
                {hasOverallBPI && (
                  <P className="text-muted-foreground text-base">
                    Based on {totalGamesPlayed} games across{" "}
                    {categoriesWithData} training areas.
                  </P>
                )}
              </View>

              {/* Category Breakdown */}
              <View className="px-4 pb-2">
                {isLoading ? (
                  <View className="py-8 items-center">
                    <ActivityIndicator size="large" />
                    <Muted className="mt-2">Loading your stats...</Muted>
                  </View>
                ) : error ? (
                  <View className="py-8 items-center">
                    <P className="text-destructive text-center">
                      Failed to load stats. Pull down to retry.
                    </P>
                  </View>
                ) : categoryStats.length === 0 ? (
                  <View className="py-8 items-center">
                    <Muted className="text-center">
                      No training areas found. Start playing some games!
                    </Muted>
                  </View>
                ) : (
                  categoryStats.map((category) => (
                    <CategoryRow
                      key={category.id}
                      category={category}
                      onPress={() => router.push(`/stat/${category.id}`)}
                    />
                  ))
                )}
              </View>
            </CardContent>
          </Card>

          {/* Premium Sections */}
          <LockedSection
            icon={<Sparkles size={18} className="text-cyan-400" />}
            title="HOW YOU COMPARE"
          />

          <LockedSection
            icon={<BarChart2 size={18} className="text-muted-foreground" />}
            title="GAME STRENGTH PROFILE"
          />

          <LockedSection
            icon={<TrendingUp size={18} className="text-muted-foreground" />}
            title="GAME PROGRESS PROFILE"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
