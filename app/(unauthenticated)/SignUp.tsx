import { Link, router } from "expo-router";
import { View, TouchableOpacity } from "react-native";
import { Text } from "~/components/ui/text";
import { appMetadata } from "~/config";
import { AntDesign } from "@expo/vector-icons";
import { showErrorToast } from "~/components/ui/toast";
import { useAuth } from "~/contexts/AuthProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GradientText from "~/components/GradientText";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

export default function SignUp() {
  const { signInApple } = useAuth();
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    try {
      await signInApple();
      // Auth state change in _layout will handle navigation to (authenticated)
    } catch (err) {
      showErrorToast("Error Signing in");
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Top section with branding */}
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ paddingTop: insets.top }}
      >
        <Animated.View
          entering={FadeInDown.duration(600)}
          className="items-center"
        >
          <GradientText text="Let's Start" fontSize={48} />
          <Text className="text-black/60 text-center text-base mt-2">
            Create your account to begin
          </Text>
        </Animated.View>
      </View>

      {/* Bottom section with sign up options */}
      <View className="px-6" style={{ paddingBottom: insets.bottom + 16 }}>
        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleLogin}
            className="rounded-full py-4 px-6 flex-row items-center justify-center mb-4"
            style={{
              backgroundColor: "#D946EF",
              shadowColor: "#D946EF",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <AntDesign name="apple" size={22} color="white" />
            <Text className="text-white font-semibold text-lg ml-3">
              Continue with Apple
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Terms */}
        <Animated.View
          entering={FadeInUp.delay(400).duration(600)}
          className="mt-4"
        >
          <Text className="text-xs text-black/50 text-center leading-relaxed">
            By continuing, you agree to our{" "}
            <Link href={appMetadata.privacyPolicyUrl}>
              <Text className="text-xs text-black/70 underline font-medium">
                Privacy Policy
              </Text>
            </Link>{" "}
            and{" "}
            <Link href={appMetadata.endUserLicenseAgreementUrl}>
              <Text className="text-xs text-black/70 underline font-medium">
                Terms of Service
              </Text>
            </Link>
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}
