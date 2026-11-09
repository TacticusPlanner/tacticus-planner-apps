import type { LegendaryEventEstimateSnapshot } from "./analytics-event"

/** A clear estimate snapshot as PostHog properties (snake_case). */
export function estimateSnapshotProperties(
  snapshot: LegendaryEventEstimateSnapshot
) {
  return {
    sure_depth: snapshot.sureDepth,
    stretch_depth: snapshot.stretchDepth,
    effective_power: snapshot.effectivePower,
    team_power: snapshot.teamPower,
    member_count: snapshot.memberCount,
    curve_version: snapshot.curveVersion,
  }
}
