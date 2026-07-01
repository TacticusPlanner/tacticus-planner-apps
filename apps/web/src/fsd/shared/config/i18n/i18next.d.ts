import type enCommon from "../../../../../public/locales/en/common.json"
import type enLanding from "../../../../../public/locales/en/landing.json"
import type enRanks from "../../../../../public/locales/en/ranks.json"

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common"
    resources: {
      common: typeof enCommon
      landing: typeof enLanding
      ranks: typeof enRanks
      // Dynamic game-data namespaces (character/upgrade/faction/trait ids as keys).
      characters: Record<string, string>
      upgrades: Record<string, string>
      factions: Record<string, string>
      traits: Record<string, string>
    }
  }
}
