import { useCallback } from "react"
import { rarityOrder } from "@workspace/game-domain"
import type { Rarity } from "@workspace/game-domain"

import { usePersistedSelection } from "@/shared/lib"

import type { GuildWarSeason } from "../lib/season"
import { useLastZone, zoneRarities } from "./attack-target"
import type { ZoneRarity } from "./attack-target"

/** The defenders' rarity last picked, per device like the zone. */
const LAST_RARITY_STORAGE_KEY = "guildWar.rarity"
const NONE = ""
const isStoredRarity = (value: unknown): value is Rarity | typeof NONE =>
  value === NONE || rarityOrder.some((rarity) => rarity === value)

/** The zone's rarity to attack at: the one picked when the zone has it, else its highest cap. */
export function pickRarity(
  rarities: readonly ZoneRarity[],
  picked: Rarity | undefined
): ZoneRarity | undefined {
  return rarities.find((entry) => entry.rarity === picked) ?? rarities[0]
}

/**
 * The zone and defenders' rarity the Offense page attacks at, both kept per device: the zone last
 * picked and, of that zone's caps at the war's level, the rarity last picked (else the highest).
 * They cap the units the page shows and are what Won, Lost and Log with details log at.
 */
export function usePageTarget(
  season: GuildWarSeason | undefined,
  battlefieldLevel: number
) {
  const [zoneId, setZoneId] = useLastZone(season)
  const [stored, setStored] = usePersistedSelection(
    LAST_RARITY_STORAGE_KEY,
    isStoredRarity,
    NONE
  )
  const rarities = zoneRarities(season, battlefieldLevel, zoneId)
  const target = pickRarity(rarities, stored === NONE ? undefined : stored)
  const setRarity = useCallback(
    (rarity: Rarity) => setStored(rarity),
    [setStored]
  )
  return { zoneId, setZoneId, rarities, target, setRarity }
}
