import React, { useState, useEffect } from "react";
import { View, TouchableOpacity } from "react-native";
import { Text } from "~/components/ui/text";
import { useOnboarding } from "~/contexts/OnboardingContext";
import { Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

export interface SelectionStepConfig {
  type: "selection";
  dataKey: string;
  options: (
    | string
    | { label: string; description?: string; icon?: React.ReactNode }
  )[];
  maxSelections?: number;
  optional?: boolean; // If true, user can proceed without selecting anything
}

interface SelectionStepProps {
  config: SelectionStepConfig;
  onNextDisabled: (disabled: boolean) => void;
}

export function SelectionStep({ config, onNextDisabled }: SelectionStepProps) {
  const { t } = useTranslation();
  const { data, updateData } = useOnboarding();
  const [selected, setSelected] = useState<string[]>(
    (data as any)[config.dataKey] || []
  );

  const maxSelections = config.maxSelections || config.options.length;

  const toggleOption = (optionValue: string) => {
    Haptics.selectionAsync();
    let newSelected = [...selected];
    if (newSelected.includes(optionValue)) {
      newSelected = newSelected.filter((i) => i !== optionValue);
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
    // If optional, never disable next button; otherwise require at least one selection
    onNextDisabled(config.optional ? false : newSelected.length === 0);
  };

  useEffect(() => {
    // If optional, never disable next button; otherwise require at least one selection
    onNextDisabled(config.optional ? false : selected.length === 0);
  }, []);

  return (
    <View className="gap-3">
      {config.options.map((option, index) => {
        const optionLabelKey = typeof option === "string" ? option : option.label;
        const optionDescriptionKey =
          typeof option === "string" ? undefined : option.description;
        const icon = typeof option === "string" ? undefined : option.icon;

        const label = t(optionLabelKey);
        const description = optionDescriptionKey ? t(optionDescriptionKey) : undefined;

        // Use the KEY as the value to store in the database/onboarding state
        // to maintain consistency regardless of current UI language
        const isSelected = selected.includes(optionLabelKey);

        return (
          <Animated.View
            key={index}
            entering={FadeInDown.delay(index * 100).duration(400)}
          >
            <TouchableOpacity
              onPress={() => toggleOption(optionLabelKey)}
              activeOpacity={0.8}
              className={`flex-row items-center p-5 rounded-2xl border-2 mb-3 ${isSelected
                ? "bg-card border-primary"
                : "bg-card border-transparent"
                }`}
            >
              {icon ? (
                <View className="mr-5 w-12 h-12 items-center justify-center bg-secondary/30 rounded-full">
                  {icon}
                </View>
              ) : (
                <View
                  className={`w-8 h-8 rounded-full border-2 mr-5 items-center justify-center ${isSelected
                    ? "bg-primary border-primary"
                    : "border-muted-foreground/30 bg-background"
                    }`}
                >
                  {isSelected && <Check size={20} color="#fff" />}
                </View>
              )}

              <View className="flex-1">
                <Text
                  className={`text-xl font-bold ${isSelected ? "text-foreground" : "text-foreground"
                    }`}
                >
                  {label}
                </Text>
                {description && (
                  <Text className="text-muted-foreground text-base mt-1">
                    {description}
                  </Text>
                )}
              </View>

              {/* Show checkmark on the right if icon mode is used, or just rely on border */}
              {icon && isSelected && (
                <View className="ml-2 bg-primary rounded-full p-1">
                  <Check size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
}
