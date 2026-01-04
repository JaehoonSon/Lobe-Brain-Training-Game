import React from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Progress } from '~/components/ui/progress';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { useOnboarding } from '~/contexts/OnboardingContext';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { cn } from '~/lib/utils';

interface WizardLayoutProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    onNext?: () => void;
    onPrev?: () => void;
    showSkip?: boolean;
    nextDisabled?: boolean;
    nextLabel?: string;
}

export function WizardLayout({
    title,
    description,
    children,
    onNext,
    onPrev,
    showSkip = false,
    nextDisabled = false,
    nextLabel = "Continue",
}: WizardLayoutProps) {
    const { currentStep, totalSteps, nextStep, prevStep } = useOnboarding();
    const router = useRouter();

    const progress = (currentStep / totalSteps) * 100;

    const handleNextPress = () => {
        if (onNext) {
            onNext();
        } else {
            nextStep();
        }
    };

    const handleBack = () => {
        if (onPrev) {
            onPrev();
            return;
        }

        if (currentStep > 1) {
            prevStep();
        } else {
            router.back();
        }
    };

    return (
        <SafeAreaView className="bg-background flex-1" edges={['top', 'bottom']}>
            {/* Header / Progress */}
            <View className="px-6 py-4 flex-row items-center gap-4">
                <Button variant="ghost" size="icon" className="-ml-2" onPress={handleBack}>
                    <ChevronLeft className="text-foreground" size={24} />
                </Button>

                <View className="flex-1">
                    <Progress value={progress} className="h-4 bg-primary/20" />
                </View>

                {showSkip && (
                    <Button variant="ghost" size="sm" onPress={nextStep}>
                        <Text className="text-muted-foreground">Skip</Text>
                    </Button>
                )}
            </View>

            {/* Content */}
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 24 }}
                keyboardShouldPersistTaps="handled"
            >
                <View className="mb-8 mt-4">
                    <Text className="text-foreground text-3xl font-extrabold text-center">{title}</Text>
                    {description && (
                        <Text className="text-muted-foreground mt-2 text-lg text-center">
                            {description}
                        </Text>
                    )}
                </View>
                <View className="flex-1">{children}</View>
            </ScrollView>

            {/* Footer / Actions */}
            <View className="bg-background p-6 pt-2">
                <Button
                    size="xl"
                    className="w-full rounded-2xl shadow-xl"
                    onPress={handleNextPress}
                    disabled={nextDisabled}
                >
                    <Text className="text-xl font-bold">{nextLabel}</Text>
                </Button>
            </View>
        </SafeAreaView>
    );
}
