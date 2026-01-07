import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "~/lib/supabase";
import { MentalArithmetic } from "~/components/games/MentalArithmetic";
import { MemoryMatrix } from "~/components/games/MemoryMatrix";
import { MentalLanguageDiscrimination } from "~/components/games/MentalLanguageDiscrimination";
import { GameContentSchema } from "~/lib/validators/game-content";
import { generateMemoryMatrix } from "~/lib/generators/memoryMatrix";
import { X } from "lucide-react-native";
import { Text } from "~/components/ui/text";

export default function GamePlayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sessionQuestions, setSessionQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Constants
  const QUESTIONS_PER_ROUND = 3;

  useEffect(() => {
    fetchGameContent();
  }, [id]);

  const fetchGameContent = async () => {
    setLoading(true);
    setSessionQuestions([]);
    setCurrentQuestionIndex(0);

    try {
      // Branch: Procedural vs Static
      if (id === "memory_matrix") {
        console.log("Generating procedural content for:", id);
        const newQuestions = [];
        for (let i = 0; i < QUESTIONS_PER_ROUND; i++) {
          // TODO: Dynamic difficulty based on user history (Defaulting to 1 for MVP)
          newQuestions.push(generateMemoryMatrix({ difficulty: 1 }));
        }
        setSessionQuestions(newQuestions);
        setCurrentQuestionIndex(0);
        setLoading(false);
        return;
      }

      console.log("Fetching game content for:", id);
      const { data, error } = await supabase
        .from("questions")
        .select("content")
        .eq("game_id", id)
        .limit(20); // Fetch more pool to pick from

      if (error) throw error;

      if (!data || data.length === 0) {
        Alert.alert("Error", "No questions found for this game.", [
          { text: "Go Back", onPress: () => router.back() },
        ]);
        return;
      }

      // Shuffle and pick 3 unique questions if possible
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
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to load game.", [
        { text: "Go Back", onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = (isCorrect: boolean) => {
    // For now, we can just log correctness or maybe show a mini feedback
    // Ideally we track score here.

    if (currentQuestionIndex < sessionQuestions.length - 1) {
      // Next question
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev + 1);
      }, 500); // Small delay between questions if needed, though game component has delay too
    } else {
      // End of round
      Alert.alert(
        "Session Complete!",
        `You finished ${QUESTIONS_PER_ROUND} rounds.`,
        [
          { text: "Play Again", onPress: fetchGameContent },
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

  return (
    <View className="flex-1 bg-background">
      <TouchableOpacity
        onPress={() => router.back()}
        className="absolute top-12 left-6 z-20 w-12 h-12 rounded-full bg-black/40 items-center justify-center mb-4"
      >
        <X color="white" size={24} />
      </TouchableOpacity>

      {/* Progress Indicator */}
      <View className="absolute top-12 right-6 z-20 bg-black/40 px-4 py-2 rounded-full">
        <Text className="text-white font-bold">
          {currentQuestionIndex + 1} / {sessionQuestions.length}
        </Text>
      </View>

      <View className="flex-1 pt-20">
        {/* Render Key to force re-mount on question change so internal state resets */}
        {id === "mental_arithmetic" && (
          <MentalArithmetic
            key={currentQuestionIndex}
            content={currentContent}
            onComplete={handleComplete}
          />
        )}
        {id === "memory_matrix" && (
          <MemoryMatrix
            key={currentQuestionIndex}
            content={currentContent}
            onComplete={handleComplete}
          />
        )}
        {id === "mental_language_discrimination" && (
          <MentalLanguageDiscrimination
            key={currentQuestionIndex}
            content={currentContent}
            onComplete={handleComplete}
          />
        )}
        {![
          "mental_arithmetic",
          "memory_matrix",
          "mental_language_discrimination",
        ].includes(id as string) && (
            <View className="flex-1 items-center justify-center">
              <Text>Game component not implemented for {id}</Text>
            </View>
          )}
      </View>
    </View>
  );
}
