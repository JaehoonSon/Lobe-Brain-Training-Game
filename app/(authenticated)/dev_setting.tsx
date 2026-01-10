import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { H1, P } from "~/components/ui/typography";
import { Text } from "~/components/ui/text";
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
    const amount = 2;
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

        <Button variant="outline" className="w-full h-12 px-6" onPress={() => router.push("/settings")}>
          <Text className="text-foreground font-bold">Go to Settings</Text>
        </Button>
        <Button variant="outline" className="w-full h-12 px-6" onPress={() => router.push("/(onboarding)")}>
          <Text className="text-foreground font-bold">Go to onboarding</Text>
        </Button>
        <Button variant="outline" className="w-full h-12 px-6" onPress={restartOnboarding}>
          <Text className="text-foreground font-bold">Restart onboarding</Text>
        </Button>
        <Button variant="outline" className="w-full h-12 px-6" onPress={goBackFewSteps}>
          <Text className="text-foreground font-bold">Go back few steps</Text>
        </Button>
        <Button variant="outline" className="w-full h-12 px-6" onPress={showPaywall}>
          <Text className="text-foreground font-bold">Present paywall</Text>
        </Button>
        <Button variant="outline" className="w-full h-12 px-6" onPress={() => router.push("/paywall")}>
          <Text className="text-foreground font-bold">Go to paywall</Text>
        </Button>
        <Button variant="outline" className="w-full h-12 px-6" onPress={() => router.push("/components-showcase")}>
          <Text className="text-foreground font-bold">Component Showcase</Text>
        </Button>
      </SafeAreaView>
    </View>
  );
}
