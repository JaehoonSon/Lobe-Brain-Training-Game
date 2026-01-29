import { supabaseUntyped } from "~/lib/supabase";

export type TranslationRow = {
  entity_id: string;
  field: string;
  text: string;
};

type TranslationMap = Record<string, Record<string, string>>;

export const fetchContentTranslations = async (
  entityType: string,
  entityIds: string[],
  fields: string[],
  locale: string
) => {
  if (entityIds.length === 0) return [] as TranslationRow[];

  const { data, error } = await supabaseUntyped.rpc(
    "get_content_translations",
    {
      p_entity_type: entityType,
      p_entity_ids: entityIds,
      p_fields: fields,
      p_locale: locale,
    }
  );

  if (error) throw error;

  return (data ?? []) as TranslationRow[];
};

export const buildTranslationMap = (rows: TranslationRow[]) => {
  return rows.reduce<TranslationMap>((map, row) => {
    const entityMap = map[row.entity_id] ?? {};
    entityMap[row.field] = row.text;
    map[row.entity_id] = entityMap;
    return map;
  }, {});
};

export const resolveTranslation = (
  map: TranslationMap,
  entityId: string,
  field: string,
  fallback: string | null
) => {
  return map[entityId]?.[field] ?? fallback ?? "";
};
