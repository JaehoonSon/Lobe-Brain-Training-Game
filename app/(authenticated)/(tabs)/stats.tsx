import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { BlurView } from "expo-blur";
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
import { useUserStats, CategoryStats } from "~/hooks/useUserStats";
import { router } from "expo-router";
import { cn } from "~/lib/utils";

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
  const iconColorClass = variant === "primary" ? "text-primary" : "text-secondary";
  const progressBgClass = variant === "primary" ? "bg-primary" : "bg-secondary";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={cn(
        "flex-col py-4 px-4",
        !isLast && "border-b border-muted"
      )}
    >
      {/* Top Row: Icon + Title */}
      <View className="flex-row items-center gap-3 mb-3">
        {/* Icon bubble */}
        <View className="w-10 h-10 rounded-xl bg-muted/30 items-center justify-center">
          <IconComponent size={20} className={iconColorClass} strokeWidth={2.5} />
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
            <View className="flex-row items-center gap-1">
              <Text className="text-xl font-black text-foreground min-w-[30px] text-right">
                {category.score}
              </Text>
              <ChevronRight size={20} className="text-muted-foreground ml-1" />
            </View>
          </>
        ) : (
          <View className="flex-1 flex-row items-center justify-between">
            <P className="text-muted-foreground text-sm font-bold">No games played</P>
            <ChevronRight size={20} className="text-muted-foreground" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// Reusable Content Components for locked states
// Adjusted to use standard colors
function CompareContent() {
  return (
    <View className="h-24 flex-row items-end justify-center gap-1 opacity-60 px-4">
      {[10, 20, 35, 55, 80, 95, 80, 55, 35, 20, 10].map((h, i) => (
        <View key={i} className="w-4 bg-secondary rounded-t-sm" style={{ height: `${h}%` }} />
      ))}
    </View>
  );
}

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

function HistoryContent() {
  return (
    <View className="h-24 flex-row items-end justify-between px-4 opacity-60">
      <View className="w-1/5 h-[30%] bg-muted rounded-t-sm" />
      <View className="w-1/5 h-[45%] bg-muted rounded-t-sm" />
      <View className="w-1/5 h-[60%] bg-muted rounded-t-sm" />
      <View className="w-1/5 h-[50%] bg-muted rounded-t-sm" />
      <View className="w-1/5 h-[90%] bg-primary rounded-t-sm" />
    </View>
  );
}

interface FeatureCardProps {
  title: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}

function FeatureCard({ title, children, variant = "primary" }: FeatureCardProps) {
  // Header: Full brand color fill
  // Text: White
  // Body: Warm Alabaster
  // Border: Juicy 3D Frame (inherited from variant)

  const headerBgClass = variant === "primary" ? "bg-primary" : "bg-secondary";

  return (
    <Card
      frameMode={true}
      className="mb-6 overflow-hidden bg-card p-0"
    >
      <View className="relative">
        {/* 1. Underlying Content (to be blurred) */}
        <View>
          {/* Header Area Spacer */}
          <View className="px-4 pt-4 pb-2">
            <View className="px-4 py-1.5 rounded-full opacity-0">
              <H4 className="text-lg font-black leading-tight">{title}</H4>
            </View>
          </View>

          {/* Body Content */}
          <View className="p-4 pt-0">
            <View className="px-2">
              {children}
            </View>
            {/* Extra padding for the message center alignment */}
            <View className="h-8" />
          </View>
        </View>

        {/* 2. Global Blur - Now covers the whole card */}
        <BlurView intensity={70} tint="light" className="absolute inset-0" />

        {/* 3. Floating Sharp Pill - On top of blur */}
        <View className="absolute top-4 left-4">
          <View className={cn(
            "px-4 py-1.5 rounded-full border-b-4",
            variant === "primary" ? "bg-primary border-primary-edge" : "bg-secondary border-secondary-edge"
          )}>
            <H4 className="text-lg font-black text-white leading-tight">{title}</H4>
          </View>
        </View>

        {/* 4. Minimal Unlock Message - High Contrast on Blur */}
        <View className="absolute inset-0 items-center justify-center p-8">
          <View className="items-center gap-2">
            <Lock size={20} className="text-primary-edge/60" strokeWidth={3} />
            <Text className="text-primary-edge/80  text-center text-lg leading-tight max-w-[220px]">
              This feature is available with a{"\n"}premium subscription
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

export default function StatsScreen() {
  const { overallBPI, categoryStats, isLoading, error } =
    useUserStats();

  const hasOverallBPI = overallBPI !== null;
  const categoriesWithData = categoryStats.filter(
    (c) => c.score !== null
  ).length;

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
        <View className="px-6 pb-6">
          {/* Page Title */}
          <H1 className="mb-6 pt-4 text-3xl font-black">My stats</H1>

          {/* BPI HERO CARD */}
          {/* Use standard bg-primary/border-primary classes */}
          <Card
            frameMode={true}
            className="mb-6 bg-primary border-primary-edge p-6 shadow-xl shadow-primary/20"
          >
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
                <Text className="text-7xl font-black text-primary-foreground tracking-tighter">
                  {overallBPI}
                </Text>
              ) : (
                <Text className="text-6xl font-black text-primary-foreground/30 tracking-tighter">
                  ---
                </Text>
              )}
            </View>

            <View className="mt-4 bg-black/10 rounded-xl p-3 flex-row items-center justify-center border border-black/5">
              {hasOverallBPI ? (
                <Text className="text-primary-foreground font-bold">
                  Top 15% of users this week 🏆
                </Text>
              ) : (
                <Text className="text-primary-foreground/90 font-bold text-center">
                  Play {3 - categoriesWithData} more categories to unlock
                </Text>
              )}
            </View>
          </Card>

          {/* TRAINING AREAS HEADER */}
          <H4 className="mb-4 text-2xl font-black px-1">Training Areas</H4>

          {/* CATEGORIES LIST - UNIFIED CARD */}
          <Card
            frameMode={true}
            className="mb-8 overflow-hidden border-2 border-muted/50 p-0 bg-card"
          >
            {isLoading ? (
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
          <H4 className="mb-4 text-2xl font-black px-1">Detailed Analysis</H4>

          <FeatureCard
            title="How You Compare"
            variant="secondary"
          >
            <CompareContent />
          </FeatureCard>

          <FeatureCard
            title="Strength Profile"
            variant="primary"
          >
            <StrengthContent />
          </FeatureCard>

          <FeatureCard
            title="Progress History"
            variant="secondary"
          >
            <HistoryContent />
          </FeatureCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

