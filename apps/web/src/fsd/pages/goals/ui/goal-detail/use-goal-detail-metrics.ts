import {
  levelBookAvailability,
  type EstimateOutcome,
  type RankSlotAllocation,
} from "@/features/goal-farming"
import { useGoalsOverviewMetrics } from "../../model/attainment/use-goals-overview-metrics"

/**
 * The single goal's own overview metrics (progress/remaining/blockers/levelRequirement) plus the
 * required-level guidance's available/needed book-equivalent counts
 * (show-xp-book-availability-per-goal), from the same `useGoalsOverviewMetrics` batch shape the
 * Goals/Project list rows use, scoped to one goal id. Split out of `goal-detail-sheet.tsx` to keep
 * that file under this repo's max-lines rule, mirroring `use-goal-detail-acquisition.ts`/
 * `use-goal-detail-save.ts`.
 */
export function useGoalDetailMetrics(params: {
  goalId: string | null
  estimate: EstimateOutcome | undefined
  rankSlotAllocation: RankSlotAllocation | undefined
  levelChargedXp: number | undefined
  levelPoolXpAvailable: number | undefined
  xpBookRarity: string
}) {
  const {
    goalId,
    estimate,
    rankSlotAllocation,
    levelChargedXp,
    levelPoolXpAvailable,
    xpBookRarity,
  } = params
  const overviewMetrics = useGoalsOverviewMetrics(
    goalId ? [goalId] : [],
    goalId && estimate ? new Map([[goalId, estimate]]) : undefined,
    goalId && rankSlotAllocation
      ? new Map([[goalId, rankSlotAllocation]])
      : undefined
  )
  const { available, needed } = levelBookAvailability(
    levelChargedXp ?? 0,
    levelPoolXpAvailable ?? 0,
    xpBookRarity
  )
  return {
    metrics: goalId ? overviewMetrics.get(goalId) : undefined,
    availableBookCount: available,
    neededBookCount: needed,
  }
}
