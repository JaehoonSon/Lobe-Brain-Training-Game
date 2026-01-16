import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { supabase } from "~/lib/supabase";
import { useAuth } from "~/contexts/AuthProvider";
import { useGames } from "~/contexts/GamesContext";
import { Database } from "~/lib/database.types";

type GameSession = Database["public"]["Tables"]["game_sessions"]["Row"];
type UserGamePerformance =
  Database["public"]["Tables"]["user_game_performance"]["Row"];
type UserGameAbilityScore =
  Database["public"]["Tables"]["user_game_ability_scores"]["Row"];
type UserCategoryAbilityScore =
  Database["public"]["Tables"]["user_category_ability_scores"]["Row"];
type UserGameAbilityHistory =
  Database["public"]["Tables"]["user_game_ability_history"]["Row"];

type UserCategoryAbilityHistory =
  Database["public"]["Tables"]["user_category_ability_history"]["Row"];

type UserGlobalAbilityHistory =
  Database["public"]["Tables"]["user_global_ability_history"]["Row"];



export interface GameStats {
  gameId: string;
  gameName: string;
  categoryId: string;
  averageScore: number | null;
  percentile: number | null;
  highestScore: number | null;
  gamesPlayed: number;
  currentRating: number; // Difficulty rating 1-10

}

export interface GlobalStats {
  gameId: string;
  averageScore: number;
  averageDifficulty: number;
  averageGamesPlayed: number;
  averageHighestScore: number;
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

export interface UserStatsContextValue {
  overallBPI: number | null;
  overallPercentile: number | null;
  currentStreak: number;
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

const UserStatsContext = createContext<UserStatsContextValue | null>(null);

export function UserStatsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { games, categories } = useGames();

  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [recentSessions, setRecentSessions] = useState<GameSession[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
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
        { data: gameAbilityScores, error: percentilesError },
        { data: categoryAbilityScores, error: categoryAbilityScoresError },
        { data: globalScoreRow, error: globalScoreError },
        { data: gameAbilityHistory, error: gameHistoryError },
        { data: categoryAbilityHistory, error: categoryHistoryError },
        { data: globalAbilityHistory, error: globalHistoryError },
        { data: streakData, error: streakError },
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
          .from("user_game_ability_scores")
          .select("*")
          .eq("user_id", user.id),
        supabase
          .from("user_category_ability_scores")
          .select("*")
          .eq("user_id", user.id),
        supabase
          .from("user_global_ability_scores")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("user_game_ability_history")
          .select("game_id, ability_score, snapshot_date")
          .eq("user_id", user.id)
          .gte("snapshot_date", historyStartDate)
          .order("snapshot_date", { ascending: true }),
        supabase
          .from("user_category_ability_history")
          .select("category_id, ability_score, snapshot_date")
          .eq("user_id", user.id)
          .gte("snapshot_date", historyStartDate)
          .order("snapshot_date", { ascending: true }),
        supabase
          .from("user_global_ability_history")
          .select("ability_score, snapshot_date")
          .eq("user_id", user.id)
          .gte("snapshot_date", historyStartDate)
          .order("snapshot_date", { ascending: true }),
        supabase
          .from("user_streaks")
          .select("current_streak")
          .eq("user_id", user.id)
          .single(),
      ]);


      if (sessionsError) throw sessionsError;
      if (perfError) throw perfError;
      if (percentilesError) throw percentilesError;
      if (categoryAbilityScoresError) throw categoryAbilityScoresError;
      if (globalScoreError) throw globalScoreError;
      if (gameHistoryError) throw gameHistoryError;
      if (categoryHistoryError) throw categoryHistoryError;
      if (globalHistoryError) throw globalHistoryError;
      if (streakError && streakError.code !== "PGRST116") {

        throw streakError;
      }

      setRecentSessions(sessions || []);
      setCurrentStreak(streakData?.current_streak ?? 0);
      setGlobalScore(globalScoreRow?.ability_score ?? null);

      const performanceMap = new Map<string, UserGamePerformance>();

      (gamePerformance || []).forEach((perf) => {
        performanceMap.set(perf.game_id, perf);
      });

      const abilityScoreMap = new Map<string, UserGameAbilityScore>();

      (gameAbilityScores || []).forEach((abilityScore) => {
        abilityScoreMap.set(abilityScore.game_id, abilityScore);
      });

      const categoryAbilityScoreMap = new Map<string, UserCategoryAbilityScore>();
      (categoryAbilityScores || []).forEach((score) => {
        categoryAbilityScoreMap.set(score.category_id, score);
      });

      const gameHistoryRows = (gameAbilityHistory || []) as UserGameAbilityHistory[];
      const categoryHistoryRows =
        (categoryAbilityHistory || []) as UserCategoryAbilityHistory[];
      const globalHistoryRows =
        (globalAbilityHistory || []) as UserGlobalAbilityHistory[];

      const gameHistory: Record<string, ScoreHistoryPoint[]> = {};
      gameHistoryRows.forEach((row) => {
        const date = row.snapshot_date;
        if (!date) return;
        const gameId = row.game_id;
        const gamePoints = gameHistory[gameId] || [];
        gamePoints.push({ date, score: row.ability_score });
        gameHistory[gameId] = gamePoints;
      });

      Object.values(gameHistory).forEach((points) => {
        points.sort((a, b) => a.date.localeCompare(b.date));
      });

      const categoryHistory: Record<string, ScoreHistoryPoint[]> = {};
      categoryHistoryRows.forEach((row) => {
        const date = row.snapshot_date;
        if (!date) return;
        const categoryId = row.category_id;
        const points = categoryHistory[categoryId] || [];
        points.push({ date, score: row.ability_score });
        categoryHistory[categoryId] = points;
      });

      Object.values(categoryHistory).forEach((points) => {
        points.sort((a, b) => a.date.localeCompare(b.date));
      });

      const overallHistory = globalHistoryRows
        .filter((row) => row.snapshot_date)
        .map((row) => ({
          date: row.snapshot_date as string,
          score: row.ability_score,
        }))
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
          const abilityScore = abilityScoreMap.get(game.id);
          const averageScore = abilityScore?.ability_score ?? null;
          const percentile = abilityScore?.percentile ?? null;
          const highestScore = perf?.highest_score ?? null;
          const currentRating = perf?.difficulty_rating ?? 1.0;


          return {
            gameId: game.id,
            gameName: game.name,
            categoryId: game.category_id!,
            averageScore,
            percentile,
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

        const totalGamesPlayed = gameStats.reduce(
          (sum, gs) => sum + gs.gamesPlayed,
          0
        );
        const categoryAverageScore =
          categoryAbilityScoreMap.get(category.id)?.ability_score ?? null;



        // Category highest = max of all game highest scores
        const allHighestScores = gameStats
          .map((gs) => gs.highestScore)
          .filter((s): s is number => s !== null);
        const categoryHighestScore =
          allHighestScores.length > 0 ? Math.max(...allHighestScores) : null;

        // Calculate progress as percentage of max expected BPI
        const progress =
          categoryAverageScore !== null
            ? Math.min(
              100,
              Math.round((categoryAverageScore / MAX_EXPECTED_BPI) * 100)
            )
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

  const overallPercentile: number | null = null;

  const value = useMemo<UserStatsContextValue>(
    () => ({
      overallBPI,
      overallPercentile,
      currentStreak,
      totalGamesPlayed,
      categoryStats,
      recentSessions,
      overallScoreHistory,
      categoryScoreHistory,
      gameScoreHistory,
      isLoading,
      error,
      refresh: fetchStats,
    }),
    [
      overallBPI,
      overallPercentile,
      currentStreak,
      totalGamesPlayed,
      categoryStats,
      recentSessions,
      overallScoreHistory,
      categoryScoreHistory,
      gameScoreHistory,
      isLoading,
      error,
      fetchStats,
    ]

  );

  return (
    <UserStatsContext.Provider value={value}>
      {children}
    </UserStatsContext.Provider>
  );
}

export function useUserStats(): UserStatsContextValue {
  const context = useContext(UserStatsContext);
  if (!context) {
    throw new Error("useUserStats must be used within a UserStatsProvider");
  }
  return context;
}

// Re-export types for backward compatibility
export type {
  GameStats as GameStatsType,
  CategoryStats as CategoryStatsType,
};

