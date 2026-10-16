import type {
  LegendaryEventPlan,
  LegendaryEventRun,
  LegendaryEventRunInputValues,
  LegendaryEventRunResolution,
} from "@/entities/legendary-event"

/** How a run reads in the drawer: ended, in progress, or still to come. */
export type RunInputsPhase = "done" | "now" | "planned"

/**
 * A run's phase against the resolved runs (spec: legendary-event-run-resolution): ended runs are
 * Done, the run in progress is Now (active events only) and the rest are Planned. Null while the
 * run is unknown, so no run is labelled.
 */
export function runInputsPhase(
  run: LegendaryEventRun,
  runs: LegendaryEventRunResolution
): RunInputsPhase | null {
  if (runs.kind === "unknown") return null
  if (run <= runs.endedRuns) return "done"
  return run === runs.currentRun ? "now" : "planned"
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
