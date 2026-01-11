import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
} from "react";
import { supabase } from "~/lib/supabase";
import { calculateBPI } from "~/lib/scoring";
import { Database, Json } from "~/lib/database.types";


// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RoundSessionState {
  isPlaying: boolean;
  isFinished: boolean;
  score: number | null;
  startTime: number | null;
  durationMs: number;
  correctCount: number;
  totalQuestions: number;
}

export interface RoundSessionConfig {
  gameId: string;
  gameName?: string; // Display name for finish screen
  categoryName?: string; // Category name for finish screen
  avgQuestionDifficulty: number;
  difficultyRatingUsed: number;
  userId: string;
  totalQuestions: number;
  metadata?: Json;
}

export interface AnswerRecord {
  questionId?: string;
  accuracy: number; // 0.0 to 1.0
  responseTimeMs: number;
  userResponse?: Json;
  generatedContent?: Json;
}

interface GameSessionContextType {
  // State
  state: RoundSessionState;
  config: RoundSessionConfig | null;
  answers: AnswerRecord[];

  // Actions
  setGameMetadata: (
    gameId: string,
    gameName: string,
    categoryName?: string
  ) => void;
  startRound: (config: RoundSessionConfig) => void;
  recordAnswer: (answer: AnswerRecord) => void;
  endRound: () => Promise<number | null>;
  resetSession: () => void;
}

const initialState: RoundSessionState = {
  isPlaying: false,
  isFinished: false,
  score: null,
  startTime: null,
  durationMs: 0,
  correctCount: 0,
  totalQuestions: 0,
};

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const GameSessionContext = createContext<GameSessionContextType | undefined>(
  undefined
);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function GameSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<RoundSessionState>(initialState);
  const [config, setConfig] = useState<RoundSessionConfig | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);

  // Use ref for config during endRound to avoid stale closure issues
  const configRef = useRef<RoundSessionConfig | null>(null);

  /**
   * Set game metadata (called from index.tsx for display on finish screen)
   */
  const setGameMetadata = useCallback(
    (gameId: string, gameName: string, categoryName?: string) => {
      setConfig((prev) => ({
        ...(prev || {
          gameId,
          avgQuestionDifficulty: 1,
          difficultyRatingUsed: 1,
          userId: "",
          totalQuestions: 0,
        }),
        gameId,
        gameName,
        categoryName,
      }));
    },
    []
  );

  /**
   * Starts a new round session
   */
  const startRound = useCallback((newConfig: RoundSessionConfig) => {
    configRef.current = newConfig;
    setConfig(newConfig);
    setAnswers([]);

    setState({
      isPlaying: true,
      isFinished: false,
      score: null,
      startTime: Date.now(),
      durationMs: 0,
      correctCount: 0,
      totalQuestions: newConfig.totalQuestions,
    });
  }, []);

  /**
   * Records a question result
   */
  const recordAnswer = useCallback((answer: AnswerRecord) => {
    setAnswers((prev) => [...prev, answer]);

    setState((prev) => ({
      ...prev,
      correctCount: prev.correctCount + (answer.accuracy === 1.0 ? 1 : 0),
    }));
  }, []);

  /**
   * Ends the round, calculates BPI, and saves to DB
   */
  const endRound = useCallback(async () => {
    const currentConfig = configRef.current;
    if (!currentConfig || !state.startTime) return null;

    const endTime = Date.now();
    const durationMs = endTime - state.startTime;
    const {
      avgQuestionDifficulty,
      difficultyRatingUsed,
      metadata,
      userId,
      gameId,
      totalQuestions,
    } = currentConfig;

    // Get current answers from ref to avoid stale state
    const currentAnswers = answers;
    const correctCount = currentAnswers.filter(
      (a) => a.accuracy === 1.0
    ).length;

    // Clamp difficulty values
    const avgQDifficulty = Math.max(0, Math.min(10, avgQuestionDifficulty));
    const targetRating = Math.max(0, Math.min(10, difficultyRatingUsed));

    // Calculate overall accuracy
    const accuracy =
      currentAnswers.length > 0
        ? currentAnswers.reduce((sum, a) => sum + a.accuracy, 0) /
          currentAnswers.length
        : 0;

    // Per-game target times (ms per question)
    const targetPerQuestionMsByGame: Record<string, number | null> = {
      mental_arithmetic: 6000,
      mental_language_discrimination: 9000,
      memory_matrix: null,
      wordle: null,
    };

    const targetPerQ = targetPerQuestionMsByGame[gameId] ?? null;

    // Calculate average response time per question
    const avgResponseTimeMs =
      currentAnswers.length > 0
        ? Math.round(
            currentAnswers.reduce((sum, a) => sum + a.responseTimeMs, 0) /
              currentAnswers.length
          )
        : null;

    const bpi = calculateBPI({
      accuracy,
      difficulty: avgQDifficulty,
      ...(targetPerQ && avgResponseTimeMs !== null
        ? {
            targetTimeMs: targetPerQ,
            actualTimeMs: avgResponseTimeMs,
          }
        : {}),
    });

    setState((prev) => ({
      ...prev,
      isPlaying: false,
      isFinished: true,
      score: bpi,
      durationMs,
      correctCount,
    }));

    // Save to database
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from("game_sessions")
        .insert({
          user_id: userId,
          game_id: gameId,
          difficulty_rating_used: targetRating,
          avg_question_difficulty: avgQDifficulty,
          avg_response_time_ms: avgResponseTimeMs,
          score: bpi,
          duration_seconds: Math.round(durationMs / 1000),
          correct_count: correctCount,
          total_questions: totalQuestions,
          metadata: metadata ?? null,
        })
        .select("id")
        .single();

      if (sessionError) throw sessionError;

      const sessionId = sessionData.id;
      console.log("Session saved with BPI:", bpi, "ID:", sessionId);

      // Insert all game_answers
      if (currentAnswers.length > 0) {
        const answerRows = currentAnswers.map((answer) => ({
          session_id: sessionId,
          question_id: answer.questionId || null,
          accuracy: answer.accuracy,
          response_time_ms: answer.responseTimeMs,
          user_response: answer.userResponse || null,
          generated_content: answer.generatedContent || null,
        }));

        const { error: answersError } = await supabase
          .from("game_answers")
          .insert(answerRows);

        if (answersError) throw answersError;

        console.log("Saved", currentAnswers.length, "answers to game_answers");
      }

      const { error: refreshError } = await supabase.rpc(
        "refresh_ability_scores" as keyof Database["public"]["Functions"]
      );
      if (refreshError) {
        console.error("Failed to refresh ability scores:", refreshError);
      }
    } catch (err) {
      console.error("Failed to save game session:", err);
    }

    return bpi;
  }, [state.startTime, answers]);

  /**
   * Resets the session for a new round
   */
  const resetSession = useCallback(() => {
    setState(initialState);
    setConfig(null);
    setAnswers([]);
    configRef.current = null;
  }, []);

  return (
    <GameSessionContext.Provider
      value={{
        state,
        config,
        answers,
        setGameMetadata,
        startRound,
        recordAnswer,
        endRound,
        resetSession,
      }}
    >
      {children}
    </GameSessionContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useGameSession() {
  const context = useContext(GameSessionContext);
  if (context === undefined) {
    throw new Error("useGameSession must be used within a GameSessionProvider");
  }
  return context;
}
