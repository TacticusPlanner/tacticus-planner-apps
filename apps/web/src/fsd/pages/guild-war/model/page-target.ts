import { useCallback } from "react"
import { rarityOrder } from "@workspace/game-domain"
import type { Rarity } from "@workspace/game-domain"

import { storedPreference, usePersistedSelection } from "@/shared/lib"

import type { GuildWarSeason } from "../lib/season"
import { resolveZone, zoneRarities } from "./attack-target"
import type { ZoneRarity } from "./attack-target"

/** The zone picked for the war, per device. */
const ZONE_STORAGE_KEY = storedPreference("guildWar", "zone")
/** "picked" once a battlefield level is picked for the war, per device. */
const LEVEL_STORAGE_KEY = storedPreference("guildWar", "level")
/** The war the zone and level were picked in ("" before it exists): picks from another war don't
 *  count, so a new war never inherits the last war's zone. */
const PICKS_WAR_STORAGE_KEY = storedPreference("guildWar", "picksWar")
/** The defenders' rarity last picked, per device (it carries over between wars). */
const LAST_RARITY_STORAGE_KEY = storedPreference("guildWar", "rarity")
const NONE = ""
const PICKED = "picked"
const isStoredString = (value: unknown): value is string =>
  typeof value === "string"
const isStoredRarity = (value: unknown): value is Rarity | typeof NONE =>
  value === NONE || rarityOrder.some((rarity) => rarity === value)

/** The zone's rarity to attack at: the one picked when the zone has it, else its highest cap. */
export function pickRarity(
  rarities: readonly ZoneRarity[],
  picked: Rarity | undefined
): ZoneRarity | undefined {
  return rarities.find((entry) => entry.rarity === picked) ?? rarities[0]
}

/** Whether picks stored for `picksWarId` belong to the current war: the same war, or picks made
 *  before any war existed (the first attack or level starts it). */
function picksCount(picksWarId: string, warId: string | null): boolean {
  return picksWarId === NONE || picksWarId === warId
}

/**
 * The battlefield level, zone and defenders' rarity the Offense page attacks at. The level and zone
 * are picked once per war and kept per device; Start new war clears them (`resetPicks`), and so does
 * a war started on another device. The rarity is the zone's cap last picked (else its highest) and
 * carries over. The rarity needs a picked level and zone; it caps the units the page shows, and the
 * three are what Won, Lost and Log with details log at.
 */
export function usePageTarget(
  season: GuildWarSeason | undefined,
  warId: string | null,
  battlefieldLevel: number
) {
  const [storedZone, setStoredZone] = usePersistedSelection(
    ZONE_STORAGE_KEY,
    isStoredString,
    NONE
  )
  const [storedLevel, setStoredLevel] = usePersistedSelection(
    LEVEL_STORAGE_KEY,
    isStoredString,
    NONE
  )
  const [picksWar, setPicksWar] = usePersistedSelection(
    PICKS_WAR_STORAGE_KEY,
    isStoredString,
    NONE
  )
  const [storedRarity, setStoredRarity] = usePersistedSelection(
    LAST_RARITY_STORAGE_KEY,
    isStoredRarity,
    NONE
  )
  const current = picksCount(picksWar, warId)
  const zoneId = current ? resolveZone(storedZone, season) : null
  const levelPicked = current && storedLevel === PICKED
  const rarities = levelPicked
    ? zoneRarities(season, battlefieldLevel, zoneId)
    : []
  const target = pickRarity(
    rarities,
    storedRarity === NONE ? undefined : storedRarity
  )

  const setZoneId = useCallback(
    (next: string) => {
      setStoredZone(next)
      setPicksWar(warId ?? NONE)
      // Carried over from another war, a picked level does not count either.
      if (!current) setStoredLevel(NONE)
    },
    [setStoredZone, setPicksWar, setStoredLevel, warId, current]
  )
  const markLevelPicked = useCallback(() => {
    setStoredLevel(PICKED)
    setPicksWar(warId ?? NONE)
    if (!current) setStoredZone(NONE)
  }, [setStoredLevel, setPicksWar, setStoredZone, warId, current])
  const resetPicks = useCallback(() => {
    setStoredZone(NONE)
    setStoredLevel(NONE)
    setPicksWar(NONE)
  }, [setStoredZone, setStoredLevel, setPicksWar])
  const setRarity = useCallback(
    (rarity: Rarity) => setStoredRarity(rarity),
    [setStoredRarity]
  )

  return {
    zoneId,
    setZoneId,
    levelPicked,
    markLevelPicked,
    resetPicks,
    rarities,
    target,
    setRarity,
  }
}
