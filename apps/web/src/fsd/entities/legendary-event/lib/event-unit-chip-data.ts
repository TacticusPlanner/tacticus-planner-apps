import type { Progression, Rank } from "@workspace/game-domain"

import type { LegendaryEventRosterUnit } from "../model/types"

/** What a unit chip shows (the Event board, team cards, the team picker): ownership, then (owned
 *  only) its rank, ascension and ability levels. `owned` is undefined when the roster is
 *  unavailable. */
export interface EventUnitChipData {
  unitId: string
  owned: boolean | undefined
  rank?: Rank
  progression?: Progression
  activeLevel?: number
  passiveLevel?: number
}

/** An owned unit's chip data from its synced roster record (ability levels default to 1). */
export function ownedUnitChipData(
  unitId: string,
  entry: LegendaryEventRosterUnit
): EventUnitChipData {
  return {
    unitId,
    owned: true,
    rank: entry.rank,
    progression: entry.progressionIndex,
    activeLevel: entry.abilities?.[0]?.level ?? 1,
    passiveLevel: entry.abilities?.[1]?.level ?? 1,
  }
}

/** A unit chip's data from the synced roster (`rosterById` undefined: ownership unknown). */
export function eventUnitChipData(
  unitId: string,
  rosterById: ReadonlyMap<string, LegendaryEventRosterUnit> | undefined
): EventUnitChipData {
  if (!rosterById) return { unitId, owned: undefined }
  const entry = rosterById.get(unitId)
  return entry ? ownedUnitChipData(unitId, entry) : { unitId, owned: false }
}
