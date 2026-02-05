export const normalizeLocale = (locale?: string) => {
  if (!locale) return "en";

  const normalized = locale.toLowerCase();

  if (normalized.startsWith("zh")) {
    return "zh-Hans";
  }

  if (normalized === "pt-br" || normalized === "pt_br") {
    return "pt-BR";
  }

  if (normalized === "pt-pt" || normalized === "pt_pt") {
    return "pt-PT";
  }

  if (normalized.startsWith("pt")) {
    return "pt-BR";
  }

  return normalized.split("-")[0];
};
