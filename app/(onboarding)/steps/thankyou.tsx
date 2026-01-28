import { View } from "react-native";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { CustomStepProps } from "~/app/(onboarding)/index";
import { useTranslation } from "react-i18next";
import Svg, { Path } from "react-native-svg";
import { useEffect, useState } from "react";
import { StoreReview } from "~/lib/StoreReview";

export default function ThankYouScreen({ onNext, onBack }: CustomStepProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [isNextDisabled, setIsNextDisabled] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      StoreReview.requestReview(true);
    }, 2000);

    const enableButtonTimer = setTimeout(() => {
      setIsNextDisabled(false);
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(enableButtonTimer);
    };
  }, []);

  return (
    <View
      className="flex-1 bg-background px-6"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
    >
      <View className="flex-1 justify-center items-center">
        <Animated.View
          entering={FadeInDown.duration(600)}
          className="items-center gap-6 mb-12"
        >
          <Text className="text-3xl font-bold text-foreground text-center">
            {t("onboarding.steps.thank_you.title")}
          </Text>

          {/* Bell Curve */}
          <View className="my-8">
            <Svg width="280" height="200" viewBox="0 0 280 200">
              {/* Bell curve path - Using Purple to match theme */}
              <Path
                d="M 20 180 Q 60 120, 80 80 Q 100 40, 140 20 Q 180 40, 200 80 Q 220 120, 260 180"
                fill="#8b5cf6"
                stroke="#1F2937"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>

          <Text className="text-xl text-muted-foreground text-center px-4">
            {t("onboarding.steps.thank_you.subtitle_prefix")}{" "}
            <Text className="text-xl font-bold text-primary">
              {t("common.categories.memory")}
            </Text>
            ,{" "}
            <Text className="text-xl font-bold text-primary">
              {t("games_tab.categories.attention")}
            </Text>
            , and{" "}
            <Text className="text-xl font-bold text-primary">
              {t("games_tab.categories.problem_solving")}
            </Text>{" "}
            {t("onboarding.steps.thank_you.subtitle_suffix")}
          </Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInUp.delay(400).duration(600)}>
        <Button
          className="w-full rounded-2xl h-12 native:h-16"
          onPress={onNext}
          disabled={isNextDisabled}
        >
          <Text className="font-bold text-xl text-primary-foreground">
            {t("common.continue")}
          </Text>
        </Button>
      </Animated.View>
    </View>
  );
}
