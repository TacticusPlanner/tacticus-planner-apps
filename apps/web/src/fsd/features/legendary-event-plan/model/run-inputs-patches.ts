import {
  doneMissionIndexes,
  type LegendaryEventMission,
  type LegendaryEventMissionTrack,
  type LegendaryEventPlan,
  type LegendaryEventRun,
  type LegendaryEventRunInputValues,
  type LegendaryEventRunResolution,
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
    a.closeShards === b.closeShards &&
    sameIndexes(a.completedRegularMissions, b.completedRegularMissions) &&
    sameIndexes(a.completedPremiumMissions, b.completedPremiumMissions)
  )
}

function sameIndexes(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false
  const sorted = [...b].sort((x, y) => x - y)
  return [...a].sort((x, y) => x - y).every((value, i) => value === sorted[i])
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

const TRACK_FIELDS = {
  regular: { ticks: "completedRegularMissions", count: "regularMissions" },
  premium: { ticks: "completedPremiumMissions", count: "premiumMissions" },
} as const

/**
 * Setting how many of a track's missions are done (spec: missions are done in order): the first
 * `count` missions in order are stored Done, and the track's Plan to complete count is raised to it
 * when it would pass it; lowering Done leaves the count.
 */
export function missionDonePatch(
  values: LegendaryEventRunInputValues,
  track: LegendaryEventMissionTrack,
  missions: readonly LegendaryEventMission[],
  count: number
): Partial<LegendaryEventRunInputValues> {
  const fields = TRACK_FIELDS[track]
  const done = Math.max(0, Math.min(missions.length, count))
  return {
    [fields.ticks]: doneMissionIndexes(missions, done),
    [fields.count]: Math.max(values[fields.count], done),
  }
}

/** The run the Run status card edits (spec: current run inputs): the run in progress, else the
 *  next one; null while the run is unknown or after the last run. */
export function runInputsFocusRun(
  runs: LegendaryEventRunResolution
): LegendaryEventRun | null {
  return runs.currentRun ?? runs.nextRun
}
