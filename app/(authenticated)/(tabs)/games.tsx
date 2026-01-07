import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { H1, H3, H4, P, Muted } from "~/components/ui/typography";
import { Text } from "~/components/ui/text";
import { Input } from "~/components/ui/input";
import { Search, Lock, Zap } from "lucide-react-native";
import { router } from "expo-router";
import { useGames } from "~/contexts/GamesContext";
import { Card, CardContent } from "~/components/ui/card";
import { AuthenticatedHeader } from "~/components/AuthenticatedHeader";

export default function GamesScreen() {
  const { games, categories, getGamesByCategory } = useGames();

  // Temporary logic for "Today's games" - just take the first 3 games
  const todaysGames = games.slice(0, 3);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      {/* Sticky Top Bar & Header */}
      <View className="bg-background z-10 px-6 pt-2 pb-4 border-b border-border/50">
        <AuthenticatedHeader className="mb-4" />

        <H1 className="mb-4">Games</H1>

        {/* Search Bar */}
        <View className="flex-row items-center bg-muted/30 rounded-xl overflow-hidden pl-4">
          <Search size={24} className="text-muted-foreground" />
          <Input
            placeholder="What do you want to play?"
            className="flex-1 bg-transparent border-0 h-16 text-xl"
          />
        </View>
      </View>

      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="py-6 gap-8">
          {/* Today's Games Section */}
          <View>
            <H3 className="px-6 mb-4 text-2xl font-bold">Today's games</H3>
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
                >
                  <View className="w-full h-[110px] rounded-xl overflow-hidden bg-muted">
                    {game.banner_url ? (
                      <Image
                        source={{ uri: game.banner_url }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-full h-full items-center justify-center bg-primary/20">
                        <Zap size={36} className="text-primary" />
                      </View>
                    )}
                  </View>
                  <View className="gap-1">
                    <H4 className="leading-tight">
                      {game.name}
                    </H4>
                    <Muted className="text-base">
                      {game.description?.split(" ")[0]}.. (Cat)
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
                <H3 className="px-6 mb-4 text-2xl font-bold">{category.name}</H3>
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
                    >
                      <View className="w-full h-[110px] rounded-xl overflow-hidden bg-muted relative">
                        {game.banner_url ? (
                          <Image
                            source={{ uri: game.banner_url }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="w-full h-full items-center justify-center bg-muted">
                            <Zap size={36} className="text-muted-foreground" />
                          </View>
                        )}
                        {!game.is_active && (
                          <View className="absolute top-2 right-2 bg-background/80 rounded-full p-1.5">
                            <Lock size={14} className="text-foreground" />
                          </View>
                        )}
                      </View>
                      <View className="gap-1">
                        <H4 className="leading-tight">
                          {game.name}
                        </H4>
                        <Muted className="text-base">
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

