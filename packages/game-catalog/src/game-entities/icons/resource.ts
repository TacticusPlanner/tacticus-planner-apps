import type { Rarity } from "@workspace/game-domain"

import { ASSET_BASE_PATH } from "./asset-path"

// Id-based icons for the goal-cost resources (ability badges, forge badges, MoW components, orbs,
// gold, XP books). Every asset is a Snowprint file already shipped under /game_catalog; the shop
// reward vocabulary maps the same files ad hoc, these are the shared resolvers for goal chips.

const allianceKey = (alliance: string) => alliance.toLowerCase()

/** Ability badge art per alliance and rarity (V1's `BadgeImage` assets). */
export function abilityBadgeIcon(rarity: Rarity, alliance: string): string {
  return `${ASSET_BASE_PATH}/badges/${allianceKey(alliance)}-${rarity.toLowerCase()}.png`
}

export function forgeBadgeIcon(rarity: Rarity): string {
  return `${ASSET_BASE_PATH}/resources/ui_forge_badges_${rarity.toLowerCase()}.png`
}

/** Machine of War component art per alliance (V1's `ComponentImage`). */
export function mowComponentIcon(alliance: string): string {
  return `${ASSET_BASE_PATH}/resources/ui_machines_of_war_tokens_${allianceKey(alliance)}.png`
}

/** Ascension orb: the rarity orb, with `orbAllianceIcon` overlaid (V1's `OrbIcon`). */
export function orbIcon(rarity: Rarity): string {
  return `${ASSET_BASE_PATH}/resources/ui_hero_ascension_orbs_${rarity.toLowerCase()}.png`
}

export function orbAllianceIcon(alliance: string): string {
  return `${ASSET_BASE_PATH}/resources/ui_hero_ascension_orbs_${allianceKey(alliance)}.png`
}

/** V1's energy glyph. */
export function energyIcon(): string {
  return `${ASSET_BASE_PATH}/misc/energy.png`
}

/** V1's Onslaught glyph shown beside a goal's projected tokens (`CampaignImage` "Onslaught"). */
export function onslaughtTokenIcon(): string {
  return `${ASSET_BASE_PATH}/campaigns/Onslaught.png`
}

export function goldIcon(): string {
  return `${ASSET_BASE_PATH}/misc/ui_icon_resource_coin.png`
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
  return `${ASSET_BASE_PATH}/books/ui_icon_consumable_xp_book_${XP_BOOK_INDEX[rarity]}.png`
}
