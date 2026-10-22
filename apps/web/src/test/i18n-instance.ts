// The real i18next instance every test runs against: English resources loaded eagerly, no HTTP
// backend, no Suspense. `setup.ts` substitutes it for the app's `@/shared/config/i18n/i18n`.
import i18n, { type Resource } from "i18next"
import { initReactI18next } from "react-i18next"

const localeModules = import.meta.glob<{ default: Resource[string] }>(
  "../../public/locales/en/*.json",
  { eager: true }
)

const en = Object.fromEntries(
  Object.entries(localeModules).map(([path, module]) => [
    path.replace(/^.*\/(.+)\.json$/, "$1"),
    module.default,
  ])
)

void i18n.use(initReactI18next).init({
  resources: { en },
  lng: "en",
  fallbackLng: "en",
  defaultNS: "common",
  ns: Object.keys(en),
  initAsync: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
})

export { i18n }
