import React, { useEffect } from "react";
import { View, TouchableOpacity, ScrollView, Image } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGameSession } from "~/contexts/GameSessionContext";
import { useGames } from "~/contexts/GamesContext";
import { H1, P } from "~/components/ui/typography";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import {
  Clock,
  Target,
  ChevronLeft,
  RotateCcw,
  Hexagon,
  Zap,
  X,
} from "lucide-react-native";
import LottieView from "lottie-react-native";

export default function GameFinishScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, config, resetSession } = useGameSession();
  const { games, categories, refreshDailyProgress } = useGames();

  const game = games.find((g) => g.id === id);
  const category = categories.find((c) => c.id === game?.category_id);

  // Refresh daily progress when finish screen loads
  useEffect(() => {
    refreshDailyProgress();
  }, []);

  // Calculate stats
  const accuracy =
    state.totalQuestions > 0
      ? Math.round((state.correctCount / state.totalQuestions) * 100)
      : 0;

  const durationSeconds = Math.round(state.durationMs / 1000);
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  const timeDisplay = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  // Handle no session data (direct navigation to finish without playing)
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

  return (
    <View className="flex-1 bg-background">
      {/* Close Button Overlay */}
      <TouchableOpacity
        onPress={handleGoHome}
        className="absolute top-12 left-6 z-20 w-12 h-12 rounded-full bg-black/40 items-center justify-center"
      >
        <X color="white" size={24} />
      </TouchableOpacity>

      {/* Banner Image */}
      <View className="w-full h-[200px] relative bg-muted">
        {game?.banner_url ? (
          <Image
            source={{ uri: game.banner_url }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center bg-muted">
            <Hexagon size={72} className="text-muted-foreground" />
          </View>
        )}
        {/* Overlay with title */}
        <View className="absolute bottom-0 left-0 right-0 h-24 justify-end px-6 pb-4">
          <P className="text-sm font-black tracking-widest uppercase text-white mb-1 text-shadow">
            Round Complete
          </P>
          <H1 className="text-3xl font-black text-white text-shadow">
            {config?.gameName || game?.name || "Game"}
          </H1>
        </View>
      </View>

      {/* Lottie Animation - Takes up flexible middle space */}
      <View className="flex-1 items-center justify-center">
        <LottieView
          source={require("~/assets/animations/session_complete_1.lottie.json")}
          autoPlay
          loop={true}
          style={{ width: 200, height: 200 }}
        />
      </View>

      {/* Stats Row - 3 Horizontal Cards */}
      <View className="px-6 flex-row gap-3 pb-6">
        {/* BPI Card - Yellow */}
        <View className="flex-1 bg-yellow-400 rounded-2xl p-4 items-center">
          <Text className="text-yellow-900/70 font-bold text-xs uppercase tracking-wider mb-2">
            Total XP
          </Text>
          <View className="flex-row items-center gap-1">
            <Zap size={18} color="#713f12" fill="#713f12" />
            <Text className="text-yellow-900 text-2xl font-black">
              {state.score ?? 0}
            </Text>
          </View>
        </View>

        {/* Accuracy Card - Green */}
        <View className="flex-1 bg-green-500 rounded-2xl p-4 items-center">
          <Text className="text-green-900/70 font-bold text-xs uppercase tracking-wider mb-2">
            Good
          </Text>
          <View className="flex-row items-center gap-1">
            <Target size={18} color="#14532d" />
            <Text className="text-green-900 text-2xl font-black">
              {accuracy}%
            </Text>
          </View>
        </View>

        {/* Time Card - Blue */}
        <View className="flex-1 bg-blue-400 rounded-2xl p-4 items-center">
          <Text className="text-blue-900/70 font-bold text-xs uppercase tracking-wider mb-2">
            Speedy
          </Text>
          <View className="flex-row items-center gap-1">
            <Clock size={18} color="#1e3a5f" />
            <Text className="text-blue-900 text-2xl font-black">
              {minutes}:{seconds.toString().padStart(2, "0")}
            </Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <SafeAreaView
        edges={["bottom"]}
        className="bg-background border-t border-border"
      >
        <View className="px-6 py-4 flex-row items-center gap-4">
          <Button
            variant="outline"
            onPress={handleGoHome}
            className="h-14 w-14 rounded-full border-2 border-muted-foreground/20 p-0 items-center justify-center mr-4"
          >
            <ChevronLeft size={24} className="text-muted-foreground" />
          </Button>

          <Button
            size="xl"
            className="flex-1 rounded-full"
            onPress={handlePlayAgain}
          >
            <View className="flex-row items-center gap-2">
              <RotateCcw size={20} color="white" />
              <Text className="text-primary-foreground font-black text-lg">
                Play Again
              </Text>
            </View>
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}
