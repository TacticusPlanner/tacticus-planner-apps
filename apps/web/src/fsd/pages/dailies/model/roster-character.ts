import type { Progression, Rank, UnitId } from "@workspace/game-domain"

/** One owned character, with the raw fields the team engines need. `progression` is the synced
 * progression step (the player-data `progressionIndex` field). */
export type RosterCharacter = {
  unitId: UnitId
  rank: Rank
  progression: Progression
  xpLevel: number
  /** Distinct applied current-rank upgrade slots. */
  appliedUpgradeSlots: readonly number[]
  activeAbilityLevel: number
  passiveAbilityLevel: number
  equippedItems: readonly { equipmentId: string; level: number }[]
}

/** A synced roster record, narrowed to the fields the mapper reads (`progressionIndex` carries the
 * progression step; `abilities[0]`/`[1]` are the active/passive tracks). */
export type RawRosterCharacter = {
  unitId: UnitId
  rank: Rank
  progressionIndex: Progression
  xpLevel: number
  appliedUpgradeSlots: readonly number[]
  abilities: readonly { level: number }[]
  equippedItems?: readonly { equipmentId: string; level: number }[]
}

/** Maps a synced roster record to the team engines' character shape. */
export function mapRosterCharacter(
  record: RawRosterCharacter
): RosterCharacter {
  return {
    unitId: record.unitId,
    rank: record.rank,
    progression: record.progressionIndex,
    xpLevel: record.xpLevel,
    appliedUpgradeSlots: [...new Set(record.appliedUpgradeSlots)],
    activeAbilityLevel: record.abilities[0]?.level ?? 1,
    passiveAbilityLevel: record.abilities[1]?.level ?? 1,
    equippedItems: (record.equippedItems ?? []).map(
      ({ equipmentId, level }) => ({ equipmentId, level })
    ),
  }
}
