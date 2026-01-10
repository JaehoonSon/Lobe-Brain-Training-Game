import { Link, router } from "expo-router";
import { View } from "react-native";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { appMetadata } from "~/config";
import { AntDesign } from "@expo/vector-icons";
import { showErrorToast } from "~/components/ui/toast";
import { useAuth } from "~/contexts/AuthProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

export default function SignUp() {
  const { signInApple } = useAuth();
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    try {
      await signInApple();
      router.replace("/(onboarding)");
    } catch (err) {
      console.log("sign in error", err);
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
          className="items-center gap-4"
        >
          <Text className="text-5xl font-extrabold tracking-tight text-center text-foreground leading-[1.1]">
            Let's Start
          </Text>
          <Text className="text-xl text-muted-foreground text-center">
            Create your account to begin
          </Text>
        </Animated.View>
      </View>

      {/* Bottom section with sign up options */}
      <View className="px-6" style={{ paddingBottom: insets.bottom + 16 }}>
        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <Button
            className="w-full h-12 native:h-16 px-10 rounded-2xl flex-row gap-3 mb-6"
            onPress={handleLogin}
          >
            <AntDesign name="apple" size={24} color="white" />
            <Text className="font-bold text-xl text-primary-foreground">
              Continue with Apple
            </Text>
          </Button>

          <Button
            variant="secondary"
            className="w-full h-12 native:h-16 px-10 rounded-2xl flex-row gap-3 mb-6"
            onPress={() => {
              // signInGoogle()
              showErrorToast("Google Sign In not configured yet");
            }}
          >
            <AntDesign name="google" size={24} color="white" />
            <Text className="font-bold text-xl text-secondary-foreground">
              Continue with Google
            </Text>
          </Button>
        </Animated.View>

        {/* Terms */}
        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <Text className="text-sm text-muted-foreground text-center leading-relaxed px-8">
            By continuing, you agree to our{" "}
            <Link href={appMetadata.privacyPolicyUrl}>
              <Text className="text-sm font-bold underline text-foreground">
                Privacy Policy
              </Text>
            </Link>{" "}
            and{" "}
            <Link href={appMetadata.endUserLicenseAgreementUrl}>
              <Text className="text-sm font-bold underline text-foreground">
                Terms of Service
              </Text>
            </Link>
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}
