export const fallbackLanguage = "en"

// `nativeName` is a literal rather than a translation key on purpose: a language is always
// listed under its own name, so a user who cannot read the active UI language can still find
// theirs. Routing it through i18n would let a translator localize "English" to "Englisch".
export const supportedLocales = [
  { code: "en", nativeName: "English" },
  { code: "fr", nativeName: "Français" },
  { code: "de", nativeName: "Deutsch" },
  { code: "es", nativeName: "Español" },
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
