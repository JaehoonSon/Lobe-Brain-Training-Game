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
const QUESTIONS_PER_ROUND = 8;
const CORE_QUESTIONS = 6;    // ~75% comfort (rating ± 0.5)
const STRETCH_QUESTIONS = 2; // ~25% challenge (rating + 0.8 to +1.5)
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
      // 1. First, fetch user's current difficulty rating
      let difficultyRatingUsed = DEFAULT_DIFFICULTY; // Default for new players
      if (user?.id) {
        const { data: perfData, error: perfErr } = await supabase
          .from("user_game_performance")
          .select("difficulty_rating")
          .eq("user_id", user.id)
          .eq("game_id", id)
          .maybeSingle();

        if (perfErr) throw perfErr;

        if (perfData?.difficulty_rating) {
          difficultyRatingUsed = perfData.difficulty_rating;
        } else {
          // Create row for first-time players
          await supabase
            .from("user_game_performance")
            .upsert(
              { user_id: user.id, game_id: id as string, difficulty_rating: DEFAULT_DIFFICULTY },
              { onConflict: "user_id,game_id" }
            );
        }
      }
      console.log(`User difficulty rating: ${difficultyRatingUsed}`);

      // 2. Query CORE questions (comfort zone: rating ± 0.5)
      const coreMinD = Math.max(0, difficultyRatingUsed - 0.5);
      const coreMaxD = Math.min(10, difficultyRatingUsed + 0.5);
      console.log(`Querying CORE questions: ${coreMinD.toFixed(1)} - ${coreMaxD.toFixed(1)}`);

      const { data: coreData, error: coreErr } = await supabase
        .from("questions")
        .select("id, content, difficulty")
        .eq("game_id", id)
        .gte("difficulty", coreMinD)
        .lte("difficulty", coreMaxD)
        .limit(30);

      if (coreErr) throw coreErr;

      // 3. Query STRETCH questions (challenge zone: rating + 0.8 to +1.5)
      const stretchMinD = Math.min(10, difficultyRatingUsed + 0.8);
      const stretchMaxD = Math.min(10, difficultyRatingUsed + 1.5);
      console.log(`Querying STRETCH questions: ${stretchMinD.toFixed(1)} - ${stretchMaxD.toFixed(1)}`);

      const { data: stretchData, error: stretchErr } = await supabase
        .from("questions")
        .select("id, content, difficulty")
        .eq("game_id", id)
        .gte("difficulty", stretchMinD)
        .lte("difficulty", stretchMaxD)
        .limit(15);

      if (stretchErr) throw stretchErr;

      // 4. Fallback: if not enough questions, query any difficulty
      let fallbackData: { id: string; content: any; difficulty: number }[] | null = null;
      const availableCore = coreData?.length ?? 0;
      const availableStretch = stretchData?.length ?? 0;
      const neededFallback = QUESTIONS_PER_ROUND - Math.min(availableCore, CORE_QUESTIONS) - Math.min(availableStretch, STRETCH_QUESTIONS);

      if (neededFallback > 0) {
        console.log(`Need ${neededFallback} fallback questions from any difficulty`);
        const usedIds = [
          ...(coreData?.map(q => q.id) ?? []),
          ...(stretchData?.map(q => q.id) ?? []),
        ];

        const { data: fallback, error: fallbackErr } = await supabase
          .from("questions")
          .select("id, content, difficulty")
          .eq("game_id", id)
          .not("id", "in", `(${usedIds.join(",")})`)
          .limit(neededFallback + 5);

        if (fallbackErr) throw fallbackErr;
        fallbackData = fallback;
      }

      // 5. Combine: pick CORE_QUESTIONS from core, STRETCH_QUESTIONS from stretch, rest from fallback
      const coreSorted = [...(coreData ?? [])].sort(
        (a, b) => Math.abs(a.difficulty - difficultyRatingUsed) - Math.abs(b.difficulty - difficultyRatingUsed)
      );
      const stretchSorted = [...(stretchData ?? [])].sort(
        (a, b) => a.difficulty - b.difficulty // Easiest stretch first
      );
      const fallbackSorted = [...(fallbackData ?? [])].sort(() => Math.random() - 0.5);

      const selectedCore = coreSorted.slice(0, CORE_QUESTIONS);
      const selectedStretch = stretchSorted.slice(0, STRETCH_QUESTIONS);
      const remaining = QUESTIONS_PER_ROUND - selectedCore.length - selectedStretch.length;
      const selectedFallback = fallbackSorted.slice(0, Math.max(0, remaining));

      const selectedRaw = [...selectedCore, ...selectedStretch, ...selectedFallback];
      console.log(`Selected: ${selectedCore.length} core, ${selectedStretch.length} stretch, ${selectedFallback.length} fallback`);

      if (selectedRaw.length === 0) {
        Alert.alert("Error", "No questions found for this game.", [
          { text: "Go Back", onPress: () => router.back() },
        ]);
        return;
      }

      // 6. Shuffle final selection for variety
      const shuffledSelection = [...selectedRaw].sort(() => Math.random() - 0.5);

      const validQuestions: QuestionData[] = [];

      for (const item of shuffledSelection) {
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

      // 4. Calculate average difficulty of selected questions
      const avgDifficulty =
        validQuestions.reduce((sum, q) => sum + q.difficulty, 0) / validQuestions.length;

      setSessionQuestions(validQuestions);
      setCurrentQuestionIndex(0);
      questionStartTimeRef.current = Date.now();

      console.log(`Starting round: difficultyRatingUsed=${difficultyRatingUsed.toFixed(2)}, avgQuestionDifficulty=${avgDifficulty.toFixed(2)}`);

      // 5. Start the session!
      startRound({
        gameId: id as string,
        avgQuestionDifficulty: avgDifficulty,
        difficultyRatingUsed,
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
