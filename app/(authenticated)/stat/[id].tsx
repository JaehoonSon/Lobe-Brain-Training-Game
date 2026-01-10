import React from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ChevronLeft, Zap, Lock, TrendingUp } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { H1, H4, P, Muted } from "~/components/ui/typography";
import { BlurView } from "expo-blur";
import { cn } from "~/lib/utils";
import { Card, CardContent } from "~/components/ui/card";
import { Text } from "~/components/ui/text";
import { useUserStats } from "~/hooks/useUserStats";
import { useGames } from "~/contexts/GamesContext";
import { FeatureCard } from "~/components/FeatureCard";

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
          {/* Hero BPI Section */}
          {/* Hero BPI Section - Duolingo Style */}
          <View className="mb-8 pt-4 flex-row items-center justify-between px-2">
            <View className="overflow-visible">
              <Text
                className="text-8xl font-black text-primary"
                style={{
                  lineHeight: 100,
                  textShadowColor: "rgba(0, 0, 0, 0.1)",
                  textShadowOffset: { width: 2, height: 4 },
                  textShadowRadius: 0,
                }}
              >
                {hasScore ? category.score : "--"}
              </Text>
              <View className="flex-row items-center gap-2 ml-1 -mt-3">
                <Text className="text-3xl font-black text-primary/80 tracking-tighter">
                  current bpi
                </Text>
                {hasScore && (
                  <TrendingUp
                    size={16}
                    className="text-primary"
                    strokeWidth={3}
                  />
                )}
              </View>
            </View>

            {/* Big Icon */}
            <View className="shadow-lg shadow-orange-500/20">
              <Image
                source={require("~/assets/brain_workout_clay_3d.png")}
                style={{ width: 160, height: 160 }}
                contentFit="contain"
              />
            </View>
          </View>

          {/* LPI History Card (Locked) */}
          <FeatureCard title="How You Compare" variant="secondary">
            <View className="h-24 flex-row items-end justify-center gap-1 opacity-60 px-4">
              {[10, 20, 35, 55, 80, 95, 80, 55, 35, 20, 10].map((h, i) => (
                <View
                  key={i}
                  className="w-4 bg-secondary rounded-t-sm"
                  style={{ height: `${h}%` }}
                />
              ))}
            </View>
          </FeatureCard>

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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
