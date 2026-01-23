export const normalizeLocale = (locale?: string) => {
  if (!locale) return "en";

  const normalized = locale.toLowerCase();

  if (normalized.startsWith("zh")) {
    return "zh";
  }

  if (normalized.startsWith("pt")) {
    return "pt";
  }

  return normalized.split("-")[0];
};
