import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { cn } from "~/lib/utils";
import * as Haptics from "expo-haptics";
import { MentalArithmeticContent } from "~/lib/validators/game-content";

interface MentalArithmeticProps {
  onComplete: (accuracy: number) => void;  // 0.0 to 1.0
  content: MentalArithmeticContent;
}

interface Question {
  num1: number;
  num2: number;
  operator: "+" | "-" | "x" | "*" | "/";
  answer: number;
}

export function MentalArithmetic({
  onComplete,
  content,
}: MentalArithmeticProps) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [choices, setChoices] = useState<number[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  useEffect(() => {
    generateNewQuestion();
  }, [content]);

  const generateNewQuestion = () => {
    // Basic difficulty scaling if config provided, defaults if not
    const min = content.operandRange?.[0] ?? 1;
    const max = content.operandRange?.[1] ?? 10;
    const allowedOperators = content.operators ?? ["+"];

    const num1 = Math.floor(Math.random() * (max - min + 1)) + min;
    const num2 = Math.floor(Math.random() * (max - min + 1)) + min;

    const randomOpIndex = Math.floor(Math.random() * allowedOperators.length);
    const operator = allowedOperators[randomOpIndex] as
      | "+"
      | "-"
      | "x"
      | "*"
      | "/";

    let answer = 0;

    switch (operator) {
      case "+":
        answer = num1 + num2;
        break;
      case "-":
        answer = num1 - num2;
        break;
      case "x":
      case "*":
        answer = num1 * num2;
        break;
      case "/":
        // Ensure clean division
        // To make it integer division, we can work backwards: answer * num2 = num1
        // But here we already picked num1 and num2 randomly.
        // Let's adjust num1 to be a multiple of num2.
        answer = num1; // Treat the random num1 as the answer for now
        const dividend = answer * num2; // new num1
        // Re-assign for division case
        setQuestionAndChoices(dividend, num2, operator, answer);
        return;
    }

    setQuestionAndChoices(num1, num2, operator, answer);
  };

  const setQuestionAndChoices = (
    n1: number,
    n2: number,
    op: "+" | "-" | "x" | "*" | "/",
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

    // Small delay to show feedback - pass 1.0 for correct, 0.0 for incorrect
    setTimeout(() => {
      onComplete(isCorrect ? 1.0 : 0.0);
    }, 500);
  };

  if (!question) return null;

  // Display 'x' for multiplication and '÷' for division
  const displayOperator =
    question.operator === "*"
      ? "x"
      : question.operator === "/"
        ? "÷"
        : question.operator;

  return (
    <View className="flex-1 items-center justify-center p-6 gap-8">
      <View className="items-center justify-center h-48 w-full">
        <Text className="text-6xl font-extrabold text-foreground text-center p-3">
          {question.num1} {displayOperator} {question.num2} = ?
        </Text>
      </View>

      <View className="flex-row gap-4 w-full justify-center">
        {choices.map((choice, index) => {
          const isSelected = selectedChoice === choice;
          const isCorrectAnswer = choice === question.answer;

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
                "h-40 w-48 rounded-3xl active:scale-95 shadow-xl", // Keep button big
                hasAnswered &&
                isCorrectAnswer &&
                "bg-green-600 border-green-700", // Darker Green
                hasAnswered &&
                !isCorrectAnswer &&
                isSelected &&
                "bg-red-600 border-red-700", // Darker Red (Override destructive)
                hasAnswered && !isCorrectAnswer && !isSelected && "opacity-20"
              )}
              onPress={() => handleChoice(choice)}
              disabled={hasAnswered}
            >
              <Text
                className={cn(
                  "text-4xl font-black", // 4xl is approx 36px, smaller than 5xl(48px)
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
