import { View } from "react-native";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { CustomStepProps } from "~/app/(onboarding)/index";
import Svg, { Path } from "react-native-svg";

export default function ThankYouScreen({ onNext, onBack }: CustomStepProps) {
  const insets = useSafeAreaInsets();

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
          <Text className="text-3xl font-bold text-foreground text-center leading-tight">
            That was the last one.{"\n"}Well done!
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

          <Text className="text-xl text-muted-foreground text-center px-4 leading-relaxed">
            We're now determining your skills in{" "}
            <Text className="text-xl font-bold text-primary">Memory</Text>,{" "}
            <Text className="text-xl font-bold text-primary">Attention</Text>, and{" "}
            <Text className="text-xl font-bold text-primary">Problem Solving</Text>{" "}
            based on your performance.
          </Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInUp.delay(400).duration(600)}>
        <Button className="w-full rounded-2xl h-12 native:h-16" onPress={onNext}>
          <Text className="font-bold text-xl text-primary-foreground">Continue</Text>
        </Button>
      </Animated.View>
    </View>
  );
}
