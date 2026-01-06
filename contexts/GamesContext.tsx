import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "~/lib/supabase";
import { Database } from "~/lib/database.types";

type Game = Database["public"]["Tables"]["games"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

interface GamesContextType {
  games: Game[];
  categories: Category[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  getGamesByCategory: (categoryId: string) => Game[];
}

const GamesContext = createContext<GamesContextType | undefined>(undefined);

export function GamesProvider({ children }: { children: React.ReactNode }) {
  const [games, setGames] = useState<Game[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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

      setGames(gamesResult.data || []);
      setCategories(categoriesResult.data || []);
    } catch (e) {
      setError(e as Error);
      console.error("Error fetching games data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
