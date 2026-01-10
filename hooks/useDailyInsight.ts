import { useState, useEffect } from 'react';
import { supabase } from '~/lib/supabase';

interface DailyInsight {
  id: string;
  content: string;
  source: string | null;
  source_url: string | null;
  category: string | null;
}

export function useDailyInsight() {
  const [insight, setInsight] = useState<DailyInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchDailyInsight() {
      try {
        setIsLoading(true);
        
        // Call the PostgreSQL function that handles modulo rotation
        // Note: Type assertion needed until db:types is run to regenerate types
        const { data, error: fetchError } = await (supabase
          .rpc('get_daily_insight' as any) as any)
          .single();

        if (fetchError) throw fetchError;

        setInsight(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching daily insight:', err);
        setError(err as Error);
        setInsight(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDailyInsight();
  }, []);

  return { insight, isLoading, error };
}
