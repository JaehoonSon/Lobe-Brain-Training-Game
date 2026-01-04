import React, { useEffect } from 'react';
import { View, Image, ImageSourcePropType } from 'react-native';
import { Text } from '~/components/ui/text';

export interface AffirmationStepConfig {
    type: 'affirmation';
    image: ImageSourcePropType;
    headline: string;
    subtext: string;
}

interface AffirmationStepProps {
    config: AffirmationStepConfig;
    onNextDisabled: (disabled: boolean) => void;
}

export function AffirmationStep({ config, onNextDisabled }: AffirmationStepProps) {
    useEffect(() => {
        onNextDisabled(false); // No input needed, always enabled
    }, []);

    return (
        <View className="flex-1 items-center justify-center p-4">
            <View className="w-64 h-64 mb-8 items-center justify-center">
                <Image
                    source={config.image}
                    style={{ width: 256, height: 256, resizeMode: 'contain' }}
                />
            </View>
            <Text className="text-3xl font-extrabold text-center text-foreground mb-4">
                {config.headline}
            </Text>
            <Text className="text-lg text-muted-foreground text-center leading-relaxed">
                {config.subtext}
            </Text>
        </View>
    );
}
