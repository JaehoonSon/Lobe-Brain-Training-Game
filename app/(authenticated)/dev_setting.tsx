import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { H1, P } from "~/components/ui/typography";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/contexts/AuthProvider";
import { router } from "expo-router";
import { useOnboarding } from "~/contexts/OnboardingContext";
import { useRevenueCat } from "~/contexts/RevenueCatProvider";
import { useNotifications } from "~/contexts/NotificationProvider";
import { useTranslation } from "react-i18next";

export default function IndexAuthenticatedScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { resetOnboarding, prevStep } = useOnboarding();
  const { isPro, presentPaywall } = useRevenueCat();
  const { requestPermission, expoPushToken } = useNotifications();

  const restartOnboarding = async () => {
    await resetOnboarding();
    router.push("/(onboarding)");
  };

  const showPaywall = async () => {
    await presentPaywall();
  };

  const goBackFewSteps = () => {
    const amount = 2;
    for (let i = 0; i < amount; i++) {
      prevStep();
    }

    router.push("/(onboarding)");
  };

  return (
    <View className="flex-1 bg-background p-4 items-center justify-center">
      <SafeAreaView className="flex-1 items-center justify-center gap-6">
        <H1 className="text-center">{t("dev_setting.title")}</H1>
        <P className="text-center text-muted-foreground">
          {t("dev_setting.authenticated_as", { email: user?.email })}
        </P>

        <Button
          variant="outline"
          className="w-full h-12 px-6"
          onPress={() => router.push("/settings")}
        >
          <Text className="text-foreground font-bold">
            {t("dev_setting.buttons.settings")}
          </Text>
        </Button>
        <Button
          variant="outline"
          className="w-full h-12 px-6"
          onPress={() => router.push("/(onboarding)")}
        >
          <Text className="text-foreground font-bold">
            {t("dev_setting.buttons.onboarding")}
          </Text>
        </Button>
        <Button
          variant="outline"
          className="w-full h-12 px-6"
          onPress={restartOnboarding}
        >
          <Text className="text-foreground font-bold">
            {t("dev_setting.buttons.restart_onboarding")}
          </Text>
        </Button>
        <Button
          variant="outline"
          className="w-full h-12 px-6"
          onPress={goBackFewSteps}
        >
          <Text className="text-foreground font-bold">
            {t("dev_setting.buttons.go_back_steps")}
          </Text>
        </Button>
        <Button
          variant="outline"
          className="w-full h-12 px-6"
          onPress={showPaywall}
        >
          <Text className="text-foreground font-bold">
            {t("dev_setting.buttons.show_paywall")}
          </Text>
        </Button>
        <Button
          variant="outline"
          className="w-full h-12 px-6"
          onPress={() => router.push("/paywall")}
        >
          <Text className="text-foreground font-bold">
            {t("dev_setting.buttons.go_paywall")}
          </Text>
        </Button>
        <Button
          variant="outline"
          className="w-full h-12 px-6"
          onPress={() => router.push("/components-showcase")}
        >
          <Text className="text-foreground font-bold">
            {t("dev_setting.buttons.showcase")}
          </Text>
        </Button>
        <Button
          variant="outline"
          className="w-full h-12 px-6"
          onPress={requestPermission}
        >
          <Text className="text-foreground font-bold">
            Test Push Notification
          </Text>
        </Button>
        {expoPushToken && (
          <P className="text-center text-xs text-muted-foreground" selectable>
            Token: {expoPushToken}
          </P>
        )}
      </SafeAreaView>
    </View>
  );
}
