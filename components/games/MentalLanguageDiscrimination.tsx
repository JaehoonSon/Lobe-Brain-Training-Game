import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { cn } from "~/lib/utils";
import * as Haptics from "expo-haptics";
import { MentalLanguageDiscriminationContent } from "~/lib/validators/game-content";

interface MentalLanguageDiscriminationProps {
  onComplete: (isCorrect: boolean) => void;
  content: MentalLanguageDiscriminationContent;
}

export function MentalLanguageDiscrimination({
  onComplete,
  content,
}: MentalLanguageDiscriminationProps) {
  const [choices, setChoices] = useState<string[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  useEffect(() => {
    // Shuffle choices from content options
    const newChoices = [...content.options].sort(() => Math.random() - 0.5);
    setChoices(newChoices);
    setSelectedChoice(null);
    setHasAnswered(false);
  }, [content]);

  const handleChoice = (choice: string) => {
    if (hasAnswered) return;

    setHasAnswered(true);
    setSelectedChoice(choice);

    const isCorrect = choice === content.answer;

    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    // Small delay to show feedback
    setTimeout(() => {
      onComplete(isCorrect);
    }, 500);
  };

  return (
    <View className="flex-1 items-center justify-center p-6 gap-8">
      <View className="items-center justify-center h-48 w-full">
        <Text className="text-3xl font-bold text-foreground text-center p-3 leading-relaxed">
          {content.sentenceParts[0]}
          <Text className="text-primary underline">_____</Text>
          {content.sentenceParts[1]}
        </Text>
      </View>

      <View className="flex-row gap-4 w-full justify-center">
        {choices.map((choice, index) => {
          const isSelected = selectedChoice === choice;
          const isCorrectAnswer = choice === content.answer;

          let variant: "default" | "destructive" | "outline" | "secondary" =
            "default";

          if (hasAnswered) {
            if (isSelected && !isCorrectAnswer) {
              variant = "destructive";
            }
          }

          return (
            <Button
              key={index}
              variant={variant}
              size="xl"
              className={cn(
                "h-40 min-w-[160px] px-4 rounded-3xl active:scale-95 shadow-xl", // Match Mental Math size
                hasAnswered &&
                  isCorrectAnswer &&
                  "bg-green-600 border-green-700", // Darker Green
                hasAnswered &&
                  !isCorrectAnswer &&
                  isSelected &&
                  "bg-red-600 border-red-700", // Darker Red
                hasAnswered && !isCorrectAnswer && !isSelected && "opacity-20"
              )}
              onPress={() => handleChoice(choice)}
              disabled={hasAnswered}
            >
              <Text
                className={cn(
                  "text-3xl font-black", // Sligthly smaller than 4xl to accommodate words
                  variant === "default" &&
                    !hasAnswered &&
                    "text-primary-foreground",
                  hasAnswered && isCorrectAnswer && "text-white"
                )}
              >
                {choice}
              </Text>
            </Button>
          );
        })}
      </View>
    </View>
  );
}
