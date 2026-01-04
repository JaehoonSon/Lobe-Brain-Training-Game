import React from 'react';
import { View, Text } from 'react-native';
import { useOnboarding } from '~/contexts/OnboardingContext';
import { WizardLayout } from '~/components/WizardLayout';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

// --- Step Components (Ideally these go in separate files) ---

const Step1_Welcome = () => (
    <View>
        <Text className="text-foreground">
            Welcome! Let's set up your profile. This will only take a moment.
        </Text>
    </View>
);

const Step2_Name = () => {
    const { data, updateData } = useOnboarding();
    return (
        <View className="gap-4">
            <View>
                <Label nativeID="first-name">First Name</Label>
                <Input
                    placeholder="Jane"
                    value={data.firstName}
                    onChangeText={(t) => updateData('firstName', t)}
                />
            </View>
            <View>
                <Label nativeID="last-name">Last Name</Label>
                <Input
                    placeholder="Doe"
                    value={data.lastName}
                    onChangeText={(t) => updateData('lastName', t)}
                />
            </View>
        </View>
    )
};

const Step3_Interests = () => (
    <View>
        <Text className="text-foreground">Select your interests...</Text>
        {/* Checkboxes would go here */}
    </View>
);

// --- Component Map ---

const STEP_COMPONENTS: Record<number, { component: React.FC; title: string; description?: string }> = {
    1: { component: Step1_Welcome, title: 'Welcome', description: 'Let\'s get started.' },
    2: { component: Step2_Name, title: 'Your Profile', description: 'Tell us about yourself.' },
    3: { component: Step3_Interests, title: 'Interests', description: 'What do you like?' },
    // ... maps up to 32
};

export default function OnboardingOrchestrator() {
    const { currentStep } = useOnboarding();

    const stepConfig = STEP_COMPONENTS[currentStep];

    if (!stepConfig) {
        return (
            <WizardLayout title="Error">
                <Text className="text-destructive">Step {currentStep} not found.</Text>
            </WizardLayout>
        );
    }

    const ActiveComponent = stepConfig.component;

    return (
        <WizardLayout title={stepConfig.title} description={stepConfig.description}>
            <ActiveComponent />
        </WizardLayout>
    );
}
