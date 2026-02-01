import React, { useEffect } from "react";
import { View, Image, ImageSourcePropType } from "react-native";
import { Text } from "~/components/ui/text";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

export interface AffirmationStepConfig {
  type: "affirmation";
  image: ImageSourcePropType;
  headline: string;
  subtext: string;
}

interface AffirmationStepProps {
  config: AffirmationStepConfig;
  onNextDisabled: (disabled: boolean) => void;
}

export function AffirmationStep({
  config,
  onNextDisabled,
}: AffirmationStepProps) {
  const { t } = useTranslation();
  useEffect(() => {
    onNextDisabled(false); // No input needed, always enabled
  }, []);

  return (
    <View className="flex-1 items-center justify-center p-4">
      <Animated.View
        entering={ZoomIn.duration(600).springify()}
        className="w-64 h-64 mb-8 items-center justify-center"
      >
        <Image
          source={config.image}
          style={{ width: 256, height: 256, resizeMode: "contain" }}
        />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(300).duration(600)}>
        <Text className="text-3xl font-extrabold text-center text-foreground mb-4">
          {t(config.headline)}
        </Text>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(500).duration(600)}>
        <Text className="text-lg text-muted-foreground text-center">
          {t(config.subtext)}
        </Text>
      </Animated.View>
    </View>
  );
}
