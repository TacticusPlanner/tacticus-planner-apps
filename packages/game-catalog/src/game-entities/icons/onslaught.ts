import { datamineAssetUrl } from "./asset-path"

export type OnslaughtSectorIcon =
  "Stone" | "Iron" | "Bronze" | "Silver" | "Gold" | "Diamond" | "Adamantine"
export type OnslaughtTierIcon = 1 | 2 | 3 | 4
export type OnslaughtAllianceIcon = "Imperial" | "Xenos" | "Chaos"

/** A sector tier's rank glyph; the game names the Adamantine sector's glyphs "mythic". */
export function onslaughtTierIcon(
  sector: OnslaughtSectorIcon,
  tier: OnslaughtTierIcon
): string {
  const metal = sector === "Adamantine" ? "mythic" : sector.toLowerCase()
  return datamineAssetUrl(
    `atlases/ui_onslaught_button_rank_${metal}_${tier}.webp`
  )
}

/** The alliance emblem (the same art the game puts on ability badges). */
export function onslaughtAllianceIcon(alliance: OnslaughtAllianceIcon): string {
  return datamineAssetUrl(
    `atlases/ui_ability_badges_${alliance.toLowerCase()}.webp`
  )
}
