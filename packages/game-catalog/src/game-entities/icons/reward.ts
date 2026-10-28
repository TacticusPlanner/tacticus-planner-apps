import type { Rarity } from "@workspace/game-domain"

import { datamineAssetUrl } from "./asset-path"

// Reward art for the loot the game hands out on event ladders and in shops but that is no single
// unit or upgrade: the game's own drop-table icons for random pools, and the inline text glyphs of
// its seasonal and crusade resources.

// The game reuses each season's currency art under a month-and-year reward id; a month it shipped no
// dedicated art for uses the generic event currency.
const seasonalEventCurrencyFiles: Record<string, string> = {
  February2026: "liveevents/ui_icon_resource_event_currency_february_2026",
  April2026: "liveevents/ui_icon_resource_event_currency_april_2026",
  May2026: "liveevents/ui_icon_resource_event_currency_may_2026",
  June2026: "fonts/SE_Currency_june_26",
  August2026: "liveevents/ui_icon_resource_event_currency_august_2026",
  September2026: "liveevents/ui_icon_resource_event_currency_september_2026",
}

/** A seasonal event's currency, from its `seasonalEventCurrency<Month><Year>` reward id. */
export function seasonalEventCurrencyIcon(rewardId: string): string {
  const season = rewardId.replace(/^seasonalEventCurrency/, "")
  const file =
    seasonalEventCurrencyFiles[season] ??
    "liveevents/ui_icon_resource_event_currency"
  return datamineAssetUrl(`${file}.webp`)
}

/** A random item of one rarity (`items<Alliance><Rarity>`), the game's rarity item crate. */
export function itemPoolIcon(rarity: Rarity): string {
  return datamineAssetUrl(
    `droptables/ui_icon_droptable_item_${rarity.toLowerCase()}.webp`
  )
}

const equipmentPoolSlots = new Set([
  "I_Block",
  "I_Booster_Block",
  "I_Booster_Crit",
  "I_Crit",
  "I_Defensive",
])

/** A random item of one rarity and slot (`items<Rarity>_<Slot>`), or `undefined` for a slot without art. */
export function equipmentPoolIcon(
  rarity: Rarity,
  slot: string
): string | undefined {
  return equipmentPoolSlots.has(slot)
    ? datamineAssetUrl(
        `droptables/ui_icon_droptable_items${rarity}_${slot}.webp`
      )
    : undefined
}

const heroShardPools = new Set([
  "AdeptusMechanicus",
  "BlackLegion",
  "BlackTemplars",
  "BloodAngels",
  "Chaos",
  "DeathGuard",
  "Genestealers",
  "Imperial",
  "Necrons",
  "Orks",
  "Sisterhood",
  "ThousandSons",
  "Ultramarines",
  "WorldEaters",
  "Xenos",
])

/** Shards of a random hero of a faction or alliance (`Shards<Group>`); any other group is the generic pool. */
export function heroShardPoolIcon(group: string): string {
  const key = heroShardPools.has(group) ? group : "Generic"
  return datamineAssetUrl(
    `droptables/ui_icon_droptable_HeroShard_${key}_Medium.webp`
  )
}

const resourceGlyphFiles = {
  crusadeBomb: "fonts/Resource_CrusadeBomb",
  crusadeCurrency: "fonts/Resource_CrusadeCurrency",
  crusadeNpc: "fonts/Resource_CrusadeNpc",
  intel: "fonts/Resource_Intel",
  machinesOfWarAmmo: "atlases/ui_icon_resource_machines_of_war_ammo_small",
  summoningToken: "atlases/ui_icon_resource_summoning_token",
} as const

export type ResourceGlyph = keyof typeof resourceGlyphFiles

/** A resource the game names by its reward id: crusade resources, intel, MoW ammo, summoning tokens. */
export function resourceGlyphIcon(resource: ResourceGlyph): string {
  return datamineAssetUrl(`${resourceGlyphFiles[resource]}.webp`)
}

export function isResourceGlyph(rewardId: string): rewardId is ResourceGlyph {
  return Object.hasOwn(resourceGlyphFiles, rewardId)
}
