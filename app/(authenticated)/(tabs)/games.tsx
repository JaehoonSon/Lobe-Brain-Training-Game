import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { H1, H3, P, Muted } from "~/components/ui/typography";
import { Search, Lock, Zap } from "lucide-react-native";
import { router } from "expo-router";
import { useGames } from "~/contexts/GamesContext";
import { Card, CardContent } from "~/components/ui/card";
import { useColorScheme } from "react-native";
import { AuthenticatedHeader } from "~/components/AuthenticatedHeader";

export default function GamesScreen() {
  const { games, categories, getGamesByCategory } = useGames();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Temporary logic for "Today's games" - just take the first 3 games
  const todaysGames = games.slice(0, 3);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      {/* Sticky Top Bar & Header */}
      <View className="bg-background z-10 px-6 pt-2 pb-4 border-b border-border/50">
        <AuthenticatedHeader className="mb-4" />

        <H1 className="mb-4">Games</H1>

        {/* Search Bar */}
        <View className="flex-row items-center bg-muted/50 rounded-lg px-3 py-2.5 overflow-hidden">
          <Search size={20} className="text-muted-foreground mr-2" />
          <TextInput
            placeholder="What do you want to play?"
            placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
            className="flex-1 text-base text-foreground h-full"
            style={{ fontSize: 16 }}
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
            <H3 className="px-6 mb-4 text-lg font-bold">Today's games</H3>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
            >
              {todaysGames.map((game) => (
                <TouchableOpacity
                  key={game.id}
                  className="w-[160px] gap-2"
                  onPress={() => router.push(`/game/${game.id}`)}
                >
                  <View className="w-full h-[100px] rounded-lg overflow-hidden bg-muted">
                    {game.banner_url ? (
                      <Image
                        source={{ uri: game.banner_url }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-full h-full items-center justify-center bg-primary/20">
                        <Zap size={32} className="text-primary" />
                      </View>
                    )}
                  </View>
                  <View>
                    <P className="font-bold text-base leading-tight">
                      {game.name}
                    </P>
                    <Muted className="text-xs">
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
                <H3 className="px-6 mb-4 text-lg font-bold">{category.name}</H3>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}
                >
                  {categoryGames.map((game) => (
                    <TouchableOpacity
                      key={game.id}
                      className="w-[160px] gap-2"
                      onPress={() => router.push(`/game/${game.id}`)}
                    >
                      <View className="w-full h-[100px] rounded-lg overflow-hidden bg-muted relative">
                        {game.banner_url ? (
                          <Image
                            source={{ uri: game.banner_url }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="w-full h-full items-center justify-center bg-muted">
                            <Zap size={32} className="text-muted-foreground" />
                          </View>
                        )}
                        {!game.is_active && (
                          <View className="absolute top-2 right-2 bg-background/80 rounded-full p-1">
                            <Lock size={12} className="text-foreground" />
                          </View>
                        )}
                      </View>
                      <View>
                        <P className="font-bold text-base leading-tight">
                          {game.name}
                        </P>
                        <Muted className="text-xs text-muted-foreground">
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
