import type { TFunction } from "i18next"

import {
  NO_BLOCKERS,
  UNKNOWN_PROGRESS,
  type GoalOverviewMetrics,
  type GoalRow,
} from "@/features/goal-planning"
import { formatGoalRemainingText } from "../shared/goal-remaining-text"
import type { XpBookFigure } from "../shared/level-requirement-display"
import {
  estimateEnergy,
  estimateOnslaughtTokens,
  estimateShopSpend,
  goalXpBookFigure,
  isReachedRow,
  type GoalsListProps,
} from "./goal-row-utils"

/** The per-goal maps a row or card reads its own slice of. */
export type GoalRowSources = Pick<
  GoalsListProps,
  | "estimates"
  | "metrics"
  | "levelChargedXp"
  | "levelPoolXpAvailable"
  | "xpBook"
  | "reachedByGoalId"
>

/** Everything a goal card displays that is derived rather than read straight off the row. */
export type GoalRowData = {
  progress: GoalOverviewMetrics["progress"]
  remaining: GoalOverviewMetrics["remaining"]
  levelRequirement: GoalOverviewMetrics["levelRequirement"] | undefined
  blockers: GoalOverviewMetrics["blockers"]
  energy: number | undefined
  onslaughtTokens: number | undefined
  shopSpend: ReturnType<typeof estimateShopSpend>
  reached: boolean
  xpBooks: XpBookFigure | undefined
  remainingText: string | null
}

/** One goal's derived display values from the page's per-goal maps. A Reached goal shows no XP-book
 *  figure, since its level requirement no longer matters. */
export function deriveGoalRowData(
  row: GoalRow,
  sources: GoalRowSources,
  t: TFunction,
  language: string | undefined
): GoalRowData {
  const metrics = sources.metrics?.get(row.goalId)
  const estimate = sources.estimates?.get(row.goalId)
  const progress = metrics?.progress ?? UNKNOWN_PROGRESS
  const remaining = metrics?.remaining ?? null
  const energy = estimateEnergy(estimate)
  const reached = isReachedRow(row, sources.reachedByGoalId)
  return {
    progress,
    remaining,
    levelRequirement: metrics?.levelRequirement,
    blockers: metrics?.blockers ?? NO_BLOCKERS,
    energy,
    onslaughtTokens: estimateOnslaughtTokens(estimate),
    shopSpend: estimateShopSpend(estimate),
    reached,
    xpBooks: reached
      ? undefined
      : goalXpBookFigure(
          sources.levelChargedXp?.get(row.goalId),
          sources.levelPoolXpAvailable?.get(row.goalId),
          sources.xpBook
        ),
    remainingText: formatGoalRemainingText(
      t,
      language,
      progress,
      remaining,
      energy
    ),
  }
}
