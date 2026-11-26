import { useCallback } from "react"
import { rarityOrder } from "@workspace/game-domain"
import type { Rarity } from "@workspace/game-domain"

import { usePersistedSelection } from "@/shared/lib"

import {
  GUILD_WAR_SLOTS,
  tierRarityCaps,
  zoneKindId,
  zoneTierId,
} from "../lib/season"
import type { GuildWarSeason } from "../lib/season"
import type { GuildWarAttack } from "./types"

/** The zone last attacked, per device like the app's other quick picks (plan row 5). */
const LAST_ZONE_STORAGE_KEY = "guildWar.zone"
const NONE = ""
const isStoredString = (value: unknown): value is string =>
  typeof value === "string"

/** A stored zone as it applies to a season, as its kind (a stored "Bunker2" picks Bunker): one the
 *  season does not have reads as not picked. */
export function resolveZone(
  stored: string,
  season: GuildWarSeason | undefined
): string | null {
  return season?.zones.some((zone) => zone.id === stored) === true
    ? zoneKindId(season, stored)
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

/** The rarities an edited attack can be moved to in a zone: the zone's caps at the war's level,
 *  and, in the attack's own zone, its cap even when a changed level no longer has it. */
export function editRarities(
  season: GuildWarSeason | undefined,
  battlefieldLevel: number,
  attack: GuildWarAttack,
  zoneId: string
): ZoneRarity[] {
  const rarities = zoneRarities(season, battlefieldLevel, zoneId)
  const ownZone = zoneId === zoneKindId(season, attack.zoneId)
  return ownZone && rarities.every((entry) => entry.rarity !== attack.rarityCap)
    ? [{ rarity: attack.rarityCap, slot: attack.slot }, ...rarities]
    : rarities
}

/** The zone and slot an edited attack is saved at: its own while neither the zone nor the rarity
 *  changed (the slot keeps its cap), else the picked zone and the picked rarity's first slot. */
export function editTarget(
  attack: GuildWarAttack,
  season: GuildWarSeason | undefined,
  zoneId: string,
  rarity: ZoneRarity | undefined
): { zoneId: string; slot: number } | undefined {
  const unchanged =
    zoneId === zoneKindId(season, attack.zoneId) &&
    (rarity === undefined || rarity.rarity === attack.rarityCap)
  if (unchanged) return { zoneId: attack.zoneId, slot: attack.slot }
  return rarity ? { zoneId, slot: rarity.slot } : undefined
}
