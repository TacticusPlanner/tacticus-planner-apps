import {
  eventMissions,
  runInputValues,
  type LegendaryEvent,
  type LegendaryEventRun,
} from "@/entities/legendary-event"

import type { StepTarget } from "./plan-ceiling"
import type { PlanEconomy } from "./plan-inputs"

/** One plan run in the Assumptions header: missions planned of the catalog's, and the bundle. */
export interface RunAssumption {
  run: LegendaryEventRun
  missions: number
  of: number
  bundle: boolean
}

/** The Assumptions header's facts per plan run (spec: run inputs sit in a collapsed Assumptions
 *  panel summarised per run). Premium missions and the bundle count only with paid options on. */
export function runAssumptions(
  event: Pick<LegendaryEvent, "regularMissions" | "premiumMissions">,
  economy: PlanEconomy,
  runs: readonly LegendaryEventRun[]
): RunAssumption[] {
  const regular = eventMissions(event, "regular").length
  const premium = eventMissions(event, "premium").length
  const paid = economy.showPaidOptions
  return runs.map((run) => {
    const values = runInputValues(economy.runs, run)
    return {
      run,
      missions: values.regularMissions + (paid ? values.premiumMissions : 0),
      of: regular + (paid ? premium : 0),
      bundle: paid && values.bundlePurchased,
    }
  })
}

/** A target card's bar (spec: a bar of the synced and fully upgraded ceilings against the
 *  target): each segment's share of the target, capped at 100%. */
export function targetBar(
  target: StepTarget,
  syncedCeiling: number,
  upgradedCeiling: number
): { synced: number; upgraded: number } | null {
  if (target.kind !== "points" || target.points <= 0) return null
  const share = (ceiling: number) =>
    Math.min(100, Math.max(0, (ceiling * 100) / target.points))
  const synced = share(syncedCeiling)
  return { synced, upgraded: Math.max(synced, share(upgradedCeiling)) }
}
