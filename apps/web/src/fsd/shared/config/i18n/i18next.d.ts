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
      // Dynamic game-data namespaces (character/upgrade/faction ids as keys).
      characters: Record<string, string>
      upgrades: Record<string, string>
      campaignLocations: Record<string, string>
      factions: Record<string, string>
    }
  }
}
