import React from "react";
import { View, Image, Text, ImageSourcePropType } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { H1 } from "~/components/ui/typography";

interface InterstitialStepProps {
  imageSource: ImageSourcePropType;
  title: string;
  description: string;
}

export function InterstitialStep({
  imageSource,
  title,
  description,
}: InterstitialStepProps) {
  return (
    <View className="flex-1 items-center justify-center gap-8">
      <Animated.View entering={ZoomIn.duration(700).springify()}>
        <Image
          source={imageSource}
          style={{ width: 220, height: 220 }}
          resizeMode="contain"
        />
      </Animated.View>
      <Animated.View
        className="gap-4 items-center"
        entering={FadeInDown.delay(300).duration(700).springify()}
      >
        <H1 className="text-center text-3xl">{title}</H1>
        <Text className="text-center text-muted-foreground text-lg px-6 leading-relaxed">
          {description}
        </Text>
      </Animated.View>
    </View>
  );
}
