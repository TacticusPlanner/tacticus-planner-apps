import i18n from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import HttpBackend, { type HttpBackendOptions } from "i18next-http-backend"
import { initReactI18next } from "react-i18next"

import { fallbackLanguage, supportedLanguageCodes } from "./locales"

const appVersion = import.meta.env.VITE_APP_VERSION

const translationLoadPath = appVersion
  ? `/locales/{{lng}}/{{ns}}.json?v=${encodeURIComponent(appVersion)}`
  : "/locales/{{lng}}/{{ns}}.json"

void i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init<HttpBackendOptions>({
    backend: {
      loadPath: translationLoadPath,
    },
    defaultNS: "translation",
    detection: {
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
      order: ["localStorage", "navigator"],
    },
    fallbackLng: fallbackLanguage,
    interpolation: {
      escapeValue: false,
    },
    load: "languageOnly",
    ns: ["translation"],
    react: {
      useSuspense: true,
    },
    supportedLngs: supportedLanguageCodes,
  })

export { i18n }
