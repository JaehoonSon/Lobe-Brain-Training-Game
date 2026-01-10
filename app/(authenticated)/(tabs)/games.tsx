import { View, ScrollView, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { H1, H3, H4, P, Muted } from "~/components/ui/typography";
import { Text } from "~/components/ui/text";
import { Input } from "~/components/ui/input";
import { Search, Lock, Zap } from "lucide-react-native";
import { router } from "expo-router";
import { useGames } from "~/contexts/GamesContext";
import { Card, ImageCard, CardContent } from "~/components/ui/card";
import { AuthenticatedHeader } from "~/components/AuthenticatedHeader";
import { useRevenueCat } from "~/contexts/RevenueCatProvider";

export default function GamesScreen() {
  const { games, categories, getGamesByCategory } = useGames();
  const { isPro } = useRevenueCat();

  // Temporary logic for "Today's games" - just take the first 3 games
  const todaysGames = games.slice(0, 3);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      {/* Sticky Top Bar & Header */}
      <View className="bg-background z-10 px-6 pt-4 pb-4 border-b border-border/50">
        <AuthenticatedHeader className="mb-4" />

        <H1 className="mb-4 text-3xl font-black">Games</H1>

        {/* Search Bar */}
        <Card className="flex-row items-center px-4 py-1 h-16">
          <Search size={24} className="text-muted-foreground" />
          <Input
            placeholder="What do you want to play?"
            className="flex-1 bg-transparent border-0 text-xl h-full"
          />
        </Card>
      </View>

      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="py-6 gap-8">
          {/* Today's Games Section */}
          <View>
            <H3 className="px-6 mb-4 text-2xl font-black">Today's games</H3>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
            >
              {todaysGames.map((game) => (
                <TouchableOpacity
                  key={game.id}
                  className="w-[180px] gap-2"
                  onPress={() => router.push(`/game/${game.id}`)}
                  activeOpacity={0.7}
                >
                  <ImageCard className="w-full h-[110px]">
                    {game.banner_url ? (
                      <Image
                        source={{ uri: game.banner_url }}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                        }}
                        contentFit="cover"
                      />
                    ) : (
                      <View
                        className="items-center justify-center bg-muted"
                        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                      >
                        <Zap size={36} className="text-muted-foreground" />
                      </View>
                    )}
                    {!isPro && game.is_pro_only && (
                      <View className="absolute top-2 right-2 bg-background/80 rounded-full p-1.5">
                        <Lock size={14} className="text-foreground" />
                      </View>
                    )}
                  </ImageCard>
                  <View className="gap-1 px-1 mt-2">
                    <H4 className="text-lg font-black">{game.name}</H4>
                    <Muted className="text-sm font-bold line-clamp-2">
                      {game.description}
                    </Muted>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Categories Sections */}
          {categories.map((category) => {
            const categoryGames = getGamesByCategory(category.id);
            if (categoryGames.length === 0) return null;

            return (
              <View key={category.id}>
                <H3 className="px-6 mb-4 text-2xl font-black">
                  {category.name}
                </H3>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
                >
                  {categoryGames.map((game) => (
                    <TouchableOpacity
                      key={game.id}
                      className="w-[180px] gap-2"
                      onPress={() => router.push(`/game/${game.id}`)}
                      activeOpacity={0.7}
                    >
                      <ImageCard className="w-full h-[110px]">
                        {game.banner_url ? (
                          <Image
                            source={{ uri: game.banner_url }}
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                            }}
                            contentFit="cover"
                          />
                        ) : (
                          <View
                            className="items-center justify-center bg-muted"
                            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                          >
                            <Zap size={36} className="text-muted-foreground" />
                          </View>
                        )}
                        {!isPro && game.is_pro_only && (
                          <View className="absolute top-2 right-2 bg-background/80 rounded-full p-1.5">
                            <Lock size={14} className="text-foreground" />
                          </View>
                        )}
                      </ImageCard>
                      <View className="gap-1 px-1 mt-2">
                        <H4 className="text-lg font-black">{game.name}</H4>
                        <Muted className="text-sm font-bold line-clamp-2">
                          {category.description || category.name}
                        </Muted>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
