import React, { useState } from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { Text } from '~/components/ui/text';
import { useOnboarding } from '~/contexts/OnboardingContext';
import { WizardLayout } from '~/components/WizardLayout';
import { Check } from 'lucide-react-native';

// --- Step 1: Interests ---

const INTERESTS = [
    "I want to keep my mind active and challenged",
    "I like pushing myself to improve",
    "I want to train my memory and attention",
    "I'm curious about how my brain works",
    "I'd like to manage stress and build better habits"
];

const Step1_Interests = ({ onNextDisabled }: { onNextDisabled: (disabled: boolean) => void }) => {
    const { data, updateData } = useOnboarding();
    const [selected, setSelected] = useState<string[]>(data.interests || []);

    const toggleInterest = (interest: string) => {
        let newSelected = [...selected];
        if (newSelected.includes(interest)) {
            newSelected = newSelected.filter(i => i !== interest);
        } else {
            if (newSelected.length >= 3) return;
            newSelected.push(interest);
        }
        setSelected(newSelected);
        updateData('interests', newSelected);
        onNextDisabled(newSelected.length === 0);
    };

    React.useEffect(() => {
        onNextDisabled(selected.length === 0);
    }, []);

    return (
        <View className="gap-3">
            {INTERESTS.map((interest, index) => {
                const isSelected = selected.includes(interest);
                return (
                    <TouchableOpacity
                        key={index}
                        onPress={() => toggleInterest(interest)}
                        activeOpacity={0.8}
                        className={`flex-row items-center p-4 rounded-2xl border-2 ${isSelected ? 'bg-card border-primary' : 'bg-card border-transparent'}`}
                    >
                        <View className={`w-8 h-8 rounded-full border-2 mr-4 items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30 bg-background'}`}>
                            {isSelected && <Check size={20} color="#fff" />}
                        </View>
                        <Text className={`text-lg font-semibold flex-1 ${isSelected ? 'text-foreground' : 'text-foreground'}`}>
                            {interest}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

// --- Step 2: Affirmation ---

const Step2_Affirmation = ({ onNextDisabled }: { onNextDisabled: (disabled: boolean) => void }) => {
    React.useEffect(() => {
        onNextDisabled(false);
    }, []);

    return (
        <View className="flex-1 items-center justify-center p-4">
            <View className="w-64 h-64 mb-8 items-center justify-center">
                <Image
                    source={require('~/assets/brain_lifting_weights.png')}
                    style={{ width: 256, height: 256, resizeMode: 'contain' }}
                />
            </View>
            <Text className="text-3xl font-extrabold text-center text-foreground mb-4">
                The brain is like a muscle.
            </Text>
            <Text className="text-lg text-muted-foreground text-center leading-relaxed">
                Train it daily. Just a few minutes each day can build a lifelong habit.
            </Text>
        </View>
    );
};

// --- Component Map ---

const STEP_COMPONENTS: Record<number, { component: React.FC<any>; title: string; description?: string }> = {
    1: { component: Step1_Interests, title: "Let's start with your interests", description: "Select up to 3" },
    2: { component: Step2_Affirmation, title: "", description: "" },
};

export default function OnboardingOrchestrator() {
    const { currentStep, nextStep } = useOnboarding();
    const [isNextDisabled, setIsNextDisabled] = useState(true);

    const stepConfig = STEP_COMPONENTS[currentStep];

    if (!stepConfig) {
        return (
            <WizardLayout title="Error" nextDisabled>
                <Text className="text-destructive text-center text-xl">
                    Step {currentStep} not found.
                </Text>
            </WizardLayout>
        );
    }

    const ActiveComponent = stepConfig.component;

    const handleNext = () => {
        nextStep();
        setIsNextDisabled(true);
    };

    return (
        <WizardLayout
            title={stepConfig.title}
            description={stepConfig.description}
            onNext={handleNext}
            nextDisabled={isNextDisabled}
        >
            <ActiveComponent onNextDisabled={setIsNextDisabled} />
        </WizardLayout>
    );
}
