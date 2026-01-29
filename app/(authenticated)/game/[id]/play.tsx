import React, { useEffect, useState, useRef } from "react";
import { View, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "~/lib/supabase";
import { MentalArithmetic } from "~/components/games/MentalArithmetic";
import { MemoryMatrix } from "~/components/games/MemoryMatrix";
import { MentalLanguageDiscrimination } from "~/components/games/MentalLanguageDiscrimination";
import { Wordle } from "~/components/games/Wordle";
import { GameContentSchema, GameContent } from "~/lib/validators/game-content";
import { useGameSession, AnswerRecord } from "~/contexts/GameSessionContext";
import { useGames } from "~/contexts/GamesContext";
import { useAuth } from "~/contexts/AuthProvider";
import { X } from "lucide-react-native";
import { Text } from "~/components/ui/text";
import { BallSort } from "~/components/games/BallSort";
import { WordUnscramble } from "~/components/games/WordUnscramble";
import { StroopClash } from "~/components/games/StroopClash";
import { useTranslation } from "react-i18next";
import { useAnalytics } from "~/contexts/PostHogProvider";
import { MathRocket } from "~/components/games/MathRocket";

interface QuestionData {
  id?: string; // Question ID from DB (if applicable)
  content: GameContent; // Parsed content
  difficulty: number;
}

export default function GamePlayScreen() {
  const { t } = useTranslation();
  const { track } = useAnalytics();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { games, categories } = useGames();
  const insets = useSafeAreaInsets();
  const {
    state: session,
    startRound,
    recordAnswer,
    endRound,
    resetSession,
  } = useGameSession();

  // Get game and category metadata for finish screen
  const game = games.find((g) => g.id === id);
  const category = categories.find((c) => c.id === game?.category_id);

  // Constants
  const DEFAULT_DIFFICULTY = 1;

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
      // 1. Fetch questions using RPC
      console.log(`Fetching questions for game ${id} via RPC...`);

      const { data: questions, error } = await supabase.rpc(
        "get_game_questions",
        {
          p_game_id: id as string,
          p_count: undefined, // Let RPC use recommended_rounds
        },
      );

      if (error) throw error;

      if (!questions || questions.length === 0) {
        Alert.alert(t("common.error"), t("game.no_questions"), [
          { text: t("common.go_back"), onPress: () => router.back() },
        ]);
        return;
      }

      console.log(`Received ${questions.length} questions from RPC`);

      // 2. Parse and Validate Questions
      const validQuestions: QuestionData[] = [];

      for (const item of questions) {
        // RPC returns JSONB content, parsed data, difficulty, etc.
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
        Alert.alert(t("common.error"), t("game.no_questions_valid"), [
          { text: t("common.go_back"), onPress: () => router.back() },
        ]);
        return;
      }

      setSessionQuestions(validQuestions);
      setCurrentQuestionIndex(0);
      questionStartTimeRef.current = Date.now();

      // 3. Calculate metrics for the start of the round
      const avgDifficulty =
        validQuestions.reduce((sum, q) => sum + q.difficulty, 0) /
        validQuestions.length;

      // We don't have the exact user difficulty rating used by the RPC (it's internal),
      // but we can estimate it or just use the default for display purposes if needed.
      // Or we could fetch it separately if strictly required for the session record.
      // For now, let's fetch it quickly just for the session record "difficulty_rating_used"
      // to keep data consistent, even though RPC handled the logic.
      let difficultyRatingUsed = DEFAULT_DIFFICULTY;
      if (user?.id) {
        const { data: perfData } = await supabase
          .from("user_game_performance")
          .select("difficulty_rating")
          .eq("user_id", user.id)
          .eq("game_id", id)
          .maybeSingle();

        if (perfData?.difficulty_rating) {
          difficultyRatingUsed = perfData.difficulty_rating;
        }
      }

      console.log(
        `Starting round: difficultyRatingUsed=${difficultyRatingUsed}, avgQuestionDifficulty=${avgDifficulty.toFixed(
          2,
        )}`,
      );

      // 4. Start the session
      startRound({
        gameId: id as string,
        gameName: game?.name || t("common.game"),
        categoryName: category?.name,
        avgQuestionDifficulty: avgDifficulty,
        difficultyRatingUsed,
        userId: user?.id || "anonymous",
        totalQuestions: validQuestions.length,
      });

      track("retention_game_session_start", {
        game_id: id,
        game_name: game?.name ?? undefined,
        category_name: category?.name ?? undefined,
        total_questions: validQuestions.length,
        avg_question_difficulty: avgDifficulty,
        difficulty_rating_used: difficultyRatingUsed,
      });
    } catch (e) {
      console.error("Error starting round:", e);
      Alert.alert(t("common.error"), t("game.error_load"), [
        { text: t("common.go_back"), onPress: () => router.back() },
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

  const handleQuestionComplete = async (
    accuracy: number,
    userResponse?: any,
  ) => {
    const currentQuestion = sessionQuestions[currentQuestionIndex];
    const responseTimeMs = Date.now() - questionStartTimeRef.current;

    // Build full answer record
    const answer: AnswerRecord = {
      questionId: currentQuestion.id,
      accuracy, // 0.0 to 1.0
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
      // End of round - calculate and save BPI, then navigate to finish
      await endRound();
      const durationMs = session.startTime
        ? Date.now() - session.startTime
        : undefined;

      track("retention_game_session_complete", {
        game_id: id,
        game_name: game?.name ?? undefined,
        category_name: category?.name ?? undefined,
        total_questions: sessionQuestions.length,
        duration_ms: durationMs,
      });
      router.replace(`/game/${id}/finish`);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-lg font-medium text-muted-foreground">
          {t("game.preparing")}
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
      case "ball_sort":
        if (content.type !== "ball_sort") return null;
        return (
          <BallSort
            key={currentQuestionIndex}
            content={content}
            onComplete={handleQuestionComplete}
          />
        );
      case "word_unscramble":
        if (content.type !== "word_unscramble") return null;
        return (
          <WordUnscramble
            key={currentQuestionIndex}
            content={content}
            onComplete={handleQuestionComplete}
          />
        );
      case "stroop_clash":
        if (content.type !== "stroop_clash") return null;
        return (
          <StroopClash
            key={currentQuestionIndex}
            content={content}
            onComplete={handleQuestionComplete}
          />
        );
      case "math_rocket":
        if (content.type !== "math_rocket") return null;
        return (
          <MathRocket
            key={currentQuestionIndex}
            content={content}
            onComplete={handleQuestionComplete}
          />
        );
      default:
        return (
          <View className="flex-1 items-center justify-center">
            <Text>
              {t("game.not_implemented")} {id}
            </Text>
          </View>
        );
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Game Content - Full Screen */}
      <View className="absolute inset-0">{renderGame()}</View>

      {/* Header Row - Absolute overlay on top */}
      <View
        className="absolute left-0 right-0 flex-row items-center justify-between px-6 z-20"
        style={{ top: insets.top + 12 }}
        pointerEvents="box-none"
      >
        {/* Close Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-12 h-12 rounded-full bg-black/40 items-center justify-center"
        >
          <X color="white" size={24} />
        </TouchableOpacity>

        {/* Right Side: Score Preview + Progress */}
        <View className="flex-row items-center gap-3">
          {/* Score Preview (during play) */}
          {session.isPlaying && session.correctCount > 0 && (
            <View className="bg-green-600/80 px-3 py-2 rounded-full">
              <Text className="text-white font-bold">
                ✓ {Math.round(session.correctCount)}
              </Text>
            </View>
          )}

          {/* Progress Indicator */}
          <View className="bg-black/40 px-4 py-2 rounded-full">
            <Text className="text-white font-bold">
              {currentQuestionIndex + 1} / {sessionQuestions.length}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
