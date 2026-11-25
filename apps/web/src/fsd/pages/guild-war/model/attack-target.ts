import { useCallback, useMemo } from "react"

import { usePersistedSelection } from "@/shared/lib"

import { isGuildWarSlot } from "../lib/season"
import type { GuildWarSeason } from "../lib/season"

/** Per device, like the app's other quick filters, and never in the URL (plan row 5). */
const ATTACK_ZONE_STORAGE_KEY = "guildWar.zone"
const ATTACK_SLOT_STORAGE_KEY = "guildWar.slot"

const NONE = ""
const isStoredString = (value: unknown): value is string =>
  typeof value === "string"

/** The zone and slot being attacked; null while none is picked. */
export interface AttackTarget {
  zoneId: string | null
  slot: number | null
}

/** The stored target as it applies to a season: a zone the season does not have, or a slot outside
 *  1 to 5, reads as not picked. */
export function resolveAttackTarget(
  stored: { zone: string; slot: string },
  season: GuildWarSeason | undefined
): AttackTarget {
  const zoneId =
    season?.zones.some((zone) => zone.id === stored.zone) === true
      ? stored.zone
      : null
  const slot = stored.slot === NONE ? Number.NaN : Number(stored.slot)
  return { zoneId, slot: isGuildWarSlot(slot) ? slot : null }
}

/** The remembered zone and slot (local storage), checked against the war's season. */
export function useAttackTarget(season: GuildWarSeason | undefined) {
  const [zone, setZone] = usePersistedSelection(
    ATTACK_ZONE_STORAGE_KEY,
    isStoredString,
    NONE
  )
  const [slot, setSlot] = usePersistedSelection(
    ATTACK_SLOT_STORAGE_KEY,
    isStoredString,
    NONE
  )
  const target = useMemo(
    () => resolveAttackTarget({ zone, slot }, season),
    [zone, slot, season]
  )
  const setZoneId = useCallback(
    (zoneId: string | null) => setZone(zoneId ?? NONE),
    [setZone]
  )
  const setSlotIndex = useCallback(
    (next: number | null) => setSlot(next === null ? NONE : String(next)),
    [setSlot]
  )
  return { target, setZoneId, setSlot: setSlotIndex }
}
