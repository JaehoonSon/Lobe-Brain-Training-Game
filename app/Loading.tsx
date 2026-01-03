import React, { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export default function LoadingScreen() {
  // track whether we’ve waited 2s
  const [showImage, setShowImage] = useState(false);

  // shared value for pulse scale
  const scale = useSharedValue(1);

  // start 2s timer on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowImage(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // once it’s time, kick off the infinite pulse
  useEffect(() => {
    if (showImage) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 600 }),
          withTiming(1.0, { duration: 600 })
        ),
        -1,
        true
      );
    }
  }, [showImage, scale]);

  // map the shared value to a style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    // Always render the background
    <View className="flex-1 bg-card">
      {showImage && (
        // only after 2s do we center & show the pulsing image
        <View className="flex-1 justify-center items-center gap-5 p-6">
          <Animated.Image
            source={require("~/assets/images/splash.png")}
            className="w-[90%]"
            style={animatedStyle}
            resizeMode="contain"
          />
        </View>
      )}
    </View>
  );
}
