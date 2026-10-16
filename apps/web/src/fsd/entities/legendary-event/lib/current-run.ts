import type {
  LegendaryEventRun,
  LegendaryEventTeam,
  LegendaryEventTeamRunDepth,
} from "../model/plan.types"
import type { LegendaryEventRunResolution } from "./run-resolution"

/**
 * The run a clear depth is read from and written to (spec: clear depth is a manual stepper per
 * run): the run in progress, else the next run to start, else run 1 (an unknown run, or every run
 * over). The run comes from `resolveLegendaryEventRuns`, not from the synced `currentEventRun`
 * alone, which the game sends only while a run is active.
 */
export function currentLegendaryEventRun(
  resolution: Pick<LegendaryEventRunResolution, "currentRun" | "nextRun">
): LegendaryEventRun {
  return resolution.currentRun ?? resolution.nextRun ?? 1
}

/** The team's stored depth for `run`, or null when that run has none. */
export function teamDepthForRun(
  team: Pick<LegendaryEventTeam, "runDepths">,
  run: LegendaryEventRun
): LegendaryEventTeamRunDepth | null {
  return team.runDepths.find((depth) => depth.run === run) ?? null
}
