import type {
  LegendaryEventRun,
  LegendaryEventTeam,
  LegendaryEventTeamRunDepth,
} from "../model/plan.types"
import type { LegendaryEventProgress } from "../model/types"

/**
 * The run a depth write targets (design D8): the synced `currentEventRun` of the event's
 * `lre-progress` entry clamped to 1..3, or 1 when the account has no entry (or no run) for it. The
 * catalog carries no run number, so synced progress is the only source.
 */
export function currentLegendaryEventRun(
  progressEntry: Pick<LegendaryEventProgress, "currentEventRun"> | undefined
): LegendaryEventRun {
  const run = progressEntry?.currentEventRun
  if (typeof run !== "number" || !Number.isFinite(run)) return 1
  return Math.min(3, Math.max(1, Math.trunc(run))) as LegendaryEventRun
}

/** The team's stored depth for `run`, or null when that run has none. */
export function teamDepthForRun(
  team: Pick<LegendaryEventTeam, "runDepths">,
  run: LegendaryEventRun
): LegendaryEventTeamRunDepth | null {
  return team.runDepths.find((depth) => depth.run === run) ?? null
}
