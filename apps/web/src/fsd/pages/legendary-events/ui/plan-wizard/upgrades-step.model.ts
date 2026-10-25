import type { LegendaryEventRun } from "@/entities/legendary-event"

import type { UpgradeRecommendation } from "./plan-upgrades"

export interface UpgradeGroup {
  run: LegendaryEventRun
  /** Indexes into the recommendation list, in list order. */
  indexes: number[]
}

/** The recommendations grouped by the first run they help ("Ready for run N"), in run order,
 *  keeping the list order within a group. */
export function upgradeGroups(
  recommendations: readonly Pick<UpgradeRecommendation, "firstRun">[]
): UpgradeGroup[] {
  const byRun = new Map<LegendaryEventRun, number[]>()
  recommendations.forEach((recommendation, index) => {
    byRun.set(recommendation.firstRun, [
      ...(byRun.get(recommendation.firstRun) ?? []),
      index,
    ])
  })
  return [...byRun]
    .sort(([a], [b]) => a - b)
    .map(([run, indexes]) => ({ run, indexes }))
}
