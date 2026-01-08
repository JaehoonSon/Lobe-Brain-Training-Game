import React from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ChevronLeft, Zap, Lock, TrendingUp } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { H1, H4, P, Muted } from "~/components/ui/typography";
import { Card, CardContent } from "~/components/ui/card";
import { Text } from "~/components/ui/text";
import { useUserStats } from "~/hooks/useUserStats";
import { useGames } from "~/contexts/GamesContext";

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { categoryStats, isLoading } = useUserStats();
  const { games } = useGames();

  // Find the category stats for this ID
  const category = categoryStats.find((c) => c.id === id);

  // Get games in this category
  const categoryGames = games.filter((g) => g.category_id === id);

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
          {/* Current LPI Section */}
          <Animated.View
            entering={FadeInDown.duration(400)}
            className="mt-4 mb-6"
          >
            <View className="flex-row items-center gap-2 mb-2">
              <Zap size={24} className="text-yellow-500" fill="#eab308" />
              <Muted className="text-sm">Current BPI</Muted>
            </View>
            <H1 className="text-5xl font-bold mb-3">
              {hasScore ? category.score : "--"}
            </H1>
            <View className="flex-row items-center gap-4">
              <View className="flex-row items-center gap-2">
                <Muted className="text-sm">FIRST</Muted>
                <P className="font-bold">{hasScore ? category.score : "--"}</P>
              </View>
              <Muted>|</Muted>
              <View className="flex-row items-center gap-2">
                <Muted className="text-sm">BEST</Muted>
                <P className="font-bold">{category.highestScore ?? "--"}</P>
              </View>
            </View>
          </Animated.View>

          {/* LPI History Card (Locked) */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Card className="mb-6 overflow-hidden">
              <CardContent className="p-0">
                {/* Header */}
                <View className="flex-row justify-between items-center p-4 border-b border-border/50">
                  <View className="flex-row items-center gap-2">
                    <TrendingUp size={18} className="text-muted-foreground" />
                    <Text className="text-sm font-bold text-muted-foreground tracking-wide">
                      {category.name.toUpperCase()} BPI HISTORY
                    </Text>
                  </View>
                  <TouchableOpacity className="flex-row items-center bg-secondary rounded-full px-3 py-1.5">
                    <Text className="text-secondary-foreground text-xs font-bold mr-1">
                      UNLOCK
                    </Text>
                    <Lock size={12} color="white" />
                  </TouchableOpacity>
                </View>

                {/* Locked Content */}
                <View className="items-center justify-center py-12 bg-card/50">
                  <Lock size={32} className="text-muted-foreground mb-3" />
                  <P className="text-muted-foreground text-center px-8 mb-4">
                    Track your progress with Training History in Brain App
                    Premium.
                  </P>
                </View>
              </CardContent>
            </Card>
          </Animated.View>

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
              <View className="gap-3">
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
                      <Card className="overflow-hidden">
                        <CardContent className="p-4">
                          <View className="flex-row items-center justify-between">
                            <View className="flex-1">
                              <H4 className="text-base font-bold mb-1">
                                {game.name}
                              </H4>
                              {hasPlayed ? (
                                <View className="flex-row items-center gap-3">
                                  <Muted className="text-sm">
                                    Played: {gameStats.gamesPlayed}
                                  </Muted>
                                  <Muted className="text-sm">
                                    Best: {gameStats.highestScore ?? "--"}
                                  </Muted>
                                </View>
                              ) : (
                                <Muted className="text-sm">
                                  Not played yet
                                </Muted>
                              )}
                            </View>
                            {hasPlayed && gameStats.averageScore && (
                              <View className="items-end">
                                <P className="text-2xl font-bold text-primary">
                                  {gameStats.averageScore}
                                </P>
                                <Muted className="text-xs">AVG</Muted>
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
