import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { cn } from "~/lib/utils";
import * as Haptics from "expo-haptics";

interface MentalArithmeticProps {
  onComplete: (isCorrect: boolean) => void;
  difficulty?: "easy" | "medium" | "hard";
}

interface Question {
  num1: number;
  num2: number;
  operator: "+" | "-" | "x";
  answer: number;
}

export function MentalArithmetic({
  onComplete,
  difficulty = "easy",
}: MentalArithmeticProps) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [choices, setChoices] = useState<number[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  useEffect(() => {
    generateNewQuestion();
  }, []);

  const generateNewQuestion = () => {
    // Basic difficulty scaling
    const max = difficulty === "easy" ? 10 : difficulty === "medium" ? 20 : 50;
    const min = difficulty === "easy" ? 1 : 5;

    const num1 = Math.floor(Math.random() * (max - min + 1)) + min;
    const num2 = Math.floor(Math.random() * (max - min + 1)) + min;
    const operatorRaw = Math.random();
    let operator: "+" | "-" | "x" = "+";
    let answer = 0;

    if (operatorRaw < 0.33) {
      operator = "+";
      answer = num1 + num2;
    } else if (operatorRaw < 0.66) {
      operator = "-";
      answer = num1 - num2;
    } else {
      operator = "x";
      // Keep multiplication simpler for "mental" arithmetic
      const mulMax = difficulty === "easy" ? 5 : 10;
      const n1 = Math.floor(Math.random() * mulMax) + 1;
      const n2 = Math.floor(Math.random() * mulMax) + 1;
      // Override for multiplication to be reasonable
      return setQuestionAndChoices(n1, n2, "x", n1 * n2);
    }

    setQuestionAndChoices(num1, num2, operator, answer);
  };

  const setQuestionAndChoices = (
    n1: number,
    n2: number,
    op: "+" | "-" | "x",
    ans: number
  ) => {
    setQuestion({ num1: n1, num2: n2, operator: op, answer: ans });

    // Generate distractor
    let distractor = ans;
    while (distractor === ans) {
      const offset = Math.floor(Math.random() * 5) + 1;
      distractor = Math.random() > 0.5 ? ans + offset : ans - offset;
    }

    // Shuffle choices
    const newChoices =
      Math.random() > 0.5 ? [ans, distractor] : [distractor, ans];
    setChoices(newChoices);
    setSelectedChoice(null);
    setHasAnswered(false);
  };

  const handleChoice = (choice: number) => {
    if (hasAnswered || !question) return;

    setHasAnswered(true);
    setSelectedChoice(choice);

    const isCorrect = choice === question.answer;

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

  if (!question) return null;

  return (
    <View className="flex-1 items-center justify-center p-6 gap-8">
      <View className="items-center justify-center h-48 w-full">
        <Text className="text-6xl font-extrabold text-foreground text-center p-3">
          {question.num1} {question.operator} {question.num2} = ?
        </Text>
      </View>

      <View className="flex-row gap-4 w-full justify-center">
        {choices.map((choice, index) => {
          const isSelected = selectedChoice === choice;
          const isCorrectAnswer = choice === question.answer;

          let variant: "default" | "destructive" | "outline" | "secondary" = "default";

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
                "h-40 w-48 rounded-3xl active:scale-95 shadow-xl", // Keep button big
                hasAnswered && isCorrectAnswer && "bg-green-600 border-green-700", // Darker Green
                hasAnswered && !isCorrectAnswer && isSelected && "bg-red-600 border-red-700", // Darker Red (Override destructive)
                hasAnswered && !isCorrectAnswer && !isSelected && "opacity-20"
              )}
              onPress={() => handleChoice(choice)}
              disabled={hasAnswered}
            >
              <Text
                className={cn(
                  "text-4xl font-black", // 4xl is approx 36px, smaller than 5xl(48px)
                  variant === "default" && !hasAnswered && "text-primary-foreground",
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
