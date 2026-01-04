import React from "react";
import { View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import { useOnboarding } from "~/contexts/OnboardingContext";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { Check, ChevronLeft } from "lucide-react-native";

interface PlanRevealStepProps {
    onNext: () => void;
    onBack: () => void;
}

export default function PlanRevealStep({ onNext, onBack }: PlanRevealStepProps) {
    const { currentStep, totalSteps } = useOnboarding();
    const progress = (currentStep / totalSteps) * 100;

    return (
        <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
            {/* Header */}
            <View className="px-6 py-4 flex-row items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="-ml-2"
                    onPress={onBack}
                >
                    <ChevronLeft className="text-foreground" size={24} />
                </Button>
                <View className="flex-1">
                    <Progress value={progress} className="h-4 bg-primary/20" />
                </View>
            </View>

            {/* Main Content */}
            <View className="flex-1 px-6 justify-center gap-10">

                {/* Visual Section */}
                <View className="items-center justify-center relative">
                    {/* Glow Effect */}
                    <View className="absolute w-64 h-64 bg-primary/20 rounded-full blur-3xl" />

                    <Animated.View entering={ZoomIn.duration(600)}>
                        <Image
                            source={require("~/assets/brain_growth_chart.png")}
                            style={{ width: 240, height: 240 }}
                            resizeMode="contain"
                        />
                    </Animated.View>
                </View>

                {/* Content Section */}
                <View className="w-full gap-6">
                    <View className="items-center gap-2">
                        <Text className="text-xl font-bold text-primary uppercase tracking-widest">
                            Personalized For You
                        </Text>
                        <Text className="text-5xl font-black text-center text-foreground leading-tight">
                            Your 30-Day Plan
                        </Text>
                        <Text className="text-lg text-center text-muted-foreground px-2 leading-6 mt-1">
                            Projected <Text className="text-primary font-bold">30-40% LPI increase</Text> in first month.
                        </Text>
                    </View>

                    {/* Value Props */}
                    <View className="gap-4 px-4">
                        <Row text="Tailored to your baseline scores" />
                        <Row text="Effective 3x/week schedule" />
                        <Row text="Scientifically proven growth" />
                    </View>
                </View>
            </View>

            {/* Footer */}
            <View className="bg-background p-6 pt-2">
                <Button
                    size="xl"
                    className="w-full h-[72px] bg-orange-500 active:bg-orange-600 rounded-full shadow-lg shadow-orange-500/20"
                    onPress={onNext}
                >
                    <Text className="text-2xl font-bold text-white">
                        Start Training
                    </Text>
                </Button>
            </View>
        </SafeAreaView>
    );
}

function Row({ text }: { text: string }) {
    return (
        <Animated.View entering={FadeInDown.delay(300).springify()} className="flex-row items-center gap-4">
            <View className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-full">
                <Check size={20} color="#16da7e" strokeWidth={4} />
            </View>
            <Text className="text-xl font-medium text-foreground/90 flex-1">{text}</Text>
        </Animated.View>
    )
}
