import { router } from "expo-router";
import {
  View,
  useWindowDimensions,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Text } from "~/components/ui/text";
import { P } from "~/components/ui/typography";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GradientText from "~/components/GradientText";
import Animated, { FadeInUp } from "react-native-reanimated";

export default function IndexUnauthenticatedScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-white">
      {/* Gradient Background */}
      <LinearGradient
        colors={["#f3e7e9", "#e3eeff", "#e3eeff"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Smooth gradient fade - compact and solid at bottom */}
      <LinearGradient
        colors={[
          "transparent",
          "rgba(255,255,255,0.15)",
          "rgba(255,255,255,0.4)",
          "rgba(255,255,255,0.75)",
          "rgba(255,255,255,0.95)",
          "#ffffff",
        ]}
        locations={[0, 0.1, 0.2, 0.35, 0.45, 0.6]}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: height * 0.35,
        }}
      />

      {/* Bottom content area - compact like reference */}
      <View
        className="absolute left-0 right-0 bottom-0 px-6"
        style={{ paddingBottom: insets.bottom + 4 }}
      >
        {/* Title section */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(600)}
          className="items-center mb-1"
        >
          <Text className="text-4xl font-semibold text-black">Welcome to</Text>
          <GradientText text="Elysia" fontSize={48} />
          <P className="text-black/60 text-center text-sm mt-1">
            Highlight your natural beauty
          </P>
        </Animated.View>

        {/* CTA Button - dark like reference */}
        <Animated.View
          entering={FadeInUp.delay(400).duration(600)}
          className="mt-4"
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push("/(unauthenticated)/SignUp")}
            className="rounded-full py-4 items-center"
            style={{ backgroundColor: "#D946EF" }}
          >
            <Text className="text-white font-semibold text-lg">
              Get Started
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer links like reference */}
        <Animated.View
          entering={FadeInUp.delay(500).duration(600)}
          className="mt-3 items-center"
        >
          <Text className="text-xs text-black/50 text-center">
            By continuing, you agree to our{" "}
            <Text className="text-xs text-black/70 underline font-medium">
              Privacy Policy
            </Text>{" "}
            and{" "}
            <Text className="text-xs text-black/70 underline font-medium">
              Terms of Service
            </Text>
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}
