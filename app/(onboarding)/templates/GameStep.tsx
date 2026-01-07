import { useState, useEffect } from "react";
import { View, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { CustomStepProps } from "~/app/(onboarding)/index";
import { MentalArithmetic } from "~/components/games/MentalArithmetic";
import { MentalLanguageDiscrimination } from "~/components/games/MentalLanguageDiscrimination";
import { MemoryMatrix } from "~/components/games/MemoryMatrix";
import { Progress } from "~/components/ui/progress";
import { supabase } from "~/lib/supabase";
import { GameContentSchema } from "~/lib/validators/game-content";

import { useOnboarding } from "~/contexts/OnboardingContext";

export interface GameConfig {
  type:
    | "mental_arithmetic"
    | "mental_language_discrimination"
    | "memory_matrix";
}

export interface GameStepProps extends CustomStepProps {
  gameConfig: GameConfig;
}

export function GameStep({ onNext, onBack, gameConfig }: GameStepProps) {
  const { updateData } = useOnboarding();
  const [roundIndex, setRoundIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [complete, setComplete] = useState(false);
  const [startTime] = useState<number>(Date.now());
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Determine total rounds based on game type
  const TOTAL_ROUNDS = gameConfig.type === "memory_matrix" ? 3 : 6;

  useEffect(() => {
    fetchQuestions();
  }, [gameConfig.type]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      // Map config type to game_id in DB
      // Assuming game_ids match the config type strings exactly
      const { data, error } = await supabase
        .from("questions")
        .select("content, difficulty")
        .eq("game_id", gameConfig.type)
        .order("difficulty", { ascending: true }) // Lowest difficulty first
        .limit(TOTAL_ROUNDS);

      if (error) throw error;

      if (!data || data.length < TOTAL_ROUNDS) {
        // Fallback or alert if not enough questions.
        // For onboarding, we ideally expect seeded data.
        // We will use what we have or error.
        if (!data || data.length === 0) {
          Alert.alert("Error", "Setup incomplete. No questions found.");
          return;
        }
      }

      // Validate and prepare questions
      const validQs: any[] = [];
      for (const q of data) {
        const parsed = GameContentSchema.safeParse(q.content);
        if (parsed.success) {
          validQs.push(parsed.data);
        }
      }

      // If we have fewer than total rounds, we might need to cycle or reduce rounds.
      // For now, let's just use what we have and effectively shorten the game if needed.
      setQuestions(validQs);
    } catch (err) {
      console.error("Failed to fetch onboarding questions", err);
      Alert.alert("Error", "Failed to load game step.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoundComplete = (isCorrect: boolean) => {
    const newResults = [...results, isCorrect];
    setResults(newResults);

    // Check against questions.length in case we fetched fewer than expected
    if (roundIndex < Math.min(TOTAL_ROUNDS, questions.length) - 1) {
      setRoundIndex(roundIndex + 1);
    } else {
      setComplete(true);

      // Save results
      const duration = (Date.now() - startTime) / 1000;
      const score = newResults.filter((r) => r).length;

      updateData(gameConfig.type, {
        score,
        total: Math.min(TOTAL_ROUNDS, questions.length),
        duration,
      });

      setTimeout(() => {
        onNext();
      }, 1000);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="mt-4">Loading assessment...</Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text>No questions available.</Text>
        <Button onPress={onNext} variant="outline" className="mt-4">
          <Text>Skip</Text>
        </Button>
      </View>
    );
  }

  const currentContent = questions[roundIndex];

  if (
    gameConfig.type === "mental_arithmetic" ||
    gameConfig.type === "mental_language_discrimination" ||
    gameConfig.type === "memory_matrix"
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
                key={roundIndex}
                onComplete={handleRoundComplete}
                content={currentContent}
              />
            ) : gameConfig.type === "mental_language_discrimination" ? (
              <MentalLanguageDiscrimination
                key={roundIndex}
                onComplete={handleRoundComplete}
                content={currentContent}
              />
            ) : (
              <MemoryMatrix
                key={roundIndex}
                onComplete={handleRoundComplete}
                content={currentContent}
              />
            )
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-3xl font-bold mb-4">Complete!</Text>
              <Text className="text-xl text-muted-foreground">
                Score: {results.filter((r) => r).length}/
                {Math.min(TOTAL_ROUNDS, questions.length)}
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
