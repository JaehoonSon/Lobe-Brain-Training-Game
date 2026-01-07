import { useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { calculateBPI } from '../lib/scoring';
import { GeneratedContent } from '../lib/generators/types';
import { Json } from '../lib/database.types';

export interface GameSessionState {
  isPlaying: boolean;
  isFinished: boolean;
  score: number | null;
  startTime: number | null;
  durationMs: number;
}

export interface GameSessionConfig {
  gameId: string;
  difficulty: number;
  userId: string;
  // Metadata for the session (Daily Challenge, etc.)
  metadata?: Json; 
}

export function useGameSession() {
  const [state, setState] = useState<GameSessionState>({
    isPlaying: false,
    isFinished: false,
    score: null,
    startTime: null,
    durationMs: 0,
  });

  // Refs for items that don't need to trigger re-renders instantly
  const configRef = useRef<GameSessionConfig | null>(null);
  const contentRef = useRef<GeneratedContent | null>(null);

  /**
   * Starts a new game session.
   * @param config - Context about the game (ID, User, Difficulty)
   * @param content - The generated content (grid, targets, etc.)
   */
  const startGame = useCallback(
    (config: GameSessionConfig, content: GeneratedContent) => {
      configRef.current = config;
      contentRef.current = content;

      setState({
        isPlaying: true,
        isFinished: false,
        score: null,
        startTime: Date.now(),
        durationMs: 0,
      });
    },
    []
  );

  /**
   * Ends the game, calculates BPI, and saves to DB.
   * @param accuracy - 0.0 to 1.0 (Percentage of correct items)
   * @param details - JSON blob of the user's specific moves (for replay)
   */
  const endGame = useCallback(
    async (accuracy: number, details: any) => {
      if (!configRef.current || !contentRef.current || !state.startTime) return;

      const endTime = Date.now();
      const durationMs = endTime - state.startTime;
      const { difficulty, metadata, userId, gameId } = configRef.current;
      const { targetTimeMs } = contentRef.current;

      // 1. Calculate BPI (Client-Side Referee)
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

      // 2. Sync to Database (The Scribe)
      try {
        const { error } = await supabase.from('game_sessions').insert({
          user_id: userId,
          game_id: gameId,
          difficulty_level: difficulty,
          score: bpi,
          duration_seconds: Math.round(durationMs / 1000),
          correct_count: Math.round(accuracy * 100), // Approximate for now
          total_questions: 1, // Single round for procedural games
          metadata: metadata || null,
        });

        if (error) throw error;

        // 3. Save Detailed Answer (The "Black Box" Log)
        await supabase.from('game_answers').insert({
          session_id: undefined, // Note: We need the ID from the previous insert. Supabase returns it if valid.
          is_correct: accuracy > 0.99, 
          question_id: null,
          user_response: details,
          generated_content: contentRef.current, // Store the "Instance"
          response_time_ms: durationMs,
        });

      } catch (err) {
        console.error('Failed to save game session:', err);
        // Queue for offline sync? (Future feature)
      }
    },
    [state.startTime]
  );

  return {
    state,
    startGame,
    endGame,
  };
}
