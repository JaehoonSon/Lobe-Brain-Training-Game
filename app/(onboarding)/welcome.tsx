import { View } from "react-native";
import { Image } from "expo-image";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { Zap, Brain, Target, Check } from "lucide-react-native";
import { CustomStepProps } from "~/app/(onboarding)/index";
import { useTranslation } from "react-i18next";

export default function WelcomeScreen({ onNext }: CustomStepProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const handleBegin = () => {
    // Navigate to the main onboarding flow (which is the index of this group)
    onNext();
  };

  const goals = [
    { icon: Target, label: t("onboarding.steps.welcome.goals.focus") },
    { icon: Brain, label: t("onboarding.steps.welcome.goals.memory") },
    { icon: Zap, label: t("onboarding.steps.welcome.goals.speed") },
  ];

  return (
    <View
      className="flex-1 bg-background px-6"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
    >
      <View className="flex-1 justify-center items-center">
        <Animated.View
          entering={FadeInDown.duration(600)}
          className="items-center gap-4 mb-8"
        >
          <Image
            source={require("~/assets/images/brain_logo_transparent.png")}
            style={{ width: 120, height: 120 }}
            contentFit="contain"
            cachePolicy="disk"
          />
          <Text className="text-4xl font-extrabold text-foreground text-center leading-[1.1]">
            {t("onboarding.steps.welcome.title")}
          </Text>
          <Text className="text-lg text-muted-foreground text-center px-4">
            {t("onboarding.steps.welcome.subtitle")}
          </Text>
        </Animated.View>

        {/* Goals List */}
        <View className="w-full max-w-xs gap-4 mb-8">
          {goals.map((goal, index) => (
            <Animated.View
              key={index}
              entering={FadeInDown.delay(200 + index * 100).duration(600)}
            >
              <Card className="flex-row items-center gap-4 p-4">
                <View className="p-2 rounded-xl bg-muted">
                  <goal.icon
                    size={24}
                    className="text-foreground"
                    strokeWidth={2.5}
                  />
                </View>
                <Text className="font-bold text-lg text-foreground">
                  {goal.label}
                </Text>
                <View className="ml-auto">
                  <Check
                    size={20}
                    className="text-green-500"
                    strokeWidth={2.5}
                  />
                </View>
              </Card>
            </Animated.View>
          ))}
        </View>
      </View>

      <Animated.View
        entering={ZoomIn.delay(600).duration(500).springify()}
        className="w-full"
      >
        <Button
          className="w-full rounded-2xl h-12 native:h-16 px-10"
          onPress={handleBegin}
        >
          <Text className="font-extrabold text-xl tracking-wide uppercase text-primary-foreground">
            {t("onboarding.steps.welcome.begin")}
          </Text>
        </Button>
      </Animated.View>
    </View>
  );
}
