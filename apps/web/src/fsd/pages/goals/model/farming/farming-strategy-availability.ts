import type { FarmingStrategy } from "@/entities/goal"
import { farmingStageTargets } from ".//farming-stages"

/** Why a `FarmingStrategy` option is disabled — drives the Select item's tooltip/explanation text
 * (see `farming-strategy-field.tsx`). `null` means the option is available. */
export type FarmingStrategyUnavailableReason =
  "singleRank" | "tooFewMilestones" | "tooFewMajorMilestones" | null

/**
 * Which farming-strategy options are actually selectable for the progression range `start` -> `end`
 * (rank indices for `"rank"`, raw ability levels for `"ability"`), plus why any that aren't are
 * disabled:
 * - `TotalUpgrades` is always available.
 * - `EveryStep` ("Rank by Rank"/"every step") needs the range to span more than one full unit, or
 *   exactly one unit with a non-`"None"` Additional target (Rank goals only — a target rank's own
 *   partial-upgrade selection is itself a second checkpoint beyond the clean rank boundary).
 * - `Milestones`/`MajorMilestones` need at least 2 checkpoint stages within the range (reusing the
 *   same `farmingStageTargets` calc that produces the chain preview, so "available" and "what it
 *   actually produces" can never disagree).
 */
export function farmingStrategyAvailability(
  context: "rank" | "ability",
  start: number,
  end: number,
  hasAdditionalTarget: boolean
): Record<FarmingStrategy, FarmingStrategyUnavailableReason> {
  const span = end - start
  const everyStepAvailable = span > 1 || (span === 1 && hasAdditionalTarget)
  const milestoneCount = farmingStageTargets(
    context,
    start,
    end,
    "Milestones"
  ).length
  const majorMilestoneCount = farmingStageTargets(
    context,
    start,
    end,
    "MajorMilestones"
  ).length

  return {
    TotalUpgrades: null,
    EveryStep: everyStepAvailable ? null : "singleRank",
    Milestones: milestoneCount >= 2 ? null : "tooFewMilestones",
    MajorMilestones: majorMilestoneCount >= 2 ? null : "tooFewMajorMilestones",
  }
}
