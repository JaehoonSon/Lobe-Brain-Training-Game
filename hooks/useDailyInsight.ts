import { useState, useEffect } from "react";
import i18n from "~/lib/i18n";
import { supabase } from "~/lib/supabase";
import {
  buildTranslationMap,
  fetchContentTranslations,
  resolveTranslation,
} from "~/lib/content-translations";
import { normalizeLocale } from "~/lib/locale";

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
  const [locale, setLocale] = useState(() => normalizeLocale(i18n.language));

  useEffect(() => {
    async function fetchDailyInsight() {
      try {
        setIsLoading(true);

        const { data, error: fetchError } = await supabase
          .rpc("get_daily_insight")
          .single();

        if (fetchError) throw fetchError;
        if (!data) {
          setInsight(null);
          return;
        }

        const translations = await fetchContentTranslations(
          "insight",
          [data.id],
          ["content", "source", "category"],
          locale,
        );
        const translationMap = buildTranslationMap(translations);

        const localizedInsight: DailyInsight = {
          ...data,
          content: resolveTranslation(
            translationMap,
            data.id,
            "content",
            data.content,
          ),
          source: data.source
            ? resolveTranslation(translationMap, data.id, "source", data.source)
            : null,
          category: data.category
            ? resolveTranslation(
                translationMap,
                data.id,
                "category",
                data.category,
              )
            : null,
        };

        setInsight(localizedInsight);
        setError(null);
      } catch (err) {
        console.error("Error fetching daily insight:", err);
        setError(err as Error);
        setInsight(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDailyInsight();
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

  return { insight, isLoading, error };
}
