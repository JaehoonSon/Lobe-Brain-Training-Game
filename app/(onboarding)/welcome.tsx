import { router } from "expo-router";
import { View } from "react-native";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { BrainCircuit, Check, Zap, Brain, Target } from "lucide-react-native";
import { CustomStepProps } from "~/app/(onboarding)/index";

export default function WelcomeScreen({ onNext, onBack }: CustomStepProps) {
  const insets = useSafeAreaInsets();

  const handleBegin = () => {
    // Navigate to the main onboarding flow (which is the index of this group)
    onNext();
  };

  const goals = [
    { icon: Target, label: "Sharpen your focus" },
    { icon: Brain, label: "Improve your memory" },
    { icon: Zap, label: "Think faster" },
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
          <View className="bg-primary/10 p-6 rounded-full mb-4">
            <BrainCircuit size={64} className="text-primary" strokeWidth={3} />
          </View>
          <Text className="text-4xl font-extrabold text-foreground text-center leading-[1.1]">
            Welcome to your Personal Plan
          </Text>
          <Text className="text-lg text-muted-foreground text-center px-4">
            We will build a custom plan to help you:
          </Text>
        </Animated.View>

          {/* Goals List */}
        <View className="w-full max-w-xs gap-4 mb-8">
          {goals.map((goal, index) => (
            <Animated.View
              key={index}
              entering={FadeInDown.delay(200 + index * 100).duration(600)}
              className="flex-row items-center gap-4 bg-card p-4 rounded-2xl border-2 border-muted"
            >
              <View className="p-2 rounded-xl bg-muted">
                <goal.icon size={24} className="text-foreground" strokeWidth={2.5} />
              </View>
              <Text className="font-bold text-lg text-foreground">
                {goal.label}
              </Text>
              <View className="ml-auto">
                <Check size={20} className="text-green-500" strokeWidth={2.5} />
              </View>
            </Animated.View>
          ))}
        </View>
      </View>

      <Animated.View
        entering={ZoomIn.delay(600).duration(500).springify()}
        className="w-full"
      >
        <Button
          size="xl"
          className="w-full rounded-2xl h-16"
          onPress={handleBegin}
        >
          <Text className="font-extrabold text-xl tracking-wide uppercase">
            Let&apos;s Begin
          </Text>
        </Button>
      </Animated.View>
    </View>
  );
}
