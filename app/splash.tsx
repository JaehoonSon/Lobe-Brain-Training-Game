import { SplashScreen } from "expo-router";
import { useAuth } from "~/contexts/AuthProvider";
import { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";

const SPLASH_BG_COLOR = "#faeeda";
const FADE_DURATION = 600; // ms
const MIN_DISPLAY_TIME = 2000; // reduced from 5000ms

export function SplashScreenController() {
  const { isLoading } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const opacity = useSharedValue(1);

  useEffect(() => {
    // Set minimum display time
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, MIN_DISPLAY_TIME);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Start fade-out when all conditions are met
    if (!isLoading && minTimeElapsed) {
      // Hide native splash first (our overlay takes over)
      SplashScreen.hideAsync();

      // Fade out the overlay
      opacity.value = withTiming(
        0,
        {
          duration: FADE_DURATION,
          easing: Easing.out(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            runOnJS(setIsVisible)(false);
          }
        }
      );
    }
  }, [isLoading, minTimeElapsed]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Don't render anything once fully faded
  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      pointerEvents="none"
    >
      <Image
        source={require("~/assets/images/splash.png")}
        style={styles.image}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SPLASH_BG_COLOR,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  image: {
    width: "80%",
    height: "80%",
  },
});

export default SplashScreenController;
