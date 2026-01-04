import React from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Progress } from '~/components/ui/progress';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { useOnboarding } from '~/contexts/OnboardingContext';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { cn } from '~/lib/utils';

interface WizardLayoutProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    onNext?: () => void; // Optional override for validation before moving next
    showSkip?: boolean;
}

export function WizardLayout({
    title,
    description,
    children,
    onNext,
    showSkip = false,
}: WizardLayoutProps) {
    const { currentStep, totalSteps, nextStep, prevStep } = useOnboarding();

    const progress = (currentStep / totalSteps) * 100;

    const handleNextPress = () => {
        if (onNext) {
            onNext();
        }
        // If onNext is provided, it's responsible for calling nextStep() manually if validation passes.
        // Otherwise, we just call nextStep().
        // Wait... usually validation happens then nextStep is called.
        // Let's assume onNext is strictly for validation/data saving.
        // If onNext is NOT provided, we proceed.
        if (!onNext) {
            nextStep();
        }
    };

    return (
        <SafeAreaView className="bg-background flex-1" edges={['top', 'bottom']}>
            {/* Header / Progress */}
            <View className="px-6 py-4">
                <View className="mb-4 flex-row items-center justify-between">
                    <Text className="text-muted-foreground text-sm font-medium">
                        Step {currentStep} of {totalSteps}
                    </Text>
                    {showSkip && (
                        <Button variant="ghost" size="sm" onPress={nextStep}>
                            <Text className="text-muted-foreground">Skip</Text>
                        </Button>
                    )}
                </View>
                <Progress value={progress} className="h-2" />
            </View>

            {/* Content */}
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, padding: 24 }}
                keyboardShouldPersistTaps="handled"
            >
                <View className="mb-8">
                    <Text className="text-foreground text-3xl font-bold">{title}</Text>
                    {description && (
                        <Text className="text-muted-foreground mt-2 text-lg">
                            {description}
                        </Text>
                    )}
                </View>
                <View className="flex-1">{children}</View>
            </ScrollView>

            {/* Footer / Actions */}
            <View className="border-border bg-background border-t p-6">
                <View className="flex-row gap-4">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onPress={prevStep}
                        disabled={currentStep === 1}
                    >
                        <ChevronLeft className="mr-2 text-foreground" size={18} />
                        <Text>Back</Text>
                    </Button>
                    <Button className="flex-1" onPress={handleNextPress}>
                        <Text>{currentStep === totalSteps ? 'Finish' : 'Next'}</Text>
                        <ChevronRight className="ml-2 text-primary-foreground" size={18} />
                    </Button>
                </View>
            </View>
        </SafeAreaView>
    );
}
