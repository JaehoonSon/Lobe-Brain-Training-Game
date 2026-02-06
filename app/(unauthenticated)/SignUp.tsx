import { useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { showErrorToast } from "~/components/ui/toast";
import { appMetadata } from "~/config";
import { useAuth } from "~/contexts/AuthProvider";

export default function SignUp() {
  const { t } = useTranslation();
  // eslint-disable-next-line unused-imports/no-unused-vars
  const { signInApple, signInGoogle } = useAuth();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (isLoading) return; // Prevent double-click
    setIsLoading(true);
    try {
      await signInApple();
      // Stack.Protected guards will automatically route to onboarding
      // since isAuthenticated=true and isComplete=false for new users
    } catch (err) {
      console.log("sign in error", err);
      showErrorToast(t("common.error_generic"));
      setIsLoading(false); // Only reset on error, not on success (navigation happens)
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
          <Text className="text-5xl font-extrabold text-center text-foreground">
            {t("unauth.signup.title")}
          </Text>
          <Text className="text-xl text-muted-foreground text-center">
            {t("unauth.signup.subtitle")}
          </Text>
        </Animated.View>
      </View>

      {/* Bottom section with sign up options */}
      <View className="px-6" style={{ paddingBottom: insets.bottom + 16 }}>
        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <Button
            className="w-full h-12 native:h-16 px-10 rounded-2xl flex-row gap-3 mb-6"
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <AntDesign name="apple" size={24} color="white" />
                <Text className="font-bold text-xl text-primary-foreground">
                  {t("unauth.signup.apple_button")}
                </Text>
              </>
            )}
          </Button>
        </Animated.View>

        {/* Terms */}
        <Animated.View entering={FadeInUp.delay(400).duration(600)}>
          <Text className="text-sm text-muted-foreground text-center px-8">
            {t("unauth.signup.agreement_intro")}
            <Link href={appMetadata.privacyPolicyUrl}>
              <Text className="text-sm font-bold underline text-foreground">
                {t("unauth.signup.privacy_policy")}
              </Text>
            </Link>{" "}
            {t("unauth.signup.agreement_and")}
            <Link href={appMetadata.endUserLicenseAgreementUrl}>
              <Text className="text-sm font-bold underline text-foreground">
                {t("unauth.signup.terms_of_service")}
              </Text>
            </Link>
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}
