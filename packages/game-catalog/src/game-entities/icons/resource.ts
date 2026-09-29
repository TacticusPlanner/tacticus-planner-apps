import type { Rarity } from "@workspace/game-domain"

import { ASSET_BASE_PATH } from "./asset-path"

// Id-based icons for the goal-cost resources (ability badges, forge badges, MoW components, orbs,
// gold, XP books). Every asset is a Snowprint file already shipped under /game_catalog; the shop
// reward vocabulary maps the same files ad hoc, these are the shared resolvers for goal chips.

/** Ability badge (`draft_abilityTokens{Rarity}`); alliance-agnostic, V2 ships no per-alliance badge art. */
export function abilityBadgeIcon(rarity: Rarity): string {
  return `${ASSET_BASE_PATH}/resources/ui_icon_droptable_draft_abilityTokens${rarity}.png`
}

export function forgeBadgeIcon(rarity: Rarity): string {
  return `${ASSET_BASE_PATH}/resources/ui_forge_badges_${rarity.toLowerCase()}.png`
}

/** Machine of War components are costed as one count (no alliance breakdown), so one generic icon. */
export function mowComponentIcon(): string {
  return `${ASSET_BASE_PATH}/misc/components_generic.png`
}

export function orbIcon(rarity: Rarity): string {
  return `${ASSET_BASE_PATH}/resources/ui_hero_ascension_orbs_${rarity.toLowerCase()}.png`
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
