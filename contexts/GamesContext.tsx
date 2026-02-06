import React, { createContext, useContext, useEffect, useState } from "react";
import {
  buildTranslationMap,
  fetchContentTranslations,
  resolveTranslation,
} from "~/lib/content-translations";
import { Database } from "~/lib/database.types";
import i18n from "~/lib/i18n";
import { normalizeLocale } from "~/lib/locale";
import { supabase } from "~/lib/supabase";

type Game = Database["public"]["Tables"]["games"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

interface GamesContextType {
  games: Game[];
  categories: Category[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  getGamesByCategory: (categoryId: string) => Game[];
  getDailyWorkout: (userId: string, count?: number) => Game[];
  dailyCompletedGameIds: string[];
  refreshDailyProgress: () => Promise<void>;
}

const GamesContext = createContext<GamesContextType | undefined>(undefined);

export function GamesProvider({ children }: { children: React.ReactNode }) {
  const [games, setGames] = useState<Game[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dailyCompletedGameIds, setDailyCompletedGameIds] = useState<string[]>(
    [],
  );
  const [locale, setLocale] = useState(() => normalizeLocale(i18n.language));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDailyProgress = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today

      const { data: sessions, error: sessionsError } = await supabase
        .from("game_sessions")
        .select("game_id")
        .gte("created_at", today.toISOString());

      if (sessionsError) throw sessionsError;

      if (sessions) {
        // distinct game IDs
        const uniqueGameIds = Array.from(
          new Set(sessions.map((s) => s.game_id).filter(Boolean) as string[]),
        );
        setDailyCompletedGameIds(uniqueGameIds);
      }
    } catch (e) {
      console.error("Error fetching daily progress:", e);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [gamesResult, categoriesResult] = await Promise.all([
        supabase.from("games").select("*").eq("is_active", true),
        supabase.from("categories").select("*"),
      ]);

      if (gamesResult.error) throw gamesResult.error;
      if (categoriesResult.error) throw categoriesResult.error;

      const activeGames = gamesResult.data || [];
      const allCategories = categoriesResult.data || [];

      const gameIds = activeGames.map((game) => game.id);
      const categoryIds = allCategories.map((category) => category.id);

      const [gameTranslations, categoryTranslations] = await Promise.all([
        fetchContentTranslations(
          "game",
          gameIds,
          ["name", "description", "instructions"],
          locale,
        ),
        fetchContentTranslations(
          "category",
          categoryIds,
          ["name", "description"],
          locale,
        ),
      ]);

      const gameTranslationMap = buildTranslationMap(gameTranslations);
      const categoryTranslationMap = buildTranslationMap(categoryTranslations);

      const localizedGames = activeGames.map((game) => ({
        ...game,
        name: resolveTranslation(
          gameTranslationMap,
          game.id,
          "name",
          game.name,
        ),
        description: resolveTranslation(
          gameTranslationMap,
          game.id,
          "description",
          game.description,
        ),
        instructions: resolveTranslation(
          gameTranslationMap,
          game.id,
          "instructions",
          game.instructions,
        ),
      }));

      setGames(localizedGames);

      const categoriesWithGames = allCategories.filter((category) =>
        activeGames.some((game) => game.category_id === category.id),
      );

      const localizedCategories = categoriesWithGames.map((category) => ({
        ...category,
        name: resolveTranslation(
          categoryTranslationMap,
          category.id,
          "name",
          category.name,
        ),
        description: resolveTranslation(
          categoryTranslationMap,
          category.id,
          "description",
          category.description,
        ),
      }));

      setCategories(localizedCategories);

      // Also fetch progress
      await fetchDailyProgress();
    } catch (e) {
      setError(e as Error);
      console.error("Error fetching games data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [locale]);

  useEffect(() => {
    const handleLanguageChange = (nextLocale: string) => {
      setLocale(normalizeLocale(nextLocale));
    };

    i18n.on("languageChanged", handleLanguageChange);

    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, []);

  const refreshDailyProgress = async () => {
    await fetchDailyProgress();
  };

  const getGamesByCategory = (categoryId: string) => {
    return games.filter((game) => game.category_id === categoryId);
  };

  return (
    <GamesContext.Provider
      value={{
        games,
        categories,
        isLoading,
        error,
        refresh: fetchData,
        getGamesByCategory,
        dailyCompletedGameIds,
        refreshDailyProgress,
        getDailyWorkout: (userId: string, count: number = 3) => {
          if (games.length === 0) return [];

          // Seed based on date (YYYYMMDD) + userId to be deterministic for this user today
          const today = new Date();
          const dateSeed =
            today.getFullYear() * 10000 +
            (today.getMonth() + 1) * 100 +
            today.getDate();

          // Simple hash of userId (string) to a number if it's not numeric
          let userHash = 0;
          if (userId) {
            for (let i = 0; i < userId.length; i++) {
              userHash = (userHash << 5) - userHash + userId.charCodeAt(i);
              userHash |= 0; // Convert to 32bit integer
            }
          }

          const seed = dateSeed + Math.abs(userHash);

          const seededRandom = (s: number) => {
            const x = Math.sin(s) * 10000;
            return x - Math.floor(x);
          };

          const shuffled = [...games];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(seededRandom(seed + i) * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }

          return shuffled.slice(0, count);
        },
      }}
    >
      {children}
    </GamesContext.Provider>
  );
}

export const useGames = () => {
  const context = useContext(GamesContext);
  if (context === undefined) {
    throw new Error("useGames must be used within a GamesProvider");
  }
  return context;
};
