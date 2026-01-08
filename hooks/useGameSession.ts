import { useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { calculateBPI } from '../lib/scoring';
import { Json } from '../lib/database.types';

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
  avgQuestionDifficulty: number; // Average difficulty (0-10) of questions served
  difficultyRatingUsed: number;  // User's target rating at session start (from user_game_performance)
  userId: string;
  totalQuestions: number;
  metadata?: Json;
}

export interface AnswerRecord {
  questionId?: string;       // From questions table (nullable for procedural games)
  accuracy: number;          // 0.0 to 1.0 (e.g., 0.8 for 4/5 correct)
  responseTimeMs: number;
  userResponse?: Json;       // What user clicked/typed
  generatedContent?: Json;   // For procedural games (e.g., which tiles were shown)
}

/**
 * Manages a game round session (multiple questions).
 * - Tracks start time, correct answers, and calculates BPI at the end.
 * - Saves session and individual answers to database when round completes.
 */
export function useGameSession() {
  const [state, setState] = useState<RoundSessionState>({
    isPlaying: false,
    isFinished: false,
    score: null,
    startTime: null,
    durationMs: 0,
    correctCount: 0,
    totalQuestions: 0,
  });

  const configRef = useRef<RoundSessionConfig | null>(null);
  const answersRef = useRef<AnswerRecord[]>([]);

  /**
   * Starts a new round session
   */
  const startRound = useCallback((config: RoundSessionConfig) => {
    configRef.current = config;
    answersRef.current = [];

    setState({
      isPlaying: true,
      isFinished: false,
      score: null,
      startTime: Date.now(),
      durationMs: 0,
      correctCount: 0,
      totalQuestions: config.totalQuestions,
    });
  }, []);

  /**
   * Records a question result with full details
   */
  const recordAnswer = useCallback((answer: AnswerRecord) => {
    answersRef.current.push(answer);
    
    setState((prev) => ({
      ...prev,
      // Count as "correct" if accuracy is 1.0 (perfect)
      correctCount: prev.correctCount + (answer.accuracy === 1.0 ? 1 : 0),
    }));
  }, []);

  /**
   * Ends the round, calculates BPI, and saves session + answers to DB
   */
  const endRound = useCallback(async () => {
    if (!configRef.current || !state.startTime) return null;

    const endTime = Date.now();
    const durationMs = endTime - state.startTime;
    const { avgQuestionDifficulty, difficultyRatingUsed, metadata, userId, gameId, totalQuestions } = configRef.current;
    const answers = answersRef.current;
    const correctCount = answers.filter(a => a.accuracy === 1.0).length;

    // Clamp difficulty values to 0-10 for safety
    const avgQDifficulty = Math.max(0, Math.min(10, avgQuestionDifficulty));
    const targetRating = Math.max(0, Math.min(10, difficultyRatingUsed));

    // Calculate overall accuracy as average of individual accuracies
    const accuracy = answers.length > 0 
      ? answers.reduce((sum, a) => sum + a.accuracy, 0) / answers.length 
      : 0;

    // Per-game target times (ms per question) - null means no speed scoring for this game
    const targetPerQuestionMsByGame: Record<string, number | null> = {
      mental_arithmetic: 6000,
      mental_language_discrimination: 9000,
      memory_matrix: null,  // Speed not applicable
      wordle: null,         // Speed not applicable
    };
    
    const targetPerQ = targetPerQuestionMsByGame[gameId] ?? null;
    
    // Calculate average response time per question
    const avgResponseTimeMs = answers.length > 0
      ? Math.round(answers.reduce((sum, a) => sum + a.responseTimeMs, 0) / answers.length)
      : null;
    
    const bpi = calculateBPI({
      accuracy,
      difficulty: avgQDifficulty,
      // Only pass speed inputs if this game uses speed scoring
      ...(targetPerQ && avgResponseTimeMs !== null ? {
        targetTimeMs: targetPerQ,
        actualTimeMs: avgResponseTimeMs,
      } : {}),
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
      // 1. Insert game_sessions and get back the session_id
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .insert({
          user_id: userId,
          game_id: gameId,
          difficulty_rating_used: targetRating,      // User's target rating at session start
          avg_question_difficulty: avgQDifficulty,   // Average difficulty of served questions
          avg_response_time_ms: avgResponseTimeMs,   // Average per-question response time (null for non-speed games)
          score: bpi,
          duration_seconds: Math.round(durationMs / 1000),
          correct_count: correctCount,
          total_questions: totalQuestions,
          metadata: metadata ?? null,
        })
        .select('id')
        .single();

      if (sessionError) throw sessionError;

      const sessionId = sessionData.id;
      console.log('Session saved with BPI:', bpi, 'ID:', sessionId);

      // 2. Insert all game_answers linked to this session
      if (answers.length > 0) {
        const answerRows = answers.map((answer) => ({
          session_id: sessionId,
          question_id: answer.questionId || null,
          accuracy: answer.accuracy,
          response_time_ms: answer.responseTimeMs,
          user_response: answer.userResponse || null,
          generated_content: answer.generatedContent || null,
        }));

        const { error: answersError } = await supabase
          .from('game_answers')
          .insert(answerRows);

        if (answersError) throw answersError;

        console.log('Saved', answers.length, 'answers to game_answers');
      }

    } catch (err) {
      console.error('Failed to save game session:', err);
    }

    return bpi;
  }, [state.startTime]);

  /**
   * Resets the session for a new round
   */
  const resetSession = useCallback(() => {
    setState({
      isPlaying: false,
      isFinished: false,
      score: null,
      startTime: null,
      durationMs: 0,
      correctCount: 0,
      totalQuestions: 0,
    });
    configRef.current = null;
    answersRef.current = [];
  }, []);

  return {
    state,
    startRound,
    recordAnswer,
    endRound,
    resetSession,
  };
}
