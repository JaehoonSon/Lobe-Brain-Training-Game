import React, { useEffect } from "react";
import { View } from "react-native";
import { Text } from "~/components/ui/text";
import { Brain } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

interface PlanCreationStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function PlanCreationStep({ onNext }: PlanCreationStepProps) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    // Pulse animation
    scale.value = withRepeat(
      withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    opacity.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );

    // Simulate analyzing/creating plan
    const timer = setTimeout(() => {
      onNext();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onNext]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View className="flex-1 bg-background items-center justify-center p-6">
      <View className="items-center gap-10">
        {/* Pulsing Brain Icon - Primary Purple */}
        <Animated.View style={animatedStyle}>
          <Brain size={120} color="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
        </Animated.View>

        <View className="items-center gap-3">
          <Text className="text-3xl font-bold text-center text-foreground">
            {t("onboarding.steps.plan_creation.title")}
          </Text>
          <Text className="text-xl text-muted-foreground text-center">
            {t("onboarding.steps.plan_creation.subtitle")}
          </Text>
        </View>
      </View>
    </View>
  );
}
