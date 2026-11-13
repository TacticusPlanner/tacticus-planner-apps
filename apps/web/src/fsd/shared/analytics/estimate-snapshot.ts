import type {
  LegendaryEventBattleSnapshot,
  LegendaryEventEstimateSnapshot,
} from "./analytics-event"

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
    unit_ids: snapshot.unitIds,
    objective_indexes: snapshot.objectiveIndexes,
    member_powers: snapshot.memberPowers,
    top_member_share: snapshot.topMemberShare,
    curve_version: snapshot.curveVersion,
  }
}

/** A token's battle snapshot as PostHog properties (snake_case). */
export function battleSnapshotProperties(
  snapshot: LegendaryEventBattleSnapshot
) {
  return {
    battle_power: snapshot.battlePower,
    power_ratio: snapshot.powerRatio,
  }
}
