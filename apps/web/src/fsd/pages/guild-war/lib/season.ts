import type { GuildWarSeasonStorageModel } from "@workspace/game-catalog"
import { rarityOrder } from "@workspace/game-domain"
import type { Rarity } from "@workspace/game-domain"

export type GuildWarSeason = GuildWarSeasonStorageModel
export type GuildWarZone = GuildWarSeason["zones"][number]

/** The defender slots of a zone, 0-based as the API stores them (shown as 1 to 5). */
export const GUILD_WAR_SLOTS = [0, 1, 2, 3, 4] as const

/** The level a war starts at before the player picks one: the highest, as most guilds play. */
export const DEFAULT_BATTLEFIELD_LEVEL = 5

/** The tokens shown for a war whose season is no longer served (it can log no more attacks). */
const FALLBACK_MAX_ATTEMPTS = 10

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

/** Whether two zones are copies of one kind (Frontline 1 to 3, Bunker 1 and 2): the same picture
 *  and buff. The game shows players no numbers, so copies are picked and counted as one. */
const sameKind = (a: GuildWarZone, b: GuildWarZone) =>
  a.visualId === b.visualId && a.buffId === b.buffId

/** The zone that stands for a zone's kind: the season's first copy of it. A zone the season does
 *  not have (its season is no longer served) stands for itself. */
export function zoneKindId(
  season: GuildWarSeason | undefined,
  zoneId: string
): string {
  const zone = season?.zones.find((entry) => entry.id === zoneId)
  if (!season || !zone) return zoneId
  return season.zones.find((entry) => sameKind(entry, zone))?.id ?? zoneId
}

/** The season's zone kinds grouped by their tier at a level, the tiers in the season's order
 *  (lowest first) and each kind once, as its first copy in that tier, in battlefield order. A zone
 *  the level does not place is left out. */
export function zonesByTier(
  season: GuildWarSeason,
  battlefieldLevel: number
): { tierId: string; zones: GuildWarZone[] }[] {
  return season.tiers.flatMap((tier) => {
    const zones = season.zones
      .filter(
        (zone) => zoneTierId(season, battlefieldLevel, zone.id) === tier.id
      )
      .filter(
        (zone, index, inTier) =>
          inTier.findIndex((other) => sameKind(other, zone)) === index
      )
    return zones.length > 0 ? [{ tierId: tier.id, zones }] : []
  })
}

/** The season's letter (`guildWarSeasonD` → "D"), or its id when it has no letter. */
export function seasonLetter(seasonId: string): string {
  return /^guildWarSeason(\w+)$/.exec(seasonId)?.[1] ?? seasonId
}

/** The tokens a war in this season allows. */
export function maxAttempts(season: GuildWarSeason | undefined): number {
  return season?.maxAttempts ?? FALLBACK_MAX_ATTEMPTS
}
