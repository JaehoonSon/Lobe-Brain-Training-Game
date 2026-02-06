import React from "react";
import { View } from "react-native";
import { Flame } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CustomStepProps } from "~/app/(onboarding)/index";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";

export default function DailyStreakStep({ onNext }: CustomStepProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const days = t("onboarding.steps.daily_streak.days", {
    returnObjects: true,
  }) as string[];
  const activeDayIndex = new Date().getDay();

  return (
    <View
      className="flex-1 bg-background px-6"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
    >
      <View className="flex-1 justify-center items-center">
        {/* Title */}
        <Animated.View entering={FadeInDown.duration(600).springify()}>
          <Text className="text-4xl font-extrabold text-foreground text-center mb-12">
            {t("onboarding.steps.daily_streak.title")}
          </Text>
        </Animated.View>

        {/* Main Icon */}
        <Animated.View
          entering={ZoomIn.delay(200).duration(600).springify()}
          className="mb-16 shadow-lg shadow-orange-500/20"
        >
          <View className="bg-orange-100/20 p-8 rounded-full">
            <Flame
              size={120}
              color="#F97316" // Orange-500
              fill="#F97316"
            />
          </View>
        </Animated.View>

        {/* Days Row */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(600)}
          className="flex-row justify-between w-full max-w-xs mb-16 px-4"
        >
          {days.map((day, index) => {
            const isActive = index === activeDayIndex;
            return (
              <View key={index} className="items-center gap-3">
                <View
                  className={`w-4 h-4 rounded-full ${
                    isActive ? "bg-transparent" : "bg-muted"
                  } justify-center items-center`}
                >
                  {isActive && (
                    <Flame
                      size={24}
                      color="#F97316"
                      fill="#F97316"
                      style={{ marginTop: -4 }} // Visual adjustment
                    />
                  )}
                </View>
                <Text
                  className={`text-sm font-bold ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {day}
                </Text>
              </View>
            );
          })}
        </Animated.View>

        {/* Subtext */}
        <Animated.View entering={FadeInDown.delay(600).duration(600)}>
          <Text className="text-xl text-muted-foreground text-center px-8">
            {t("onboarding.steps.daily_streak.subtext")}
          </Text>
        </Animated.View>
      </View>

      {/* Continue Button */}
      <Animated.View entering={FadeInDown.delay(800).duration(600)}>
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
