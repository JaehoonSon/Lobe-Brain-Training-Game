import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { cn } from "~/lib/utils";

interface MentalLanguageDiscriminationProps {
  onComplete: (isCorrect: boolean) => void;
  difficulty?: "easy" | "medium" | "hard";
}

interface Question {
  sentenceParts: string[]; // ["She went ", " the store."]
  options: string[]; // ["to", "too"]
  answer: string;
}

const QUESTIONS: Question[] = [
  {
    sentenceParts: ["She went ", " the store."],
    options: ["to", "too"],
    answer: "to",
  },
  {
    sentenceParts: ["The cat is ", " here."],
    options: ["their", "there"],
    answer: "there",
  },
  {
    sentenceParts: ["I can't ", " this anymore."],
    options: ["bare", "bear"],
    answer: "bear",
  },
  {
    sentenceParts: ["The ", " was delicious."],
    options: ["flower", "flour"],
    answer: "flour",
  },
  {
    sentenceParts: ["He ", " the ball."],
    options: ["threw", "through"],
    answer: "threw",
  },
  {
    sentenceParts: ["It's ", " late."],
    options: ["to", "too"],
    answer: "too",
  },
  {
    sentenceParts: ["This is ", " book."],
    options: ["their", "there"],
    answer: "their",
  },
  {
    sentenceParts: ["The ", " shines brightly."],
    options: ["son", "sun"],
    answer: "sun",
  },
];

export function MentalLanguageDiscrimination({
  onComplete,
  difficulty = "easy",
}: MentalLanguageDiscriminationProps) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  useEffect(() => {
    generateNewQuestion();
  }, []);

  const generateNewQuestion = () => {
    const randomIndex = Math.floor(Math.random() * QUESTIONS.length);
    const q = QUESTIONS[randomIndex];

    // Shuffle choices
    const newChoices = [...q.options].sort(() => Math.random() - 0.5);

    setQuestion(q);
    setChoices(newChoices);
    setSelectedChoice(null);
    setHasAnswered(false);
  };

  const handleChoice = (choice: string) => {
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
        <Text className="text-3xl font-bold text-foreground text-center p-3 leading-relaxed">
          {question.sentenceParts[0]}
          <Text className="text-primary underline">_____</Text>
          {question.sentenceParts[1]}
        </Text>
      </View>

      <View className="flex-row gap-4 w-full justify-center">
        {choices.map((choice, index) => {
          const isSelected = selectedChoice === choice;

          return (
            <Button
              key={index}
              variant="outline"
              className={cn(
                "h-24 px-8 min-w-[140px] rounded-2xl border-2 active:scale-95",
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
                  "text-2xl font-bold",
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
