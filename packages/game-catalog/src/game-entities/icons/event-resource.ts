import { datamineAssetUrl } from "./asset-path"

// The resources of the Legendary Event and the Hero Release Event, as the game draws them inline in
// its own text (`fonts/` glyphs) or on its resource bar (`atlases/`), and the event chests.

const legendaryEventResourceFiles = {
  points: "fonts/lhe_points",
  tokens: "fonts/lhe_tokens",
  shards: "atlases/ui_icon_character_legendary_event_shard",
  // The event's crates are the game's tiered chests (Regular to Mythic Event Crate).
  chests: "chests/ui_icon_chest_gold",
} as const

export type LegendaryEventResource = keyof typeof legendaryEventResourceFiles

export function legendaryEventResourceIcon(
  resource: LegendaryEventResource
): string {
  return datamineAssetUrl(`${legendaryEventResourceFiles[resource]}.webp`)
}

const heroReleaseEventResourceFiles = {
  points: "fonts/hre_points",
  shards: "fonts/hre_shards",
} as const

export type HeroReleaseEventResource =
  keyof typeof heroReleaseEventResourceFiles

export function heroReleaseEventResourceIcon(
  resource: HeroReleaseEventResource
): string {
  return datamineAssetUrl(`${heroReleaseEventResourceFiles[resource]}.webp`)
}

// Each Hero Release Event pays in its featured faction's own currency (Oaths, Motive Force Charges…);
// the game ships a glyph for only these factions.
const heroReleaseCurrencyKeys: Record<string, string> = {
  Aeldari: "Aeldari",
  DarkAngels: "DarkAngels",
  EmperorsChildren: "EmpChi",
  Genestealers: "Genestealers",
  LeaguesOfVotann: "LeaguesOfVotann",
  Necrons: "Necrons",
  Orks: "Orks",
  Sisterhood: "Sisterhood",
  SpaceWolves: "SpaceWolves",
  Tau: "Tau",
  TheLostAndTheDamned: "TheLostAndTheDamned",
}

/** The featured faction's event currency, or `undefined` for a faction the game has no glyph for. */
export function heroReleaseCurrencyIcon(factionId: string): string | undefined {
  const key = heroReleaseCurrencyKeys[factionId]
  return key ? datamineAssetUrl(`fonts/Hre_Currency_${key}.webp`) : undefined
}

const heroReleaseChestKeys: Record<string, string> = {
  AdeptusAstartes: "astar",
  AdeptusMechanicus: "admec",
  Aeldari: "aeldari",
  BloodAngels: "bloodangels",
  Custodes: "custodes",
  DarkAngels: "darkangels",
  EmperorsChildren: "emper",
  Genestealers: "genestealers",
  LeaguesOfVotann: "votann",
  Necrons: "necro",
  Orks: "orks",
  Sisterhood: "sisterhood",
  SpaceWolves: "spacewolves",
  Tau: "tau",
  TheLostAndTheDamned: "losta",
  ThousandSons: "thous",
  Tyranids: "tyranid",
  Ultramarines: "ultramarines",
  WorldEaters: "worldeaters",
}

/** The featured faction's event chest, else the game's generic Hero Release Event chest. */
export function heroReleaseChestIcon(factionId: string | undefined): string {
  const key = (factionId && heroReleaseChestKeys[factionId]) || "mythic"
  return datamineAssetUrl(`chests/ui_icon_chest_hre_${key}.webp`)
}

/** The Quest Event's points, the game's seasonal-event points icon. */
export function questEventPointsIcon(): string {
  return datamineAssetUrl(
    "liveevents/ui_icon_resource_event_points_seasonalevent.webp"
  )
}

export type ChestTier =
  "wood" | "bronze" | "silver" | "gold" | "diamond" | "mythic"

/** The game's tiered reward chest. */
export function chestIcon(tier: ChestTier): string {
  return datamineAssetUrl(`chests/ui_icon_chest_${tier}.webp`)
}

const rarityChestTiers: Record<string, ChestTier> = {
  common: "wood",
  uncommon: "bronze",
  rare: "silver",
  epic: "gold",
  legendary: "diamond",
  mythic: "mythic",
}

/**
 * The chest tier of a guild raid set's reward chest (`chest_guildboss_defeated_2_<rarity>`): the game
 * pays each boss rarity in its own tier, Common a wooden chest up to Mythic. `undefined` for any
 * other id.
 */
export function guildRaidChestTier(chestId: string): ChestTier | undefined {
  const rarity = /^chest_guildboss_defeated(?:_\d+)?_([a-z]+)$/.exec(
    chestId
  )?.[1]
  return rarity ? rarityChestTiers[rarity] : undefined
}
