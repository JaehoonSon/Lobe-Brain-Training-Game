import React, { useState, useRef } from "react";
import { View, Dimensions, FlatList, ViewToken } from "react-native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import Animated, {
  FadeInDown,
  LinearTransition,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CustomStepProps } from "~/app/(onboarding)/index";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";

const { width } = Dimensions.get("window");

export default function PremiumFeaturesStep({ onNext }: CustomStepProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const slidesData = t("onboarding.steps.premium_features.slides", {
    returnObjects: true,
  }) as any[];

  const slides = slidesData.map((slide, index) => ({
    ...slide,
    id: (index + 1).toString(),
    image: [
      require("~/assets/premium_recommendations.png"),
      require("~/assets/premium_science.png"),
      require("~/assets/premium_tracking.png"),
    ][index],
  }));

  const [currentIndex, setCurrentIndex] = useState(0);

  // Ref for FlatList
  const flatListRef = useRef<FlatList>(null);

  // Update index on scroll
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
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
            {t("onboarding.steps.premium_features.badge")}
          </Text>
          <Text className="text-4xl font-black text-center text-foreground mb-4">
            {t("onboarding.steps.premium_features.title")}
          </Text>
        </Animated.View>

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
              }}
            >
              <View className="items-center justify-center p-4 mb-4">
                <Image
                  source={item.image}
                  style={{ width: 200, height: 200, resizeMode: "contain" }}
                  cachePolicy="memory"
                />
              </View>
              <Text className="text-2xl font-bold text-center text-foreground mb-4">
                {item.title}
              </Text>
              <Text className="text-lg text-muted-foreground text-center">
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
        />

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
                className={`h-2 rounded-full ${
                  isActive ? "bg-primary w-6" : "bg-primary/20 w-2"
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
        <Button
          className="w-full rounded-2xl h-12 native:h-16"
          onPress={onNext}
        >
          <Text className="font-bold text-xl text-primary-foreground">
            {t("common.continue")}
          </Text>
        </Button>
      </Animated.View>
    </View>
  );
}
