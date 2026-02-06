import { useState, useEffect } from "react";
import { View, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomStepProps } from "~/app/(onboarding)/index";
import { MemoryMatrix } from "~/components/games/MemoryMatrix";
import { MentalArithmetic } from "~/components/games/MentalArithmetic";
import { MentalLanguageDiscrimination } from "~/components/games/MentalLanguageDiscrimination";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import { Text } from "~/components/ui/text";
import { useOnboarding } from "~/contexts/OnboardingContext";
import { supabase } from "~/lib/supabase";
import { GameContentSchema } from "~/lib/validators/game-content";

export interface GameConfig {
  type:
    | "mental_arithmetic"
    | "mental_language_discrimination"
    | "memory_matrix";
}

export interface GameStepProps extends CustomStepProps {
  gameConfig: GameConfig;
}

// eslint-disable-next-line unused-imports/no-unused-vars
export function GameStep({ onNext, onBack, gameConfig }: GameStepProps) {
  const { updateData } = useOnboarding();
  const [roundIndex, setRoundIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
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
      console.log(
        `Fetching onboarding questions for ${gameConfig.type} via RPC...`,
      );

      const { data: questionsData, error } = await supabase.rpc(
        "get_game_questions",
        {
          p_game_id: gameConfig.type,
          p_count: TOTAL_ROUNDS,
        },
      );

      if (error) throw error;

      if (!questionsData || questionsData.length === 0) {
        Alert.alert("Error", "Setup incomplete. No questions found.");
        return;
      }

      console.log(`Received ${questionsData.length} questions from RPC`);

      // 6. Shuffle final selection for variety
      const shuffled = [...questionsData].sort(() => Math.random() - 0.5);

      // Validate and prepare questions
      const validQs: any[] = [];
      for (const q of shuffled) {
        const parsed = GameContentSchema.safeParse(q.content);
        if (parsed.success) {
          validQs.push(parsed.data);
        } else {
          console.warn("Invalid onboarding question content:", parsed.error);
        }
      }

      if (validQs.length === 0) {
        Alert.alert("Error", "No valid questions found.");
        return;
      }

      setQuestions(validQs);
    } catch (err) {
      console.error("Failed to fetch onboarding questions", err);
      Alert.alert("Error", "Failed to load game step.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoundComplete = (accuracy: number) => {
    const isCorrect = accuracy === 1;
    const newResults = [...results, isCorrect];
    setResults(newResults);

    // Check against questions.length in case we fetched fewer than expected
    if (roundIndex < Math.min(TOTAL_ROUNDS, questions.length) - 1) {
      setRoundIndex(roundIndex + 1);
    } else {
      // Save results and move on immediately
      const duration = (Date.now() - startTime) / 1000;
      const score = newResults.filter((r) => r).length;

      updateData(gameConfig.type, {
        score,
        total: Math.min(TOTAL_ROUNDS, questions.length),
        duration,
      });

      onNext();
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
        <Button onPress={onNext} variant="outline" className="h-12 px-8 mt-4">
          <Text className="text-foreground font-bold">Skip</Text>
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
          {gameConfig.type === "mental_arithmetic" ? (
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
