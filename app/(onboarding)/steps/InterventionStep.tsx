import { View } from "react-native";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { CustomStepProps } from "~/app/(onboarding)/index";
import { ArrowRight } from "lucide-react-native";

export interface InterventionStepProps extends CustomStepProps {
  title: string;
  description: string;
  buttonText?: string;
  variant?: "intro" | "outro";
}

export default function InterventionStep({
  onNext,
  onBack,
  title,
  description,
  buttonText = "Continue",
  variant = "intro",
}: InterventionStepProps) {
  const insets = useSafeAreaInsets();

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
            <View className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 items-center justify-center mb-4">
              <Text className="text-3xl">🎉</Text>
            </View>
          )}

          <Text className="text-4xl font-extrabold text-foreground text-center">
            {title}
          </Text>

          <Text className="text-xl text-muted-foreground text-center px-4">
            {description}
          </Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInUp.delay(300).duration(600)}>
        <Button
          className="w-full rounded-2xl h-12 native:h-16 px-10 flex-row gap-2"
          onPress={onNext}
        >
          <Text className="font-bold text-xl text-primary-foreground">{buttonText}</Text>
          <ArrowRight size={24} color="white" />
        </Button>
      </Animated.View>
    </View>
  );
}
