import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "~/lib/supabase";
import { MentalArithmetic } from "~/components/games/MentalArithmetic";
import { MemoryMatrix } from "~/components/games/MemoryMatrix";
import { MentalLanguageDiscrimination } from "~/components/games/MentalLanguageDiscrimination";
import { Wordle } from "~/components/games/Wordle";
import { GameContentSchema } from "~/lib/validators/game-content";
import { useGameSession } from "~/hooks/useGameSession";
import { useAuth } from "~/contexts/AuthProvider";
import { X } from "lucide-react-native";
import { Text } from "~/components/ui/text";

// Constants
const QUESTIONS_PER_ROUND = 3;
const DEFAULT_DIFFICULTY = 1;

export default function GamePlayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { state: session, startRound, recordAnswer, endRound, resetSession } = useGameSession();

  const [sessionQuestions, setSessionQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAndStartRound();
  }, [id]);

  const fetchAndStartRound = async () => {
    setLoading(true);
    setSessionQuestions([]);
    setCurrentQuestionIndex(0);
    resetSession();

    try {
      console.log("Fetching game content for:", id);
      const { data, error } = await supabase
        .from("questions")
        .select("content, difficulty")
        .eq("game_id", id)
        .limit(20);

      if (error) throw error;

      if (!data || data.length === 0) {
        Alert.alert("Error", "No questions found for this game.", [
          { text: "Go Back", onPress: () => router.back() },
        ]);
        return;
      }

      // Shuffle and pick questions
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      const selectedRaw = shuffled.slice(0, QUESTIONS_PER_ROUND);

      const validQuestions: any[] = [];

      for (const item of selectedRaw) {
        const parsed = GameContentSchema.safeParse(item.content);
        if (parsed.success) {
          validQuestions.push(parsed.data);
        } else {
          console.warn("Invalid question content:", parsed.error);
        }
      }

      if (validQuestions.length === 0) {
        Alert.alert("Error", "No valid questions found.", [
          { text: "Go Back", onPress: () => router.back() },
        ]);
        return;
      }

      setSessionQuestions(validQuestions);
      setCurrentQuestionIndex(0);

      // Start the session!
      startRound({
        gameId: id as string,
        difficulty: DEFAULT_DIFFICULTY, // TODO: Use user's current rating
        userId: user?.id || "anonymous",
        totalQuestions: validQuestions.length,
      });

    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to load game.", [
        { text: "Go Back", onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionComplete = async (isCorrect: boolean) => {
    // Record this answer in the session
    recordAnswer(isCorrect);

    if (currentQuestionIndex < sessionQuestions.length - 1) {
      // Next question
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev + 1);
      }, 300);
    } else {
      // End of round - calculate and save BPI
      const finalBpi = await endRound();

      Alert.alert(
        "Round Complete!",
        `Score: ${finalBpi ?? 0} BPI\nCorrect: ${session.correctCount + (isCorrect ? 1 : 0)}/${sessionQuestions.length}`,
        [
          { text: "Play Again", onPress: fetchAndStartRound },
          { text: "Exit", onPress: () => router.back() },
        ]
      );
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-lg font-medium text-muted-foreground">
          Preparing round...
        </Text>
      </View>
    );
  }

  const currentContent = sessionQuestions[currentQuestionIndex];

  if (!currentContent) {
    return null;
  }

  // Map game ID to component
  const renderGame = () => {
    const commonProps = {
      key: currentQuestionIndex,
      content: currentContent,
      onComplete: handleQuestionComplete,
    };

    switch (id) {
      case "mental_arithmetic":
        return <MentalArithmetic {...commonProps} />;
      case "memory_matrix":
        return <MemoryMatrix {...commonProps} />;
      case "mental_language_discrimination":
        return <MentalLanguageDiscrimination {...commonProps} />;
      case "wordle":
        return <Wordle {...commonProps} />;
      default:
        return (
          <View className="flex-1 items-center justify-center">
            <Text>Game component not implemented for {id}</Text>
          </View>
        );
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Close Button */}
      <TouchableOpacity
        onPress={() => router.back()}
        className="absolute top-12 left-6 z-20 w-12 h-12 rounded-full bg-black/40 items-center justify-center"
      >
        <X color="white" size={24} />
      </TouchableOpacity>

      {/* Progress Indicator */}
      <View className="absolute top-12 right-6 z-20 bg-black/40 px-4 py-2 rounded-full">
        <Text className="text-white font-bold">
          {currentQuestionIndex + 1} / {sessionQuestions.length}
        </Text>
      </View>

      {/* Score Preview (during play) */}
      {session.isPlaying && session.correctCount > 0 && (
        <View className="absolute top-12 right-28 z-20 bg-green-600/80 px-3 py-2 rounded-full">
          <Text className="text-white font-bold">
            ✓ {session.correctCount}
          </Text>
        </View>
      )}

      <View className="flex-1 pt-20">
        {renderGame()}
      </View>
    </View>
  );
}
