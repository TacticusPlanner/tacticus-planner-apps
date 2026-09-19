import {
  computeLevelMerges,
  excludeMergedLevelGoals,
  levelGoalIdByParent,
} from "./level-goal-merge"
import type { GoalRow } from "./types"

/**
 * A Level goal with exactly one dependent merges into that goal's row as a sub-line (Cluster 7's
 * Level-goal decision) — computed over the flat, ungrouped set, since grouping by type would
 * otherwise separate a Level goal from the Rank/Ability goal it merges into.
 */
export function useLevelGoalMerges(rows: GoalRow[]) {
  const merges = computeLevelMerges(rows)
  return {
    displayRows: excludeMergedLevelGoals(rows, merges),
    levelGoalIdByParent: levelGoalIdByParent(merges),
  }
}
