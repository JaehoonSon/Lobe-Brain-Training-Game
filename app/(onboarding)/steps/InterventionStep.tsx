import { View } from "react-native";
import { ArrowRight } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CustomStepProps } from "~/app/(onboarding)/index";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";

export interface InterventionStepProps extends CustomStepProps {
  title: string;
  description: string;
  buttonText?: string;
  variant?: "intro" | "outro";
}

export default function InterventionStep({
  onNext,
  // eslint-disable-next-line unused-imports/no-unused-vars
  onBack,
  title,
  description,
  buttonText,
  variant = "intro",
}: InterventionStepProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const finalButtonText = buttonText || t("common.continue");

  return (
    <View
      className="flex-1 bg-background px-6"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
    >
      <View className="flex-1 justify-center items-center">
        <Animated.View
          entering={FadeInDown.duration(600)}
          className="items-center gap-6"
        >
          {variant === "outro" && (
            <Animated.Text
              entering={ZoomIn.springify().damping(12)}
              className="text-7xl"
            >
              🎉
            </Animated.Text>
          )}

          <Text className="text-5xl font-extrabold text-foreground text-center">
            {title}
          </Text>

          <Text className="text-2xl text-muted-foreground text-center px-4">
            {description}
          </Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInUp.delay(300).duration(600)}>
        <Button
          className="w-full rounded-2xl h-12 native:h-16 px-10 flex-row gap-2"
          onPress={onNext}
        >
          <Text className="font-bold text-xl text-primary-foreground">
            {finalButtonText}
          </Text>
          <ArrowRight size={24} color="white" />
        </Button>
      </Animated.View>
    </View>
  );
}
