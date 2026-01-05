import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { H1, P } from "~/components/ui/typography";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/contexts/AuthProvider";
import { router } from "expo-router";
import { useOnboarding } from "~/contexts/OnboardingContext";
import { useRevenueCat } from "~/contexts/RevenueCatProvider";

export default function IndexAuthenticatedScreen() {
  const { user } = useAuth();
  const { resetOnboarding, prevStep } = useOnboarding();
  const { isPro, presentPaywall } = useRevenueCat();

  const restartOnboarding = async () => {
    await resetOnboarding();
    router.push("/(onboarding)");
  };

  const showPaywall = async () => {
    await presentPaywall();
  };

  const goBackFewSteps = () => {
    const amount = 9;
    for (let i = 0; i < amount; i++) {
      prevStep();
    }

    router.push("/(onboarding)");
  };

  return (
    <View className="flex-1 bg-background p-4 items-center justify-center">
      <SafeAreaView className="flex-1 items-center justify-center gap-6">
        <H1 className="text-center">Welcome!</H1>
        <P className="text-center text-muted-foreground">
          You are authenticated as {user?.email}
        </P>

        <Button variant="outline" onPress={() => router.push("/settings")}>
          <P>Go to Settings</P>
        </Button>
        <Button variant="outline" onPress={() => router.push("/(onboarding)")}>
          <P>Go to onboarding</P>
        </Button>
        <Button variant="outline" onPress={restartOnboarding}>
          <P>Restart onboarding</P>
        </Button>
        <Button variant="outline" onPress={goBackFewSteps}>
          <P>Go back few steps</P>
        </Button>
        <Button variant="outline" onPress={showPaywall}>
          <P>Present paywall</P>
        </Button>
        <Button variant="outline" onPress={() => router.push("/paywall")}>
          <P>Go to paywall</P>
        </Button>
      </SafeAreaView>
    </View>
  );
}
