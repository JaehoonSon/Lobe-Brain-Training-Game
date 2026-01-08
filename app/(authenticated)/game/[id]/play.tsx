import React, { useEffect, useState, useRef } from "react";
import { View, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "~/lib/supabase";
import { MentalArithmetic } from "~/components/games/MentalArithmetic";
import { MemoryMatrix } from "~/components/games/MemoryMatrix";
import { MentalLanguageDiscrimination } from "~/components/games/MentalLanguageDiscrimination";
import { Wordle } from "~/components/games/Wordle";
import { GameContentSchema, GameContent } from "~/lib/validators/game-content";
import { useGameSession, AnswerRecord } from "~/hooks/useGameSession";
import { useAuth } from "~/contexts/AuthProvider";
import { X } from "lucide-react-native";
import { Text } from "~/components/ui/text";

// Constants
const QUESTIONS_PER_ROUND = 3;
const DEFAULT_DIFFICULTY = 1;

interface QuestionData {
  id?: string;          // Question ID from DB (if applicable)
  content: GameContent; // Parsed content
  difficulty: number;
}

export default function GamePlayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { state: session, startRound, recordAnswer, endRound, resetSession } = useGameSession();

  const [sessionQuestions, setSessionQuestions] = useState<QuestionData[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Track when each question started (for response time calculation)
  const questionStartTimeRef = useRef<number>(Date.now());

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
        .select("id, content, difficulty")
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

      const validQuestions: QuestionData[] = [];

      for (const item of selectedRaw) {
        const parsed = GameContentSchema.safeParse(item.content);
        if (parsed.success) {
          validQuestions.push({
            id: item.id,
            content: parsed.data,
            difficulty: item.difficulty ?? DEFAULT_DIFFICULTY,
          });
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

      // Calculate average difficulty of selected questions
      const avgDifficulty = Math.round(
        validQuestions.reduce((sum, q) => sum + q.difficulty, 0) / validQuestions.length
      );

      setSessionQuestions(validQuestions);
      setCurrentQuestionIndex(0);
      questionStartTimeRef.current = Date.now();

      // Start the session!
      startRound({
        gameId: id as string,
        difficulty: avgDifficulty,
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

  // Called when question index changes - reset the timer
  useEffect(() => {
    if (!loading && sessionQuestions.length > 0) {
      questionStartTimeRef.current = Date.now();
    }
  }, [currentQuestionIndex, loading]);

  const handleQuestionComplete = async (accuracy: number, userResponse?: any) => {
    const currentQuestion = sessionQuestions[currentQuestionIndex];
    const responseTimeMs = Date.now() - questionStartTimeRef.current;

    // Build full answer record
    const answer: AnswerRecord = {
      questionId: currentQuestion.id,
      accuracy,  // 0.0 to 1.0
      responseTimeMs,
      userResponse: userResponse ?? null,
      generatedContent: currentQuestion.content as any, // Store the question content
    };

    // Record this answer in the session
    recordAnswer(answer);

    if (currentQuestionIndex < sessionQuestions.length - 1) {
      // Next question
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev + 1);
      }, 300);
    } else {
      // End of round - calculate and save BPI
      const finalBpi = await endRound();
      const perfectCount = session.correctCount + (accuracy === 1.0 ? 1 : 0);

      Alert.alert(
        "Round Complete!",
        `Score: ${finalBpi ?? 0} BPI\nPerfect: ${perfectCount}/${sessionQuestions.length}`,
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

  const currentQuestion = sessionQuestions[currentQuestionIndex];

  if (!currentQuestion) {
    return null;
  }

  // Map game ID to component
  const renderGame = () => {
    const content = currentQuestion.content;

    switch (id) {
      case "mental_arithmetic":
        if (content.type !== "mental_arithmetic") return null;
        return (
          <MentalArithmetic
            key={currentQuestionIndex}
            content={content}
            onComplete={handleQuestionComplete}
          />
        );
      case "memory_matrix":
        if (content.type !== "memory_matrix") return null;
        return (
          <MemoryMatrix
            key={currentQuestionIndex}
            content={content}
            onComplete={handleQuestionComplete}
          />
        );
      case "mental_language_discrimination":
        if (content.type !== "mental_language_discrimination") return null;
        return (
          <MentalLanguageDiscrimination
            key={currentQuestionIndex}
            content={content}
            onComplete={handleQuestionComplete}
          />
        );
      case "wordle":
        if (content.type !== "wordle") return null;
        return (
          <Wordle
            key={currentQuestionIndex}
            content={content}
            onComplete={handleQuestionComplete}
          />
        );
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
