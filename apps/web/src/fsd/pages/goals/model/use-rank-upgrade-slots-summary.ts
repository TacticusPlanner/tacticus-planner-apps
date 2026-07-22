import type { Rank, UpgradeId } from "@workspace/game-domain"

/**
 * How many of the current rank's own upgrade slots are already applied — the small "3/6" badge
 * next to the read-only "Current rank" field in `use-create-goal-form.ts` (split out purely for
 * that file's own max-lines budget). `rankUpgradeSlotsTotal` comes from the catalog (so it's known
 * even for a locked/unowned character); `rankAppliedUpgrades` is 0 until synced player data
 * resolves, deduplicated and capped the same way the backend's achievement check treats
 * `appliedUpgradeSlots` (`GoalAchievementEvaluator.RankAchieved`'s `.Distinct().Count()`).
 */
export function useRankUpgradeSlotsSummary(
  character:
    { rankUpUpgrades: { rank: Rank; upgradeIds: UpgradeId[] }[] } | undefined,
  rankStart: Rank,
  playerCharacter: { appliedUpgradeSlots: number[] } | undefined
) {
  const rankUpgradeSlotsTotal =
    character?.rankUpUpgrades.find((entry) => entry.rank === rankStart)
      ?.upgradeIds.length ?? 0
  const rankAppliedUpgrades = Math.min(
    playerCharacter ? new Set(playerCharacter.appliedUpgradeSlots).size : 0,
    rankUpgradeSlotsTotal
  )

  return { rankUpgradeSlotsTotal, rankAppliedUpgrades }
}
