import React, { useState, useRef } from "react";
import { View, Image, Dimensions, FlatList, ViewToken } from "react-native";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { CustomStepProps } from "~/app/(onboarding)/index";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
  LinearTransition,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    title: "Personalized daily\nrecommendations",
    description:
      "Generated using your activity patterns and training preferences.",
    image: require("~/assets/premium_recommendations.png"), // Placeholder for now, user will need to move generated files
  },
  {
    id: "2",
    title: "Games based on science",
    description:
      "Always stay challenged with games that adapt to your skill level.",
    image: require("~/assets/premium_science.png"),
  },
  {
    id: "3",
    title: "Performance tracking",
    description:
      "Gain insights into your progress throughout your brain-training journey.",
    image: require("~/assets/premium_tracking.png"),
  },
];

export default function PremiumFeaturesStep({ onNext }: CustomStepProps) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Ref for FlatList
  const flatListRef = useRef<FlatList>(null);

  // Update index on scroll
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
    >
      <View className="flex-1">
        <Animated.View
          entering={FadeInDown.duration(600)}
          className="pt-4 px-6 items-center"
        >
          <Text className="text-xl font-bold text-primary uppercase tracking-widest mb-2">
            Unlock Everything
          </Text>
          <Text className="text-4xl font-black text-center text-foreground mb-4">
            Get more with{"\n"}Brain App Premium
          </Text>
        </Animated.View>

        <View className="flex-1">
          <FlatList
            ref={flatListRef}
            data={slides}
            renderItem={({ item }) => (
              <View
                style={{
                  width,
                  paddingHorizontal: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                }}
              >
                <View className="items-center justify-center p-4 mb-4">
                  <Image
                    source={item.image}
                    style={{ width: 220, height: 220, resizeMode: "contain" }}
                  />
                </View>
                <Text className="text-2xl font-bold text-center text-foreground mb-3">
                  {item.title}
                </Text>
                <Text className="text-lg text-muted-foreground text-center px-4">
                  {item.description}
                </Text>
              </View>
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            bounces={false}
            keyExtractor={(item) => item.id}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            scrollEventThrottle={32}
            contentContainerStyle={{ alignItems: "center" }}
          />
        </View>

        {/* Pagination Dots */}
        <View className="flex-row justify-center items-center gap-2 mb-8">
          {slides.map((_, index) => {
            const isActive = currentIndex === index;
            // Using inline animated styles for simplicity given we have the index state
            // For a truly "perfect" 60fps scroll-driven animation we'd need useAnimatedScrollHandler
            // but for "ugly" and "spacing" fixes, smooth state transition is huge improvement.
            return (
              <Animated.View
                key={index}
                layout={LinearTransition.springify().damping(15).stiffness(100)}
                className={`h-2 rounded-full ${isActive ? "bg-primary w-6" : "bg-primary/20 w-2"
                  }`}
              />
            );
          })}
        </View>
      </View>

      <Animated.View
        entering={FadeInDown.delay(300).duration(600)}
        className="px-6"
      >
        <Button className="w-full rounded-2xl h-12 native:h-16" onPress={onNext}>
          <Text className="font-bold text-xl text-primary-foreground">Continue</Text>
        </Button>
      </Animated.View>
    </View>
  );
}
