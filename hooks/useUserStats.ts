import { useState, useEffect, useCallback } from "react";
import { supabase } from "~/lib/supabase";
import { useAuth } from "~/contexts/AuthProvider";
import { useGames } from "~/contexts/GamesContext";
import { Database } from "~/lib/database.types";

type GameSession = Database["public"]["Tables"]["game_sessions"]["Row"];
type UserGamePerformance = Database["public"]["Tables"]["user_game_performance"]["Row"];
type UserGamePercentile = Database["public"]["Tables"]["user_game_percentiles"]["Row"];
type UserCategoryScore = Database["public"]["Tables"]["user_category_scores"]["Row"];
type UserGameScoreHistory = Database["public"]["Tables"]["user_game_score_history"]["Row"];


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

export interface ScoreHistoryPoint {
  date: string;
  score: number;
}

export interface UserStats {
  overallBPI: number | null;
  totalGamesPlayed: number;
  categoryStats: CategoryStats[];
  recentSessions: GameSession[];
  overallScoreHistory: ScoreHistoryPoint[];
  categoryScoreHistory: Record<string, ScoreHistoryPoint[]>;
  gameScoreHistory: Record<string, ScoreHistoryPoint[]>;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}


const MAX_EXPECTED_BPI = 2000;



// Minimum categories required for Overall BPI calculation
const MIN_CATEGORIES_FOR_OVERALL = 3;

export function useUserStats(): UserStats {
  const { user } = useAuth();
  const { games, categories } = useGames();

  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [recentSessions, setRecentSessions] = useState<GameSession[]>([]);
  const [globalScore, setGlobalScore] = useState<number | null>(null);
  const [overallScoreHistory, setOverallScoreHistory] = useState<ScoreHistoryPoint[]>([]);
  const [categoryScoreHistory, setCategoryScoreHistory] = useState<Record<string, ScoreHistoryPoint[]>>({});
  const [gameScoreHistory, setGameScoreHistory] = useState<Record<string, ScoreHistoryPoint[]>>({});
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

      const historyStart = new Date();
      historyStart.setDate(historyStart.getDate() - 30);
      const historyStartDate = historyStart.toISOString().slice(0, 10);

      const [

        { data: sessions, error: sessionsError },
        { data: gamePerformance, error: perfError },
        { data: gamePercentiles, error: percentilesError },
        { data: categoryScores, error: categoryScoresError },
        { data: globalScoreRow, error: globalScoreError },
        { data: scoreHistory, error: scoreHistoryError },
      ] = await Promise.all([
        supabase
          .from("game_sessions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("user_game_performance")
          .select("*")
          .eq("user_id", user.id),
        supabase
          .from("user_game_percentiles")
          .select("*")
          .eq("user_id", user.id),
        supabase
          .from("user_category_scores")
          .select("*")
          .eq("user_id", user.id),
        supabase
          .from("user_global_scores")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("user_game_score_history")
          .select("game_id, display_score, snapshot_date")
          .eq("user_id", user.id)
          .gte("snapshot_date", historyStartDate)
          .order("snapshot_date", { ascending: true }),
      ]);

      if (sessionsError) throw sessionsError;
      if (perfError) throw perfError;
      if (percentilesError) throw percentilesError;
      if (categoryScoresError) throw categoryScoresError;
      if (globalScoreError) throw globalScoreError;
      if (scoreHistoryError) throw scoreHistoryError;


      setRecentSessions(sessions || []);
      setGlobalScore(globalScoreRow?.display_score ?? null);


      // Build a map of game_id -> UserGamePerformance
      const performanceMap = new Map<string, UserGamePerformance>();
      (gamePerformance || []).forEach((perf) => {
        performanceMap.set(perf.game_id, perf);
      });

      const percentileMap = new Map<string, UserGamePercentile>();
      (gamePercentiles || []).forEach((percentile) => {
        percentileMap.set(percentile.game_id, percentile);
      });

      const categoryScoreMap = new Map<string, UserCategoryScore>();
      (categoryScores || []).forEach((score) => {
        categoryScoreMap.set(score.category_id, score);
      });

      const gameCategoryMap = new Map<string, string>();
      games.forEach((game) => {
        if (game.category_id) {
          gameCategoryMap.set(game.id, game.category_id);
        }
      });

      const historyRows = (scoreHistory || []) as {
        game_id: string;
        display_score: number;
        snapshot_date: string;
      }[];
      const gameHistory: Record<string, ScoreHistoryPoint[]> = {};
      const categoryDateMap = new Map<string, Map<string, { sum: number; count: number }>>();

      historyRows.forEach((row) => {
        const date = row.snapshot_date;
        if (!date) return;
        const gameId = row.game_id;
        const gamePoints = gameHistory[gameId] || [];
        gamePoints.push({ date, score: row.display_score });
        gameHistory[gameId] = gamePoints;

        const categoryId = gameCategoryMap.get(gameId);
        if (!categoryId) return;
        const dateMap = categoryDateMap.get(categoryId) || new Map<string, { sum: number; count: number }>();
        const agg = dateMap.get(date) || { sum: 0, count: 0 };
        agg.sum += row.display_score;
        agg.count += 1;
        dateMap.set(date, agg);
        categoryDateMap.set(categoryId, dateMap);
      });

      const categoryHistory: Record<string, ScoreHistoryPoint[]> = {};
      categoryDateMap.forEach((dateMap, categoryId) => {
        const points = Array.from(dateMap.entries()).map(([date, agg]) => ({
          date,
          score: Math.round(agg.sum / agg.count),
        }));
        points.sort((a, b) => a.date.localeCompare(b.date));
        categoryHistory[categoryId] = points;
      });

      const overallDateMap = new Map<string, { sum: number; count: number }>();
      Object.values(categoryHistory).forEach((points) => {
        points.forEach((point) => {
          const agg = overallDateMap.get(point.date) || { sum: 0, count: 0 };
          agg.sum += point.score;
          agg.count += 1;
          overallDateMap.set(point.date, agg);
        });
      });

      const overallHistory = Array.from(overallDateMap.entries())
        .map(([date, agg]) => ({ date, score: Math.round(agg.sum / agg.count) }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setGameScoreHistory(gameHistory);
      setCategoryScoreHistory(categoryHistory);
      setOverallScoreHistory(overallHistory);

      // Calculate per-game stats from aggregates

      const allGameStats: GameStats[] = games
        .filter((game) => game.category_id)
        .map((game) => {
          const perf = performanceMap.get(game.id);

          const gamesPlayed = perf?.games_played_count ?? 0;
          const percentile = percentileMap.get(game.id);
          const averageScore = percentile?.display_score ?? null;
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
        const totalGamesPlayed = gameStats.reduce((sum, gs) => sum + gs.gamesPlayed, 0);
        const categoryAverageScore = categoryScoreMap.get(category.id)?.display_score ?? null;


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

  const categoriesWithScores = categoryStats.filter((c) => c.score !== null);
  const overallBPI =
    globalScore ??
    (categoriesWithScores.length >= MIN_CATEGORIES_FOR_OVERALL
      ? Math.round(
          categoriesWithScores.reduce((sum, c) => sum + (c.score ?? 0), 0) /
            categoriesWithScores.length
        )
      : null);


  const totalGamesPlayed = categoryStats.reduce(
    (sum, c) => sum + c.gamesPlayed,
    0
  );

  return {
    overallBPI,
    totalGamesPlayed,
    categoryStats,
    recentSessions,
    overallScoreHistory,
    categoryScoreHistory,
    gameScoreHistory,
    isLoading,
    error,
    refresh: fetchStats,
  };

}
