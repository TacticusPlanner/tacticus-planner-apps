import type { Rarity } from "@workspace/game-domain"

import { curatedAssetUrl, datamineAssetUrl } from "./asset-path"
import type { LayeredIcon } from "./layered"

// Id-based icons for the goal-cost resources (ability badges, forge badges, MoW components, orbs,
// gold, XP books). Every asset but the Onslaught glyph is a game sprite under /game_catalog/datamines;
// the shop reward vocabulary maps the same files ad hoc, these are the shared resolvers for goal chips.

const allianceKey = (alliance: string) => alliance.toLowerCase()

// Where the game draws an ability badge's two sprites, in percent of a square box: the rarity's hex
// frame, and the alliance emblem centered on the frame's opening. The frames differ in size and tilt.
const BADGE_LAYOUT: Record<
  Rarity,
  {
    frame: [number, number, number, number]
    emblem: [number, number, number, number]
  }
> = {
  Common: { frame: [4.2, 0, 91.7, 100], emblem: [19.8, 15.6, 66.2, 64.6] },
  Uncommon: { frame: [0.4, 0, 99.2, 100], emblem: [16, 15, 66.2, 64.6] },
  Rare: { frame: [0, 2.8, 100, 94.5], emblem: [20.9, 17.1, 62.6, 61] },
  Epic: { frame: [4.7, 0, 90.5, 100], emblem: [20.2, 16.5, 65.4, 63.8] },
  Legendary: { frame: [0, 0, 100, 100], emblem: [16.2, 14.5, 66.8, 65.1] },
  Mythic: { frame: [0, 2.4, 100, 95.2], emblem: [12, 19.7, 69.4, 67.7] },
}

const layer = (
  src: string,
  [left, top, width, height]: [number, number, number, number]
) => ({ src, left, top, width, height })

/** Ability badge per alliance and rarity: the rarity's frame with the alliance emblem on top. */
export function abilityBadgeIcon(
  rarity: Rarity,
  alliance: string
): LayeredIcon {
  const { frame, emblem } = BADGE_LAYOUT[rarity]
  return {
    layers: [
      layer(
        datamineAssetUrl(
          `atlases/ui_ability_badges_${rarity.toLowerCase()}.webp`
        ),
        frame
      ),
      layer(
        datamineAssetUrl(
          `atlases/ui_ability_badges_${allianceKey(alliance)}.webp`
        ),
        emblem
      ),
    ],
  }
}

export function forgeBadgeIcon(rarity: Rarity): string {
  return datamineAssetUrl(
    `atlases/ui_forge_badges_${rarity.toLowerCase()}.webp`
  )
}

/** Machine of War component art per alliance (V1's `ComponentImage`). */
export function mowComponentIcon(alliance: string): string {
  return datamineAssetUrl(
    `atlases/ui_machines_of_war_tokens_${allianceKey(alliance)}.webp`
  )
}

/** Ascension orb: the rarity orb, with `orbAllianceIcon` overlaid (V1's `OrbIcon`). */
export function orbIcon(rarity: Rarity): string {
  return datamineAssetUrl(
    `atlases/ui_hero_ascension_orbs_${rarity.toLowerCase()}.webp`
  )
}

export function orbAllianceIcon(alliance: string): string {
  return datamineAssetUrl(
    `atlases/ui_hero_ascension_orbs_${allianceKey(alliance)}.webp`
  )
}

export function energyIcon(): string {
  return datamineAssetUrl(`atlases/ui_icon_resource_stamina_small.webp`)
}

/** The Onslaught glyph shown beside a goal's projected tokens (planner art; the game has none). */
export function onslaughtTokenIcon(): string {
  return curatedAssetUrl(`campaigns/Onslaught.webp`)
}

export function goldIcon(): string {
  return datamineAssetUrl(`atlases/ui_icon_resource_coin_small.webp`)
}

export function raidTicketIcon(): string {
  return datamineAssetUrl(`atlases/ui_icon_resource_raid_large.webp`)
}

const GAME_MODE_TOKEN_FILES = {
  arena: "ui_icon_resource_token_battle_pvp",
  guildRaid: "ui_icon_resource_token_battle_guildboss",
  bombTokens: "ui_icon_bomb",
  onslaught: "ui_icon_resource_token_battle_waves",
  salvageRun: "ui_icon_resource_token_battle_treasureBeach",
} as const

export type GameModeToken = keyof typeof GAME_MODE_TOKEN_FILES

/** The battle-token icon of a game mode, and the guild-raid bomb. */
export function gameModeTokenIcon(token: GameModeToken): string {
  return datamineAssetUrl(`atlases/${GAME_MODE_TOKEN_FILES[token]}.webp`)
}

export function salvageIcon(): string {
  return datamineAssetUrl(`atlases/ui_icon_resource_salvage.webp`)
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
  return datamineAssetUrl(
    `atlases/ui_icon_consumable_xp_book_${XP_BOOK_INDEX[rarity]}.webp`
  )
}
