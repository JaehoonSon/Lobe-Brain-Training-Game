import React from "react";
import { ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { Check, ChevronLeft } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import { Text } from "~/components/ui/text";
import { useOnboarding } from "~/contexts/OnboardingContext";

interface PlanRevealStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function PlanRevealStep({
  onNext,
  onBack,
}: PlanRevealStepProps) {
  const { t } = useTranslation();
  const { currentStep, totalSteps } = useOnboarding();
  const progress = (currentStep / totalSteps) * 100;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center gap-4">
        <Button variant="ghost" className="-ml-2 h-10 w-10" onPress={onBack}>
          <ChevronLeft className="text-foreground" size={24} />
        </Button>
        <View className="flex-1">
          <Progress value={progress} className="h-4 bg-primary/20" />
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow px-6 justify-center gap-10"
        showsVerticalScrollIndicator={false}
      >
        {/* Visual Section */}
        <View className="items-center justify-center relative">
          {/* Glow Effect */}

          <Animated.View entering={ZoomIn.duration(600)}>
            <Image
              source={require("~/assets/brain_growth_chart.png")}
              style={{ width: 280, height: 280 }}
              contentFit="contain"
              cachePolicy="memory"
            />
          </Animated.View>
        </View>

        {/* Content Section */}
        <View className="w-full gap-6">
          <View className="items-center gap-2">
            <Text className="text-xl font-bold text-primary uppercase tracking-widest">
              {t("onboarding.steps.plan_reveal.badge")}
            </Text>
            <Text className="text-5xl font-black text-center text-foreground">
              {t("onboarding.steps.plan_reveal.title")}
            </Text>
            <Text className="text-lg text-center text-muted-foreground px-2 leading-6 mt-1">
              {t("onboarding.steps.plan_reveal.projection")}{" "}
              <Text className="text-primary font-bold">
                {t("onboarding.steps.plan_reveal.projection_highlight")}
              </Text>{" "}
              {t("onboarding.steps.plan_reveal.projection_suffix")}
            </Text>
          </View>

          {/* Value Props */}
          <View className="gap-4 px-4">
            <Row text={t("onboarding.steps.plan_reveal.features.baseline")} />
            <Row text={t("onboarding.steps.plan_reveal.features.schedule")} />
            <Row text={t("onboarding.steps.plan_reveal.features.proven")} />
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="bg-background p-6 pt-2">
        <Button
          className="w-full h-12 native:h-16 px-10 rounded-2xl shadow-lg shadow-primary/20"
          onPress={onNext}
        >
          <Text className="text-xl font-bold text-primary-foreground">
            {t("onboarding.steps.plan_reveal.start")}
          </Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}

function Row({ text }: { text: string }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(300).springify()}
      className="flex-row items-center gap-4"
    >
      <View className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-full">
        <Check size={20} color="#16da7e" strokeWidth={4} />
      </View>
      <Text className="text-xl font-medium text-foreground/90 flex-1">
        {text}
      </Text>
    </Animated.View>
  );
}
