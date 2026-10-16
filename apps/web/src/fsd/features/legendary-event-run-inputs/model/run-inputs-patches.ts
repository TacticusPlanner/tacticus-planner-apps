import type {
  LegendaryEventPlan,
  LegendaryEventRun,
  LegendaryEventRunInputValues,
} from "@/entities/legendary-event"

/** How a run reads in the drawer: before the current run, the current run, or after it. */
export type RunInputsPhase = "done" | "now" | "planned"

export function runInputsPhase(
  run: LegendaryEventRun,
  currentRun: LegendaryEventRun
): RunInputsPhase {
  if (run < currentRun) return "done"
  return run === currentRun ? "now" : "planned"
}

export function sameRunInputValues(
  a: LegendaryEventRunInputValues,
  b: LegendaryEventRunInputValues
): boolean {
  return (
    a.regularMissions === b.regularMissions &&
    a.premiumMissions === b.premiumMissions &&
    a.bundlePurchased === b.bundlePurchased &&
    a.closeShards === b.closeShards
  )
}

/** The plan with `run`'s inputs replaced (or added, keeping `runs` ascending), the way the server
 *  will persist it. */
export function withRunInputs(
  plan: LegendaryEventPlan,
  run: LegendaryEventRun,
  values: LegendaryEventRunInputValues,
  updatedAt: string
): LegendaryEventPlan {
  const others = (plan.runs ?? []).filter((entry) => entry.run !== run)
  return {
    ...plan,
    runs: [...others, { run, ...values, updatedAt }].sort(
      (a, b) => a.run - b.run
    ),
  }
}
