import type {
  LegendaryEventRun,
  LegendaryEventRunInputs,
  LegendaryEventRunInputValues,
} from "../model/plan.types"

/** The bound on Oh So Close shards per run (V1's and the API's): at most three chest-sized
 *  (25-shard) awards. */
export const MAX_CLOSE_SHARDS = 75

/** How many regular (free) missions a run has; a run with no stored inputs plans all of them. */
const REGULAR_MISSIONS_PER_RUN = 10

/** A run with no stored inputs (spec: free missions assumed by default): every regular mission
 *  planned, no premium missions, no bundle and no shards. */
export const EMPTY_RUN_INPUT_VALUES: LegendaryEventRunInputValues = {
  regularMissions: REGULAR_MISSIONS_PER_RUN,
  premiumMissions: 0,
  bundlePurchased: false,
  closeShards: 0,
  completedRegularMissions: [],
  completedPremiumMissions: [],
}

/** The stored values of `run` among a plan's `runs`, or the defaults (`EMPTY_RUN_INPUT_VALUES`) when
 *  that run was never written. */
export function runInputValues(
  runs: readonly LegendaryEventRunInputs[] | undefined,
  run: LegendaryEventRun
): LegendaryEventRunInputValues {
  const stored = runs?.find((entry) => entry.run === run)
  return stored
    ? {
        regularMissions: stored.regularMissions,
        premiumMissions: stored.premiumMissions,
        bundlePurchased: stored.bundlePurchased,
        closeShards: stored.closeShards,
        completedRegularMissions: stored.completedRegularMissions ?? [],
        completedPremiumMissions: stored.completedPremiumMissions ?? [],
      }
    : EMPTY_RUN_INPUT_VALUES
}
