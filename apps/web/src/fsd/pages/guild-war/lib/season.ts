import type { GuildWarSeasonStorageModel } from "@workspace/game-catalog"
import { rarityOrder } from "@workspace/game-domain"
import type { Rarity } from "@workspace/game-domain"

export type GuildWarSeason = GuildWarSeasonStorageModel
export type GuildWarZone = GuildWarSeason["zones"][number]

/** The defender slots of a zone, 0-based as the API stores them (shown as 1 to 5). */
export const GUILD_WAR_SLOTS = [0, 1, 2, 3, 4] as const

/** The level a war starts at before the player picks one: the highest, as most guilds play. */
export const DEFAULT_BATTLEFIELD_LEVEL = 5

/** The tokens a war allows when its season is no longer served (the API's fallback). */
const FALLBACK_MAX_ATTEMPTS = 10

export const isGuildWarSlot = (slot: number) =>
  Number.isInteger(slot) && slot >= 0 && slot < GUILD_WAR_SLOTS.length

const asRarity = (value: string | undefined): Rarity | undefined =>
  rarityOrder.find((rarity) => rarity === value)

/** The tier (`Trooper` … `Hero`) a zone has at a battlefield level. */
export function zoneTierId(
  season: GuildWarSeason,
  battlefieldLevel: number,
  zoneId: string
): string | undefined {
  return season.levels
    .find((level) => level.battlefieldLevel === battlefieldLevel)
    ?.zones.find((zone) => zone.zoneId === zoneId)?.tierId
}

/** The rarity cap of each slot of a tier, in slot order. */
export function tierRarityCaps(
  season: GuildWarSeason,
  tierId: string | undefined
): (Rarity | undefined)[] {
  const tier = season.tiers.find((entry) => entry.id === tierId)
  return GUILD_WAR_SLOTS.map((slot) => asRarity(tier?.rarityCaps[slot]))
}

/** The rarity cap of a zone's slot at a battlefield level: what the API stores on the attack. */
export function slotRarityCap(
  season: GuildWarSeason,
  battlefieldLevel: number,
  zoneId: string,
  slot: number
): Rarity | undefined {
  return tierRarityCaps(season, zoneTierId(season, battlefieldLevel, zoneId))[
    slot
  ]
}

/** The season's zones grouped by their tier at a level, the tiers in the season's order (lowest
 *  first) and the zones in battlefield order. A zone the level does not place is left out. */
export function zonesByTier(
  season: GuildWarSeason,
  battlefieldLevel: number
): { tierId: string; zones: GuildWarZone[] }[] {
  return season.tiers.flatMap((tier) => {
    const zones = season.zones.filter(
      (zone) => zoneTierId(season, battlefieldLevel, zone.id) === tier.id
    )
    return zones.length > 0 ? [{ tierId: tier.id, zones }] : []
  })
}

/** The number that tells same-kind zones apart (`Bunker2` → "2"), or "" for a single one. */
export function zoneNumber(zoneId: string): string {
  return /\d+$/.exec(zoneId)?.[0] ?? ""
}

/** The season's letter (`guildWarSeasonD` → "D"), or its id when it has no letter. */
export function seasonLetter(seasonId: string): string {
  return /^guildWarSeason(\w+)$/.exec(seasonId)?.[1] ?? seasonId
}

/** The tokens a war in this season allows. */
export function maxAttempts(season: GuildWarSeason | undefined): number {
  return season?.maxAttempts ?? FALLBACK_MAX_ATTEMPTS
}
