import type { BattleProgressOverride } from "@/entities/player-data-override"

/** One reached battle of a standing campaign, as the battle progress dialog lists it. */
export type BattleProgressRow = {
  battleId: string
  nodeNumber: number
  /** Reached but never beaten: always played manually, so its medals can't be edited. */
  frontier: boolean
}

/**
 * The battles of one standing campaign the player has reached, in node order: every battle up to
 * and including the frontier (the synced `highestCompletedBattleIndex`). A track with no progress
 * has none.
 */
export function reachedBattleRows(
  battles: readonly {
    id: string
    campaignGroupId: string
    nodeNumber: number
    battleIndex: number
  }[],
  campaignGroupId: string,
  highestCompletedBattleIndex: number | undefined
): BattleProgressRow[] {
  const highest = highestCompletedBattleIndex ?? -1
  return battles
    .filter(
      (battle) =>
        battle.campaignGroupId === campaignGroupId &&
        battle.battleIndex <= highest
    )
    .toSorted((a, b) => a.battleIndex - b.battleIndex)
    .map((battle) => ({
      battleId: battle.id,
      nodeNumber: battle.nodeNumber,
      frontier: battle.battleIndex === highest,
    }))
}

/** Medals recorded for a battle; a battle with no entry counts as 3 (raidable). */
export function medalsOf(
  overrides: readonly BattleProgressOverride[],
  battleId: string
): number {
  return overrides.find((entry) => entry.battleId === battleId)?.medals ?? 3
}

/**
 * Sets a battle's medals. An entry at 3 medals with nothing else recorded is dropped, so the saved
 * list only holds what differs from the default.
 */
export function withMedals(
  overrides: readonly BattleProgressOverride[],
  battleId: string,
  medals: number
): BattleProgressOverride[] {
  const current = overrides.find((entry) => entry.battleId === battleId)
  const next: BattleProgressOverride = {
    battleId,
    medals,
    lightningVictory: current?.lightningVictory ?? null,
    milestone: current?.milestone ?? null,
  }
  const others = overrides.filter((entry) => entry.battleId !== battleId)
  const isDefault =
    medals === 3 && next.lightningVictory === null && next.milestone === null
  return isDefault ? others : [...others, next]
}
