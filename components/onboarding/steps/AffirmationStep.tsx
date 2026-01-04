import React from "react";
import { View, Image, Text } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { H1 } from "~/components/ui/typography";

const BRAIN_IMAGE = require("~/assets/images/brain_muscle.png");

export function AffirmationStep() {
  return (
    <View className="flex-1 items-center justify-center gap-8">
      <Animated.View entering={ZoomIn.duration(700).springify()}>
        <Image
          source={BRAIN_IMAGE}
          style={{ width: 200, height: 200 }}
          resizeMode="contain"
        />
      </Animated.View>
      <Animated.View
        className="gap-4 items-center"
        entering={FadeInDown.delay(300).duration(700).springify()}
      >
        <H1 className="text-center text-3xl">The brain is like a muscle.</H1>
        <Text className="text-center text-muted-foreground text-lg px-4">
          Train it daily. Just a few minutes each day can build a lifelong
          habit.
        </Text>
      </Animated.View>
    </View>
  );
}
