// The real i18next instance every test runs against: English resources, no HTTP backend, no
// Suspense. `setup.ts` substitutes it for the app's `@/shared/config/i18n/i18n`.
//
// Top-level namespaces (`en/<ns>.json`) are bundled eagerly. The per-id rules-text namespaces in
// subdirectories (`en/npcAbilityText/Foehammer.json` is `npcAbilityText/Foehammer`, several hundred
// files) load on request through a small backend, as the app's HTTP backend does: bundling them
// eagerly costs every test file ~20 s of setup. A namespace with no English file fails to load.
import i18n, { type BackendModule, type Resource } from "i18next"
import { initReactI18next } from "react-i18next"

const localeModules = import.meta.glob<{ default: Resource[string] }>(
  "../../public/locales/en/*.json",
  { eager: true }
)
const nestedModules = import.meta.glob<Resource[string]>(
  "../../public/locales/en/*/*.json",
  { import: "default" }
)

const en = Object.fromEntries(
  Object.entries(localeModules).map(([path, module]) => [
    path.replace(/^.*\/(.+)\.json$/, "$1"),
    module.default,
  ])
)

/** Every `<language>/<namespace>` the backend was asked for, in order (tests may clear it). */
export const requestedNamespaces: string[] = []

let held: (() => void)[] | undefined
/**
 * Forgets the nested namespaces earlier tests loaded, then holds every backend read until the
 * returned release is called: the "still downloading" state.
 */
export function holdNamespaceLoads(): () => void {
  const { state } = i18n.services.backendConnector as {
    state: Record<string, number | undefined>
  }
  for (const path of Object.keys(nestedModules)) {
    const namespace = path.replace(/^.*\/locales\/en\/(.+)\.json$/, "$1")
    i18n.removeResourceBundle("en", namespace)
    state[`en|${namespace}`] = undefined
  }
  held = []
  return () => {
    const queued = held ?? []
    held = undefined
    for (const read of queued) read()
  }
}

const nestedBackend: BackendModule = {
  type: "backend",
  init() {},
  read(language, namespace, callback) {
    if (held) {
      held.push(() => nestedBackend.read(language, namespace, callback))
      return
    }
    requestedNamespaces.push(`${language}/${namespace}`)
    const load =
      language === "en"
        ? nestedModules[`../../public/locales/en/${namespace}.json`]
        : undefined
    if (!load) {
      callback(new Error(`no file for ${language}/${namespace}`), false)
      return
    }
    load().then(
      (data) => callback(null, data),
      (error: Error) => callback(error, false)
    )
  },
}

void i18n
  .use(nestedBackend)
  .use(initReactI18next)
  .init({
    resources: { en },
    partialBundledLanguages: true,
    lng: "en",
    fallbackLng: "en",
    defaultNS: "common",
    ns: Object.keys(en),
    initAsync: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  })

export { i18n }
