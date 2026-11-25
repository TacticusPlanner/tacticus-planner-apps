import { useCallback } from "react"
import { progressionRarity, rarityOrder } from "@workspace/game-domain"
import type { Rarity } from "@workspace/game-domain"

import type { TeamRoster } from "@/entities/team"
import { usePersistedSelection } from "@/shared/lib"

import { GUILD_WAR_SLOTS, tierRarityCaps, zoneTierId } from "../lib/season"
import type { GuildWarSeason } from "../lib/season"
import type { Selection } from "./offense"

/** The zone last attacked, per device like the app's other quick picks (plan row 5). */
const LAST_ZONE_STORAGE_KEY = "guildWar.zone"
const NONE = ""
const isStoredString = (value: unknown): value is string =>
  typeof value === "string"

/** A stored zone as it applies to a season: one the season does not have reads as not picked. */
export function resolveZone(
  stored: string,
  season: GuildWarSeason | undefined
): string | null {
  return season?.zones.some((zone) => zone.id === stored) === true
    ? stored
    : null
}

/** The zone last attacked on this device, checked against the war's season. */
export function useLastZone(season: GuildWarSeason | undefined) {
  const [zone, setZone] = usePersistedSelection(
    LAST_ZONE_STORAGE_KEY,
    isStoredString,
    NONE
  )
  const setZoneId = useCallback(
    (zoneId: string | null) => setZone(zoneId ?? NONE),
    [setZone]
  )
  return [resolveZone(zone, season), setZoneId] as const
}

/** A rarity a zone's defenders are capped at, and the first slot holding it (what the API takes). */
export interface ZoneRarity {
  rarity: Rarity
  slot: number
}

/** The rarity caps of a zone's slots at a level, each once, highest first. */
export function zoneRarities(
  season: GuildWarSeason | undefined,
  battlefieldLevel: number,
  zoneId: string | null
): ZoneRarity[] {
  if (!season || zoneId === null) return []
  const caps = tierRarityCaps(
    season,
    zoneTierId(season, battlefieldLevel, zoneId)
  )
  const firstSlot = new Map<Rarity, number>()
  for (const slot of GUILD_WAR_SLOTS) {
    const cap = caps[slot]
    if (cap && !firstSlot.has(cap)) firstSlot.set(cap, slot)
  }
  return [...firstSlot]
    .map(([rarity, slot]) => ({ rarity, slot }))
    .toSorted(
      (a, b) => rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity)
    )
}

/** The rarity an attack most likely went at: the lowest cap the lineup's highest rarity fits under,
 *  else the zone's highest cap. Undefined when the zone has no caps. */
export function likelyRarity(
  rarities: readonly ZoneRarity[],
  selection: Selection,
  roster: TeamRoster | null
): Rarity | undefined {
  const highest = Math.max(
    -1,
    ...[...selection].flatMap(([id, kind]) => {
      const unit = (
        kind === "character" ? roster?.characters : roster?.mows
      )?.get(id)
      return unit
        ? [rarityOrder.indexOf(progressionRarity(unit.progression))]
        : []
    })
  )
  const fitting = rarities.filter(
    (entry) => rarityOrder.indexOf(entry.rarity) >= highest
  )
  return (fitting.at(-1) ?? rarities[0])?.rarity
}
