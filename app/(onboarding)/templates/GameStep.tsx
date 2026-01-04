import { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { CustomStepProps } from "~/app/(onboarding)/index";
import { MentalArithmetic } from "~/components/games/MentalArithmetic";
import { MentalLanguageDiscrimination } from "~/components/games/MentalLanguageDiscrimination";
import { Progress } from "~/components/ui/progress";

export interface GameConfig {
  type: "mental_arithmetic" | "mental_language_discrimination";
}

export interface GameStepProps extends CustomStepProps {
  gameConfig: GameConfig;
}

type GameResult = {
  correct: boolean;
  timestamp: number;
};

const TOTAL_ROUNDS = 5;

export function GameStep({ onNext, onBack, gameConfig }: GameStepProps) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [results, setResults] = useState<GameResult[]>([]);
  const [complete, setComplete] = useState(false);

  const handleRoundComplete = (isCorrect: boolean) => {
    const newResults = [
      ...results,
      { correct: isCorrect, timestamp: Date.now() },
    ];
    setResults(newResults);

    if (roundIndex < TOTAL_ROUNDS - 1) {
      setRoundIndex(roundIndex + 1);
    } else {
      setComplete(true);
      // Wait a moment before moving on or show a summary?
      // For now, let's just complete after a brief pause
      setTimeout(() => {
        onNext();
      }, 1000);
    }
  };

  if (
    gameConfig.type === "mental_arithmetic" ||
    gameConfig.type === "mental_language_discrimination"
  ) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="px-6 py-4 flex-row items-center justify-between">
          <View className="flex-1 mx-4">
            <Progress
              value={(roundIndex / TOTAL_ROUNDS) * 100}
              className="h-4 bg-primary/20"
            />
          </View>
        </View>

        <View className="flex-1">
          {!complete ? (
            gameConfig.type === "mental_arithmetic" ? (
              <MentalArithmetic
                // Key forces remount for new question
                key={roundIndex}
                onComplete={handleRoundComplete}
                difficulty="easy"
              />
            ) : (
              <MentalLanguageDiscrimination
                key={roundIndex}
                onComplete={handleRoundComplete}
                difficulty="easy"
              />
            )
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-3xl font-bold mb-4">Complete!</Text>
              <Text className="text-xl text-muted-foreground">
                Score: {results.filter((r) => r.correct).length}/{TOTAL_ROUNDS}
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-destructive">Unknown Game Type</Text>
    </View>
  );
}
