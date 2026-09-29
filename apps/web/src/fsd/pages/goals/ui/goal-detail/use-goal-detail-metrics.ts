import {
  xpBookEquivalent,
  type EstimateOutcome,
  type RankSlotAllocation,
} from "@/features/goal-farming"
import { useGoalsOverviewMetrics } from "../../model/attainment/use-goals-overview-metrics"

/**
 * The single goal's own overview metrics (progress/remaining/blockers/levelRequirement) plus the
 * required-level guidance's additional-book-equivalent count (surface-goal-farming-guidance), from
 * the same `useGoalsOverviewMetrics` batch shape the Goals/Project list rows use, scoped to one goal
 * id. Split out of `goal-detail-sheet.tsx` to keep that file under this repo's max-lines rule,
 * mirroring `use-goal-detail-acquisition.ts`/`use-goal-detail-save.ts`.
 */
export function useGoalDetailMetrics(params: {
  goalId: string | null
  estimate: EstimateOutcome | undefined
  rankSlotAllocation: RankSlotAllocation | undefined
  levelXpRemaining: number | undefined
  xpBookRarity: string
}) {
  const {
    goalId,
    estimate,
    rankSlotAllocation,
    levelXpRemaining,
    xpBookRarity,
  } = params
  const overviewMetrics = useGoalsOverviewMetrics(
    goalId ? [goalId] : [],
    goalId && estimate ? new Map([[goalId, estimate]]) : undefined,
    goalId && rankSlotAllocation
      ? new Map([[goalId, rankSlotAllocation]])
      : undefined
  )
  return {
    metrics: goalId ? overviewMetrics.get(goalId) : undefined,
    additionalBookCount: xpBookEquivalent(levelXpRemaining ?? 0, xpBookRarity),
  }
}
