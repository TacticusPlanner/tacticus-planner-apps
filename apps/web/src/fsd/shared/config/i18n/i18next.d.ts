import type enCommon from "../../../../../public/locales/en/common.json"
import type enLanding from "../../../../../public/locales/en/landing.json"
import type enProgression from "../../../../../public/locales/en/progression.json"
import type enCampaigns from "../../../../../public/locales/en/campaigns.json"
import type enEquipment from "../../../../../public/locales/en/equipment.json"

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common"
    resources: {
      common: typeof enCommon
      landing: typeof enLanding
      // Nested static namespaces (progression: stars/ranks/rarities; campaigns: names/difficulties/codes).
      progression: typeof enProgression
      campaigns: typeof enCampaigns
      equipment: typeof enEquipment
      // Dynamic game-data namespaces (character/upgrade/faction/trait/etc ids as keys).
      characters: Record<string, string>
      upgrades: Record<string, string>
      factions: Record<string, string>
      traits: Record<string, string>
      damageTypes: Record<string, string>
    }
  }
}
