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
  difficulty: number;
  userId: string;
  totalQuestions: number;
  metadata?: Json;
}

/**
 * Manages a game round session (multiple questions).
 * - Tracks start time, correct answers, and calculates BPI at the end.
 * - Saves session to database when round completes.
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

  /**
   * Starts a new round session
   */
  const startRound = useCallback((config: RoundSessionConfig) => {
    configRef.current = config;

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
   * Records a question result (called after each question)
   */
  const recordAnswer = useCallback((isCorrect: boolean) => {
    setState((prev) => ({
      ...prev,
      correctCount: prev.correctCount + (isCorrect ? 1 : 0),
    }));
  }, []);

  /**
   * Ends the round, calculates BPI, and saves to DB
   */
  const endRound = useCallback(async () => {
    if (!configRef.current || !state.startTime) return null;

    const endTime = Date.now();
    const durationMs = endTime - state.startTime;
    const { difficulty, metadata, userId, gameId, totalQuestions } = configRef.current;
    const { correctCount } = state;

    // Calculate accuracy
    const accuracy = totalQuestions > 0 ? correctCount / totalQuestions : 0;

    // Calculate BPI
    // Using a reasonable target time based on difficulty (e.g., 10s per question at difficulty 1)
    const targetTimeMs = totalQuestions * 10000 * (1 / difficulty);
    
    const bpi = calculateBPI({
      accuracy,
      difficulty,
      targetTimeMs,
      actualTimeMs: durationMs,
    });

    setState((prev) => ({
      ...prev,
      isPlaying: false,
      isFinished: true,
      score: bpi,
      durationMs,
    }));

    // Save to database
    try {
      const { error } = await supabase.from('game_sessions').insert({
        user_id: userId,
        game_id: gameId,
        difficulty_level: difficulty,
        score: bpi,
        duration_seconds: Math.round(durationMs / 1000),
        correct_count: correctCount,
        total_questions: totalQuestions,
        metadata: metadata || null,
      });

      if (error) throw error;
      console.log('Session saved with BPI:', bpi);
    } catch (err) {
      console.error('Failed to save game session:', err);
    }

    return bpi;
  }, [state.startTime, state.correctCount]);

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
  }, []);

  return {
    state,
    startRound,
    recordAnswer,
    endRound,
    resetSession,
  };
}
