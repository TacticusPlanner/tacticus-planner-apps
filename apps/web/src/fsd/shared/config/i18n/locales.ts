export const fallbackLanguage = "en"

export const supportedLocales = [
  { code: "en", labelKey: "language.options.en" },
  { code: "fr", labelKey: "language.options.fr" },
  { code: "de", labelKey: "language.options.de" },
  { code: "es", labelKey: "language.options.es" },
] as const

export type SupportedLanguage = (typeof supportedLocales)[number]["code"]

export const supportedLanguageCodes = supportedLocales.map(
  (locale) => locale.code
)

export function getSupportedLanguage(language: string): SupportedLanguage {
  const languageCode = language.split("-")[0]

  if (supportedLanguageCodes.includes(languageCode as SupportedLanguage)) {
    return languageCode as SupportedLanguage
  }

  return fallbackLanguage
}
