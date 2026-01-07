import { useState, useEffect, useCallback } from "react";
import { supabase } from "~/lib/supabase";
import { useAuth } from "~/contexts/AuthProvider";
import { useGames } from "~/contexts/GamesContext";
import { Database } from "~/lib/database.types";

type GameSession = Database["public"]["Tables"]["game_sessions"]["Row"];
type UserGamePerformance = Database["public"]["Tables"]["user_game_performance"]["Row"];

export interface GameStats {
  gameId: string;
  gameName: string;
  categoryId: string;
  averageScore: number | null;
  highestScore: number | null;
  gamesPlayed: number;
  currentRating: number; // Difficulty rating 1-10
}

export interface CategoryStats {
  id: string;
  name: string;
  score: number | null; // Average BPI for this category
  gamesPlayed: number;
  highestScore: number | null;
  // Progress is normalized 0-100 for UI display (based on a reasonable max BPI)
  progress: number;
  // Individual game stats within this category
  gameStats: GameStats[];
}

export interface UserStats {
  overallBPI: number | null;
  totalGamesPlayed: number;
  categoryStats: CategoryStats[];
  recentSessions: GameSession[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

// Maximum expected BPI for normalization (used for progress bars)
// Based on scoring formula: Base(100) + Difficulty(500 at level 10) + Speed bonus
const MAX_EXPECTED_BPI = 700;

// Minimum categories required for Overall BPI calculation
const MIN_CATEGORIES_FOR_OVERALL = 3;

export function useUserStats(): UserStats {
  const { user } = useAuth();
  const { games, categories } = useGames();

  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [recentSessions, setRecentSessions] = useState<GameSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch all game sessions for this user (for average BPI calculation)
      const { data: sessions, error: sessionsError } = await supabase
        .from("game_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (sessionsError) throw sessionsError;

      // Fetch per-game aggregates (for averages, highs, games played, difficulty rating)
      const { data: gamePerformance, error: perfError } = await supabase
        .from("user_game_performance")
        .select("*")
        .eq("user_id", user.id);

      if (perfError) throw perfError;

      setRecentSessions(sessions || []);

      // Build a map of game_id -> UserGamePerformance
      const performanceMap = new Map<string, UserGamePerformance>();
      (gamePerformance || []).forEach((perf) => {
        performanceMap.set(perf.game_id, perf);
      });

      // Build a map of game_id -> category_id and game_id -> game
      const gameToCategoryMap = new Map<string, string>();
      const gameMap = new Map<string, (typeof games)[0]>();
      games.forEach((game) => {
        gameMap.set(game.id, game);
        if (game.category_id) {
          gameToCategoryMap.set(game.id, game.category_id);
        }
      });

      // Calculate per-game stats from aggregates
      const allGameStats: GameStats[] = games
        .filter((game) => game.category_id)
        .map((game) => {
          const perf = performanceMap.get(game.id);

          const gamesPlayed = perf?.games_played_count ?? 0;
          const averageScore =
            perf && gamesPlayed > 0
              ? Math.round((perf.total_score || 0) / gamesPlayed)
              : null;
          const highestScore = perf?.highest_score ?? null;
          const currentRating = perf?.difficulty_rating ?? 1.0;

          return {
            gameId: game.id,
            gameName: game.name,
            categoryId: game.category_id!,
            averageScore,
            highestScore,
            gamesPlayed,
            currentRating,
          };
        });

      // Group game stats by category
      const categoryGameStatsMap = new Map<string, GameStats[]>();
      allGameStats.forEach((gs) => {
        const existing = categoryGameStatsMap.get(gs.categoryId) || [];
        existing.push(gs);
        categoryGameStatsMap.set(gs.categoryId, existing);
      });

      // Calculate stats per category
      const stats: CategoryStats[] = categories.map((category) => {
        const gameStats = categoryGameStatsMap.get(category.id) || [];
        
        // Aggregate across all games in this category
        const gamesWithScores = gameStats.filter((gs) => gs.averageScore !== null);
        const totalGamesPlayed = gameStats.reduce((sum, gs) => sum + gs.gamesPlayed, 0);

        // Category average = average of game averages (weighted equally)
        const categoryAverageScore =
          gamesWithScores.length > 0
            ? Math.round(
                gamesWithScores.reduce((sum, gs) => sum + (gs.averageScore || 0), 0) /
                  gamesWithScores.length
              )
            : null;

        // Category highest = max of all game highest scores
        const allHighestScores = gameStats
          .map((gs) => gs.highestScore)
          .filter((s): s is number => s !== null);
        const categoryHighestScore =
          allHighestScores.length > 0 ? Math.max(...allHighestScores) : null;

        // Calculate progress as percentage of max expected BPI
        const progress =
          categoryAverageScore !== null
            ? Math.min(100, Math.round((categoryAverageScore / MAX_EXPECTED_BPI) * 100))
            : 0;

        return {
          id: category.id,
          name: category.name,
          score: categoryAverageScore,
          gamesPlayed: totalGamesPlayed,
          highestScore: categoryHighestScore,
          progress,
          gameStats,
        };
      });

      setCategoryStats(stats);
    } catch (e) {
      console.error("Error fetching user stats:", e);
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, games, categories]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Calculate Overall BPI (average of category averages, if enough categories have data)
  const categoriesWithScores = categoryStats.filter((c) => c.score !== null);
  const overallBPI =
    categoriesWithScores.length >= MIN_CATEGORIES_FOR_OVERALL
      ? Math.round(
          categoriesWithScores.reduce((sum, c) => sum + (c.score || 0), 0) /
            categoriesWithScores.length
        )
      : null;

  const totalGamesPlayed = categoryStats.reduce(
    (sum, c) => sum + c.gamesPlayed,
    0
  );

  return {
    overallBPI,
    totalGamesPlayed,
    categoryStats,
    recentSessions,
    isLoading,
    error,
    refresh: fetchStats,
  };
}
