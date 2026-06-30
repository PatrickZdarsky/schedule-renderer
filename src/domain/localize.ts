import type { LocalizedText } from "../types/schema";

function normalizeLocale(locale: string | null | undefined): string {
  return (locale ?? "").trim();
}

export function localizeText(
  value: LocalizedText | undefined,
  preferredLocale: string,
  fallbackText = "Unknown",
): string {
  if (!value || Object.keys(value).length === 0) {
    return fallbackText;
  }

  const exactLocale = normalizeLocale(preferredLocale);

  if (exactLocale && value[exactLocale]) {
    return value[exactLocale];
  }

  const preferredLanguage = exactLocale.split("-")[0];

  if (preferredLanguage) {
    const languageMatch = Object.entries(value).find(([locale]) => locale.split("-")[0] === preferredLanguage);

    if (languageMatch) {
      return languageMatch[1];
    }
  }

  const firstValue = Object.values(value)[0];
  return firstValue ?? fallbackText;
}
