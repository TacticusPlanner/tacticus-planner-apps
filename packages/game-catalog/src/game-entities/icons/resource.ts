import type { Rarity } from "@workspace/game-domain"

import { gameAssetUrl } from "./asset-path"

// Id-based icons for the goal-cost resources (ability badges, forge badges, MoW components, orbs,
// gold, XP books). Every asset is a Snowprint file already shipped under /game_catalog; the shop
// reward vocabulary maps the same files ad hoc, these are the shared resolvers for goal chips.

const allianceKey = (alliance: string) => alliance.toLowerCase()

/** Ability badge art per alliance and rarity (V1's `BadgeImage` assets). */
export function abilityBadgeIcon(rarity: Rarity, alliance: string): string {
  return gameAssetUrl(
    `badges/${allianceKey(alliance)}-${rarity.toLowerCase()}.webp`
  )
}

export function forgeBadgeIcon(rarity: Rarity): string {
  return gameAssetUrl(`resources/ui_forge_badges_${rarity.toLowerCase()}.webp`)
}

/** Machine of War component art per alliance (V1's `ComponentImage`). */
export function mowComponentIcon(alliance: string): string {
  return gameAssetUrl(
    `resources/ui_machines_of_war_tokens_${allianceKey(alliance)}.webp`
  )
}

/** Ascension orb: the rarity orb, with `orbAllianceIcon` overlaid (V1's `OrbIcon`). */
export function orbIcon(rarity: Rarity): string {
  return gameAssetUrl(
    `resources/ui_hero_ascension_orbs_${rarity.toLowerCase()}.webp`
  )
}

export function orbAllianceIcon(alliance: string): string {
  return gameAssetUrl(
    `resources/ui_hero_ascension_orbs_${allianceKey(alliance)}.webp`
  )
}

/** V1's energy glyph. */
export function energyIcon(): string {
  return gameAssetUrl(`misc/energy.webp`)
}

/** V1's Onslaught glyph shown beside a goal's projected tokens (`CampaignImage` "Onslaught"). */
export function onslaughtTokenIcon(): string {
  return gameAssetUrl(`campaigns/Onslaught.webp`)
}

export function goldIcon(): string {
  return gameAssetUrl(`misc/ui_icon_resource_coin.webp`)
}

export function salvageIcon(): string {
  return gameAssetUrl(`resources/ui_icon_resource_salvage.webp`)
}

const XP_BOOK_INDEX: Record<Rarity, number> = {
  Common: 0,
  Uncommon: 1,
  Rare: 2,
  Epic: 3,
  Legendary: 4,
  Mythic: 5,
}

export function xpBookIcon(rarity: Rarity): string {
  return gameAssetUrl(
    `books/ui_icon_consumable_xp_book_${XP_BOOK_INDEX[rarity]}.webp`
  )
}
