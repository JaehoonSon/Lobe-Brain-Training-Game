import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  useColorScheme,
  Text,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useGames } from "~/contexts/GamesContext";
import { H1, H3, P, Muted } from "~/components/ui/typography";
import {
  ArrowLeft,
  X,
  Trophy,
  Hexagon,
  Crown,
  Star,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { cn } from "~/lib/utils";

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams();
  const { games, categories } = useGames();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const game = games.find((g) => g.id === id);
  const category = categories.find((c) => c.id === game?.category_id);

  if (!game) {
    // Handle loading or not found state better in real app
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
        <P className="mt-4">Loading game...</P>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <P className="text-primary font-bold">Go Back</P>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background relative">
      {/* Close Button Overlay */}
      <TouchableOpacity
        onPress={() => router.back()}
        className="absolute top-12 left-6 z-20 w-10 h-10 rounded-full bg-black/40 items-center justify-center"
      >
        <X color="white" size={20} />
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
            <View className="flex-1 items-center justify-center bg-gray-800">
              <Hexagon size={64} className="text-gray-600" />
            </View>
          )}
          {/* Gradient Overlay for Text Readability */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            className="absolute bottom-0 left-0 right-0 h-32 justify-end px-6 pb-6"
          >
            <H1 className="text-white text-4xl text-shadow">{game.name}</H1>
          </LinearGradient>
        </View>

        {/* Content */}
        <View className="px-6 py-6 bg-background">
          {/* Breadcrumbs */}
          <View className="flex-row items-center mb-6">
            <P className="text-xs font-bold tracking-widest uppercase text-muted-foreground">
              {category?.name || "GAME"}
            </P>
            <View className="mx-2">
              <P className="text-xs text-muted-foreground">{">"}</P>
            </View>
            <P className="text-xs font-bold tracking-widest uppercase text-muted-foreground">
              {category?.description?.split(" ")[0] || "SKILL"}
            </P>
          </View>

          {/* Description */}
          <P className="text-lg leading-7 mb-8 text-foreground/90">
            {game.description}
          </P>

          <P className="text-base text-muted-foreground leading-6 mb-8">
            {game.instructions || "Play consistently to improve your scores."}
          </P>

          {/* Stats Grid - Mocked Data */}
          <View className="gap-6">
            {/* LPI Row */}
            <View className="flex-row justify-between items-center py-2 border-b border-border/50">
              <H3 className="text-base">Game LPI</H3>
              <View className="bg-yellow-400/20 px-3 py-1 rounded-full border border-yellow-400/50 flex-row items-center gap-1">
                <Trophy
                  size={12}
                  className="text-yellow-600 dark:text-yellow-400"
                />
                <P className="text-xs font-bold text-yellow-700 dark:text-yellow-300">
                  UNLOCK
                </P>
              </View>
            </View>

            {/* Best Score Row */}
            <View className="flex-row justify-between items-center py-2 border-b border-border/50">
              <H3 className="text-base">Best Score</H3>
              <P className=" text-muted-foreground text-lg">-</P>
            </View>

            {/* Best Stat Row */}
            <View className="flex-row justify-between items-center py-2 border-b border-border/50">
              <H3 className="text-base">Best Stat</H3>
              <P className=" text-muted-foreground text-lg">-</P>
            </View>

            {/* Newcomer Badges Row */}
            <View className="flex-row justify-between items-center py-2 border-b border-border/50">
              <H3 className="text-base">Newcomer</H3>
              <View className="flex-row gap-2">
                <Hexagon
                  size={24}
                  className="text-green-500 fill-transparent"
                  strokeWidth={2}
                />
                <Hexagon size={24} className="text-muted-foreground/30" />
                <Star size={24} className="text-muted-foreground/30" />
                <Crown size={24} className="text-muted-foreground/30" />
              </View>
            </View>

            {/* Total Plays Row */}
            <View className="flex-row justify-between items-center py-2">
              <H3 className="text-base">Total Plays</H3>
              <View className="flex-row items-baseline gap-1">
                <P className="text-xl font-bold">0</P>
                <P className="text-sm text-muted-foreground">of 3</P>
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
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center justify-center h-12 px-4"
          >
            <ArrowLeft size={18} className="text-orange-500 mr-2" />
            <P className="text-orange-500 font-bold uppercase text-sm tracking-wide">
              All Games
            </P>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-orange-500 h-14 rounded-full items-center justify-center active:bg-orange-600 shadow-md"
            onPress={() => console.log("Start Tutorial")}
          >
            <P className="text-white font-bold text-lg">Start Tutorial</P>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
