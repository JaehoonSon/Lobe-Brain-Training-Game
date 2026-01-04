import React from "react";
import { View, Text, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Checkbox } from "~/components/ui/checkbox";
import { H1 } from "~/components/ui/typography";
import { useOnboarding } from "~/contexts/OnboardingContext";
import { cn } from "~/lib/utils";

const INTEREST_OPTIONS = [
  "I want to keep my mind active and challenged",
  "I like pushing myself to improve",
  "I want to train my memory and attention",
  "I'm curious about how my brain works",
  "I'd like to manage stress and build better habits",
];

export function InterestsStep() {
  const { data, updateData } = useOnboarding();
  const selectedInterests: string[] = data.interests || [];

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      updateData(
        "interests",
        selectedInterests.filter((i) => i !== interest)
      );
    } else {
      if (selectedInterests.length >= 3) return;
      updateData("interests", [...selectedInterests, interest]);
    }
  };

  return (
    <View className="gap-6">
      <Animated.View entering={FadeInDown.duration(700).springify()}>
        <H1 className="text-center">Let's start with your interests</H1>
        <Text className="text-center text-muted-foreground mt-2">
          Select up to 3
        </Text>
      </Animated.View>
      <View className="gap-3">
        {INTEREST_OPTIONS.map((option, index) => {
          const isSelected = selectedInterests.includes(option);
          return (
            <Animated.View
              key={option}
              entering={FadeInDown.delay(index * 100)
                .duration(700)
                .springify()}
            >
              <Pressable
                onPress={() => toggleInterest(option)}
                className={cn(
                  "flex-row items-center p-4 rounded-xl border bg-card",
                  isSelected ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleInterest(option)}
                />
                <Text className="ml-3 font-medium text-card-foreground flex-1">
                  {option}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}
