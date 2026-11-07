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
  /** The unit's support traits (Healer, Mechanic), shown when the chip has room. */
  supportTraits?: readonly SupportTrait[]
}

/** The support traits a chip marks, in display order (V1's LRE tile shows the same two). */
const SUPPORT_TRAITS = ["Healer", "Mechanic"] as const
type SupportTrait = (typeof SUPPORT_TRAITS)[number]

/** The support traits among `traits`, in display order. */
export function supportTraitsOf(traits: readonly string[]): SupportTrait[] {
  return SUPPORT_TRAITS.filter((trait) => traits.includes(trait))
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

/** A unit chip's data from the synced roster (`rosterById` undefined: ownership unknown), with
 *  the unit's support traits when its catalog `traits` are given. */
export function eventUnitChipData(
  unitId: string,
  rosterById: ReadonlyMap<string, LegendaryEventRosterUnit> | undefined,
  traits?: readonly string[]
): EventUnitChipData {
  const supports = traits ? supportTraitsOf(traits) : []
  const extra = supports.length > 0 ? { supportTraits: supports } : {}
  if (!rosterById) return { unitId, owned: undefined, ...extra }
  const entry = rosterById.get(unitId)
  return entry
    ? { ...ownedUnitChipData(unitId, entry), ...extra }
    : { unitId, owned: false, ...extra }
}
