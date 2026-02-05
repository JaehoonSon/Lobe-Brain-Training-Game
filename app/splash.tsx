import { SplashScreen } from "expo-router";
import { useAuth } from "~/contexts/AuthProvider";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import LottieView from "lottie-react-native";
import { Image } from "expo-image";

const SPLASH_BG_COLOR = "#fe7939"; // Primary Theme Orange
const MIN_DISPLAY_TIME = 600; // 600ms delay

const PROFILE_LOAD_FALLBACK_MS = 8000;

export function SplashScreenController() {
  const { isAuthenticated, isLoading, isProfileLoading } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [profileLoadTimedOut, setProfileLoadTimedOut] = useState(false);

  useEffect(() => {
    // Set minimum display time
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, MIN_DISPLAY_TIME);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    // Hide splash when all conditions are met
    const shouldWaitForProfile =
      isAuthenticated && isProfileLoading && !profileLoadTimedOut;
    const readyToHide = !isLoading && !shouldWaitForProfile && minTimeElapsed;

    if (readyToHide) {
      SplashScreen.hideAsync();
      setIsVisible(false);
    }
  }, [
    isAuthenticated,
    isLoading,
    isProfileLoading,
    minTimeElapsed,
    profileLoadTimedOut,
  ]);

  useEffect(() => {
    if (!isAuthenticated || !isProfileLoading) {
      setProfileLoadTimedOut(false);
      return;
    }

    const timer = setTimeout(() => {
      setProfileLoadTimedOut(true);
    }, PROFILE_LOAD_FALLBACK_MS);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isProfileLoading]);

  // Don't render anything once hidden
  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      <Image
        source={require("~/assets/images/brain_logo.png")}
        style={styles.image}
        contentFit="contain"
        cachePolicy="disk"
      />
      {minTimeElapsed && (
        <View style={styles.lottieContainer}>
          <LottieView
            source={require("~/assets/animations/dotloading.lottie.json")}
            autoPlay
            loop
            style={styles.lottie}
          />
        </View>
      )}
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
  lottieContainer: {
    position: "absolute",
    bottom: 50,
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  lottie: {
    width: "100%",
    height: "100%",
  },
});

export default SplashScreenController;
