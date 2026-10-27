import type enCommon from "../../../../../public/locales/en/common.json"
import type enLanding from "../../../../../public/locales/en/landing.json"
import type enProgression from "../../../../../public/locales/en/progression.json"
import type enCampaigns from "../../../../../public/locales/en/campaigns.json"
import type enEquipment from "../../../../../public/locales/en/equipment.json"
import type enDailies from "../../../../../public/locales/en/dailies.json"
import type enEvents from "../../../../../public/locales/en/events.json"
import type enLibrary from "../../../../../public/locales/en/library.json"
import type enShops from "../../../../../public/locales/en/shops.json"
import type enTeamRecs from "../../../../../public/locales/en/teamRecs.json"
import type enLegendaryEvents from "../../../../../public/locales/en/legendaryEvents.json"
import type enHre from "../../../../../public/locales/en/hre.json"
import type enQuest from "../../../../../public/locales/en/quest.json"

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
      dailies: typeof enDailies
      events: typeof enEvents
      library: typeof enLibrary
      shops: typeof enShops
      teamRecs: typeof enTeamRecs
      legendaryEvents: typeof enLegendaryEvents
      hre: typeof enHre
      quest: typeof enQuest
      // Dynamic game-data namespaces (character/upgrade/faction/trait/etc ids as keys).
      characters: Record<string, string>
      mows: Record<string, string>
      upgrades: Record<string, string>
      // Specific equipment/relic piece names (I_*/R_* ids as keys); slot labels stay in `equipment`.
      equipmentItems: Record<string, string>
      factions: Record<string, string>
      traits: Record<string, string>
      damageTypes: Record<string, string>
      // NPC variation ids -> localized unit name (ported from V1 npc_names; see the npc-library change).
      npcs: Record<string, string>
      abilities: Record<string, string>
      // Structured trait rules text, read via `i18n.getResource` — see `shared/ability-text`
      // use-ability-text. Ability rules text is one namespace per ability (`npcAbilityText/<id>`,
      // with `npcAbilityTextGaps` listing the ids without one), loaded by `useRulesText`, which
      // names them as plain strings, so they are not listed here.
      npcTraitText: Record<string, unknown>
      // Sorted ability ids whose English rules text summons a unit (generated with the rules text);
      // read via `i18n.getResourceBundle` by the HRE team recommender.
      npcAbilitySummoners: Record<string, unknown>
      // Mythic quest task templates (loca key -> template), generated from the datamine; read via
      // `i18n.getResource` — see the library character unit page.
      mythicQuestTasks: Record<string, string>
      // Raid-boss game-data namespaces (unitSet / ability / trait ids as keys), in every locale except
      // `raidBosses`, whose names are derived from the ids and so English-only (other locales fall back).
      raidBosses: Record<string, string>
      raidBossAbilities: Record<string, string>
      raidBossTraits: Record<string, string>
      // Structured trait rules text, keyed by trait id. Read via `i18n.getResource`, not `t()` — see
      // `entities/raid-boss` use-raid-boss-text (ability rules text is one `raidBossAbilityText/<id>`
      // namespace per ability, named as a plain string there).
      raidBossTraitText: Record<string, unknown>
      // Horde-mode strategy text (character id -> strengths / howToUse / relicAdvice), curated
      // content for the Tier List. Read via `i18n.getResource` — see `entities/legendary-event`
      // use-horde-strategy-text.
      hordeStrategy: Record<string, unknown>
    }
  }
}
