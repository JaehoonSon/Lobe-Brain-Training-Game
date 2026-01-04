import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { cn } from "~/lib/utils";

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
          let variant: "default" | "secondary" | "destructive" | "outline" =
            "outline";

          if (hasAnswered && isSelected) {
            variant = choice === question.answer ? "default" : "destructive"; // Green (default usually primary) or Red
          } else {
            variant = "secondary";
          }

          // Override for Success Color if needed, but Button variants are usually:
          // default (primary), secondary, destructive, outline, ghost, link.
          // Assuming 'default' is a primary color (often blue or black), 'destructive' is red.
          // For correct answer green, we might need custom styles if 'default' isn't green.
          // But 'default' is usually good enough for "Active/Selected".

          // Actually, let's make it simpler:
          // Neutral: secondary
          // Correct: className="bg-green-500"
          // Incorrect: destructive

          return (
            <Button
              key={index}
              variant="outline"
              className={cn(
                "h-32 w-40 rounded-2xl border-2 active:scale-95",
                !hasAnswered && "bg-secondary border-transparent",
                hasAnswered &&
                  choice === question.answer &&
                  "bg-green-500 border-green-600",
                hasAnswered &&
                  choice !== question.answer &&
                  isSelected &&
                  "bg-red-500 border-red-600",
                hasAnswered &&
                  choice !== question.answer &&
                  !isSelected &&
                  "opacity-50"
              )}
              onPress={() => handleChoice(choice)}
              disabled={hasAnswered}
            >
              <Text
                className={cn(
                  "text-4xl font-bold",
                  hasAnswered && (choice === question.answer || isSelected)
                    ? "text-white"
                    : "text-foreground"
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
