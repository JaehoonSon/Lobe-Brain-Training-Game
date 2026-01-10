import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useGames } from "~/contexts/GamesContext";
import { H1, H4, P } from "~/components/ui/typography";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import {
  ChevronLeft,
  X,
  Trophy,
  Hexagon,
  Crown,
  Star,
  Lock,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRevenueCat } from "~/contexts/RevenueCatProvider";

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { games, categories } = useGames();
  const { isPro, presentPaywall } = useRevenueCat();

  const game = games.find((g) => g.id === id);
  const category = categories.find((c) => c.id === game?.category_id);

  // Check if the game is locked for this user
  const isLocked = !isPro && game?.is_pro_only;

  if (!game) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
        <P className="mt-4 text-lg">Loading game...</P>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <P className="text-primary font-bold text-lg">Go Back</P>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background relative">
      {/* Close Button Overlay */}
      <TouchableOpacity
        onPress={() => router.back()}
        className="absolute top-12 left-6 z-20 w-12 h-12 rounded-full bg-black/40 items-center justify-center"
      >
        <X color="white" size={24} />
      </TouchableOpacity>

      <ScrollView className="flex-1 pb-32">
        {/* Banner Image */}
        <View className="w-full h-[300px] relative bg-muted">
          {game.banner_url ? (
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
          {/* Gradient Overlay for Text Readability */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.6)"]}
            className="absolute bottom-0 left-0 right-0 h-40 justify-end px-6 pb-6"
          >
            <H1 className="text-white text-4xl font-black">{game.name}</H1>
          </LinearGradient>
        </View>

        {/* Content */}
        <View className="px-6 py-6 bg-background">
          {/* Breadcrumbs */}
          <View className="flex-row items-center mb-6">
            <P className="text-sm font-black tracking-widest uppercase text-muted-foreground">
              {category?.name || "GAME"}
            </P>
            <View className="mx-2">
              <P className="text-sm font-black text-muted-foreground">{">"}</P>
            </View>
            <P className="text-sm font-black tracking-widest uppercase text-muted-foreground">
              {category?.description?.split(" ")[0] || "SKILL"}
            </P>
          </View>

          {/* Description */}
          <P className="text-xl leading-8 mb-8 text-foreground/90">
            {game.description}
          </P>

          <P className="text-lg text-muted-foreground leading-7 mb-8">
            {game.instructions || "Play consistently to improve your scores."}
          </P>

          {/* Stats Grid - Mocked Data */}
          <View className="gap-6">
            {/* LPI Row */}
            <View className="flex-row justify-between items-center py-3 border-b border-border/50">
              <H4 className="font-black text-xl">Game LPI</H4>
              <View className="bg-primary/20 px-4 py-2 rounded-full border border-primary/50 flex-row items-center gap-2">
                <Trophy size={16} className="text-primary" />
                <Text className="text-sm font-black text-primary">UNLOCK</Text>
              </View>
            </View>

            {/* Best Score Row */}
            <View className="flex-row justify-between items-center py-3 border-b border-border/50">
              <H4 className="font-black text-xl">Best Score</H4>
              <P className="text-muted-foreground font-bold text-xl">-</P>
            </View>

            {/* Best Stat Row */}
            <View className="flex-row justify-between items-center py-3 border-b border-border/50">
              <H4 className="font-black text-xl">Best Stat</H4>
              <P className="text-muted-foreground font-bold text-xl">-</P>
            </View>

            {/* Newcomer Badges Row */}
            <View className="flex-row justify-between items-center py-3 border-b border-border/50">
              <H4 className="font-black text-xl">Newcomer</H4>
              <View className="flex-row gap-3">
                <Hexagon
                  size={28}
                  className="text-secondary fill-transparent"
                  strokeWidth={2}
                />
                <Hexagon size={28} className="text-muted-foreground/30" />
                <Star size={28} className="text-muted-foreground/30" />
                <Crown size={28} className="text-muted-foreground/30" />
              </View>
            </View>

            {/* Total Plays Row */}
            <View className="flex-row justify-between items-center py-3">
              <H4 className="font-black text-xl">Total Plays</H4>
              <View className="flex-row items-baseline gap-1">
                <P className="text-2xl font-black">0</P>
                <P className="text-base font-bold text-muted-foreground">
                  of 3
                </P>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Spacer for Sticky Footer */}
        <View className="h-32" />
      </ScrollView>

      {/* Sticky Footer */}
      <SafeAreaView
        edges={["bottom"]}
        className="absolute bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg z-20"
      >
        <View className="px-6 py-4 flex-row items-center gap-4">
          <Button
            variant="outline"
            onPress={() => router.back()}
            className="h-14 w-14 rounded-full border-2 border-muted-foreground/20 p-0 items-center justify-center mr-4"
          >
            <ChevronLeft size={24} className="text-muted-foreground" />
          </Button>

          <Button
            className="flex-1 rounded-full h-12 native:h-16 px-10"
            onPress={async () => {
              if (isLocked) {
                await presentPaywall();
              } else {
                router.replace(`/game/${id}/play`);
              }
            }}
          >
            {isLocked ? (
              <View className="flex-row items-center gap-2">
                <Lock size={18} color="white" />
                <Text className="text-white font-black text-lg">
                  Unlock Pro
                </Text>
              </View>
            ) : (
              <Text className="text-primary-foreground font-black text-lg">
                Start Game
              </Text>
            )}
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}
