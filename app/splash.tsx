import { SplashScreen } from "expo-router";
import { useAuth } from "~/contexts/AuthProvider";
import { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";

const SPLASH_BG_COLOR = "#fe7939"; // Primary Theme Orange
const MIN_DISPLAY_TIME = 2000; // reduced from 5000ms

export function SplashScreenController() {
  const { isLoading } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Set minimum display time
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, MIN_DISPLAY_TIME);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Hide splash when all conditions are met
    if (!isLoading && minTimeElapsed) {
      SplashScreen.hideAsync();
      setIsVisible(false);
    }
  }, [isLoading, minTimeElapsed]);

  // Don't render anything once hidden
  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      <Image
        source={require("~/assets/images/brain_logo.png")}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
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
