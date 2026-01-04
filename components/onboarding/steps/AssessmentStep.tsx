import React from "react";
import { View, Text, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Checkbox } from "~/components/ui/checkbox";
import { H1 } from "~/components/ui/typography";
import { useOnboarding } from "~/contexts/OnboardingContext";
import { cn } from "~/lib/utils";

export interface AssessmentOption {
  id: string;
  label: string;
  description?: string;
}

interface AssessmentStepProps {
  title: string;
  subtitle?: string;
  options: AssessmentOption[];
  dataKey: string;
  maxSelections?: number;
}

export function AssessmentStep({
  title,
  subtitle,
  options,
  dataKey,
  maxSelections = 5,
}: AssessmentStepProps) {
  const { data, updateData } = useOnboarding();
  const selectedValues: string[] = data[dataKey] || [];

  const toggleOption = (id: string) => {
    if (selectedValues.includes(id)) {
      updateData(
        dataKey,
        selectedValues.filter((v) => v !== id)
      );
    } else {
      if (selectedValues.length >= maxSelections) return;
      updateData(dataKey, [...selectedValues, id]);
    }
  };

  return (
    <View className="gap-6">
      <Animated.View entering={FadeInDown.duration(700).springify()}>
        <H1 className="text-center">{title}</H1>
        {subtitle && (
          <Text className="text-center text-muted-foreground mt-2">
            {subtitle}
          </Text>
        )}
      </Animated.View>
      <View className="gap-3">
        {options.map((option, index) => {
          const isSelected = selectedValues.includes(option.id);
          return (
            <Animated.View
              key={option.id}
              entering={FadeInDown.delay(index * 100)
                .duration(700)
                .springify()}
            >
              <Pressable
                onPress={() => toggleOption(option.id)}
                className={cn(
                  "flex-row items-center p-4 rounded-xl border bg-card",
                  isSelected ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleOption(option.id)}
                />
                <View className="ml-3 flex-1">
                  <Text className="font-bold text-card-foreground text-base">
                    {option.label}
                  </Text>
                  {option.description && (
                    <Text className="text-muted-foreground text-sm mt-0.5">
                      {option.description}
                    </Text>
                  )}
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}
