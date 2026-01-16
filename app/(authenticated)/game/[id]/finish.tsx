import { useEffect } from "react";

import { View, TouchableOpacity } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGameSession } from "~/contexts/GameSessionContext";
import { useGames } from "~/contexts/GamesContext";
import { useUserStats } from "~/contexts/UserStatsContext";
import { H1, P } from "~/components/ui/typography";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import {
  Clock,
  Target,
  Zap,
} from "lucide-react-native";
import LottieView from "lottie-react-native";
import { cn } from "~/lib/utils";

export default function GameFinishScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, resetSession } = useGameSession();
  const { games, refreshDailyProgress } = useGames();
  const { categoryStats, refresh: refreshUserStats } = useUserStats();

  const game = games.find((g) => g.id === id);
  const gameStat = categoryStats
    .find((c) => c.id === game?.category_id)
    ?.gameStats.find((g) => g.gameId === id);

  useEffect(() => {
    refreshDailyProgress();
    refreshUserStats();
  }, []);

  const accuracy =
    state.totalQuestions > 0
      ? Math.round((state.correctCount / state.totalQuestions) * 100)
      : 0;

  const durationSeconds = Math.round(state.durationMs / 1000);
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  const timeDisplay = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, "0")}` : `0:${seconds.toString().padStart(2, "0")}`;

  if (!state.isFinished) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <P className="text-lg text-muted-foreground">No game results found</P>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <P className="text-primary font-bold text-lg">Go Back</P>
        </TouchableOpacity>
      </View>
    );
  }

  const handlePlayAgain = () => {
    resetSession();
    router.replace(`/game/${id}/play`);
  };

  const handleGoHome = () => {
    resetSession();
    router.dismissAll();
    router.replace("/");
  };

  const getFeedback = () => {
    if (accuracy === 100)
      return {
        title: "Flawless",
        sub: "0 mistakes. You're like a pristine, freshwater pearl.",
        color: "text-secondary",
      };
    if (accuracy >= 90)
      return {
        title: "Amazing",
        sub: "So close to perfect! Your focus is incredible.",
        color: "text-green-500",
      };
    if (accuracy >= 70)
      return {
        title: "Great Job",
        sub: "Solid work! You're making real progress.",
        color: "text-sky-500",
      };
    return {
      title: "Keep Going",
      sub: "Every bit of practice helps your brain grow.",
      color: "text-orange-500",
    };
  };

  const feedback = getFeedback();

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        {/* Header - Game Name */}
        <View className="px-6 pt-4 items-center">
          <Text className="text-muted-foreground font-black text-sm uppercase tracking-widest">
            {game?.name || "Game Complete"}
          </Text>
        </View>

        {/* Mojo Area */}
        <View className="flex-1 items-center justify-center -mt-12">
          <LottieView
            source={require("~/assets/animations/session_complete_1.lottie.json")}
            autoPlay
            loop={true}
            style={{ width: 300, height: 300 }}
          />

          <View className="items-center px-10 mt-4">
            <H1 className={cn("text-5xl font-black mb-3", feedback.color)}>
              {feedback.title}
            </H1>
            <P className="text-center text-muted-foreground text-lg leading-6 font-bold px-2">
              {feedback.sub}
            </P>
          </View>
        </View>

        {/* Stat Cards Row */}
        <View className="px-6 flex-row gap-3 mb-10">
          <StatCard
            label="GAME BPI"
            value={gameStat?.averageScore?.toString() || state.score?.toString() || "0"}
            icon={<Zap size={22} color="#EAB308" fill="#EAB308" />}
            color="yellow"
          />
          <StatCard
            label="AMAZING"
            value={`${accuracy}%`}
            icon={<Target size={22} color="#22C55E" strokeWidth={3} />}
            color="green"
          />
          <StatCard
            label="SPEEDY"
            value={timeDisplay}
            icon={<Clock size={22} color="#3B82F6" strokeWidth={3} />}
            color="blue"
          />
        </View>

        {/* Actions */}
        <View className="px-6 pb-8">
          <Button
            className="h-16 rounded-3xl bg-info border-b-8 border-info-edge active:border-b-0 active:mt-2"
            onPress={handleGoHome}
          >
            <Text className="text-white font-black text-xl uppercase tracking-widest">
              Continue
            </Text>
          </Button>

          <TouchableOpacity
            onPress={handlePlayAgain}
            className="mt-8 items-center"
          >
            <Text className="text-muted-foreground font-black text-sm uppercase tracking-widest">
              Play Again
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode, color: 'yellow' | 'green' | 'blue' }) {
  const colorClasses = {
    yellow: "border-yellow-400",
    green: "border-green-500",
    blue: "border-info",
  };

  const headerClasses = {
    yellow: "bg-yellow-400",
    green: "bg-green-500",
    blue: "bg-info",
  };

  return (
    <View className={cn(
      "flex-1 rounded-[32px] border-2 border-b-4 bg-white items-center pb-5 overflow-hidden",
      colorClasses[color]
    )}>
      {/* Card Header Pill */}
      <View className={cn("w-full py-2 items-center mb-5", headerClasses[color])}>
        <Text className="text-[10px] font-black text-white uppercase tracking-widest">
          {label}
        </Text>
      </View>

      {/* Icon + Value */}
      <View className="gap-2 items-center">
        {icon}
        <Text className="text-xl font-black text-foreground">
          {value}
        </Text>
      </View>
    </View>
  );
}
