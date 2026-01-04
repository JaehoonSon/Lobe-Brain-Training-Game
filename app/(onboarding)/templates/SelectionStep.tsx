import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '~/components/ui/text';
import { useOnboarding } from '~/contexts/OnboardingContext';
import { Check } from 'lucide-react-native';

export interface SelectionStepConfig {
    type: 'selection';
    dataKey: string;
    options: (string | { label: string; description?: string })[];
    maxSelections?: number;
}

interface SelectionStepProps {
    config: SelectionStepConfig;
    onNextDisabled: (disabled: boolean) => void;
}

export function SelectionStep({ config, onNextDisabled }: SelectionStepProps) {
    const { data, updateData } = useOnboarding();
    const [selected, setSelected] = useState<string[]>((data as any)[config.dataKey] || []);

    const maxSelections = config.maxSelections || config.options.length;

    const toggleOption = (optionValue: string) => {
        let newSelected = [...selected];
        if (newSelected.includes(optionValue)) {
            newSelected = newSelected.filter(i => i !== optionValue);
        } else {
            if (maxSelections === 1) {
                newSelected = [optionValue];
            } else {
                if (newSelected.length >= maxSelections) return;
                newSelected.push(optionValue);
            }
        }
        setSelected(newSelected);
        updateData(config.dataKey, newSelected);
        onNextDisabled(newSelected.length === 0);
    };

    useEffect(() => {
        onNextDisabled(selected.length === 0);
    }, []);

    return (
        <View className="gap-3">
            {config.options.map((option, index) => {
                const label = typeof option === 'string' ? option : option.label;
                const description = typeof option === 'string' ? undefined : option.description;
                const isSelected = selected.includes(label);

                return (
                    <TouchableOpacity
                        key={index}
                        onPress={() => toggleOption(label)}
                        activeOpacity={0.8}
                        className={`flex-row items-center p-5 rounded-2xl border-2 mb-3 ${isSelected ? 'bg-card border-primary' : 'bg-card border-transparent'}`}
                    >
                        <View className={`w-8 h-8 rounded-full border-2 mr-5 items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30 bg-background'}`}>
                            {isSelected && <Check size={20} color="#fff" />}
                        </View>
                        <View className="flex-1">
                            <Text className={`text-xl font-bold ${isSelected ? 'text-foreground' : 'text-foreground'}`}>
                                {label}
                            </Text>
                            {description && (
                                <Text className="text-muted-foreground text-base mt-1">
                                    {description}
                                </Text>
                            )}
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}
