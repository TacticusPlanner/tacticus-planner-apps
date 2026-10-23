import { useTranslation } from "react-i18next"

import {
  getSupportedLanguage,
  supportedLocales,
  type SupportedLanguage,
} from "@/shared/config"

/** The active supported language plus its setter, shared by every language control. */
export function useLanguage() {
  const { i18n } = useTranslation()
  const language = getSupportedLanguage(i18n.resolvedLanguage ?? i18n.language)

  return {
    language,
    selectedLocale: supportedLocales.find((locale) => locale.code === language),
    setLanguage: (next: SupportedLanguage) => {
      void i18n.changeLanguage(next)
    },
  }
}
