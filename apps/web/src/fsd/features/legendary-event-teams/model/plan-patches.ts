import {
  teamDepthForRun,
  type CreateTeamRequest,
  type LegendaryEventLaneId,
  type LegendaryEventPlan,
  type LegendaryEventRun,
  type LegendaryEventTeam,
  type UpdateTeamRequest,
} from "@/entities/legendary-event"

/** What the team editor submits: everything a team carries except its lane, order and id. The
 *  depth is the current run's. */
export interface TeamDraft {
  name: string
  memberUnitIds: string[]
  reserveUnitId: string | null
  objectiveIndexes: number[]
  expectedBattleClears: number | null
}

/** A lane's teams in their stored order. */
export function laneTeams(
  plan: Pick<LegendaryEventPlan, "teams">,
  laneId: LegendaryEventLaneId
): LegendaryEventTeam[] {
  return plan.teams
    .filter((team) => team.laneId === laneId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

/** Whether `teamIds` is the lane's current order already (a no-op reorder is not sent). */
export function isCurrentLaneOrder(
  plan: Pick<LegendaryEventPlan, "teams">,
  laneId: LegendaryEventLaneId,
  teamIds: readonly string[]
): boolean {
  const current = laneTeams(plan, laneId).map((team) => team.id)
  return (
    current.length === teamIds.length &&
    current.every((id, index) => id === teamIds[index])
  )
}

/** The plan with a lane's teams in the given order (dense 0-based `sortOrder`), the way the server
 *  will persist it. Ids not on the lane are ignored; lane teams missing from `teamIds` keep their
 *  relative order after the listed ones. */
export function withLaneOrder(
  plan: LegendaryEventPlan,
  laneId: LegendaryEventLaneId,
  teamIds: readonly string[]
): LegendaryEventPlan {
  const lane = laneTeams(plan, laneId)
  const ordered = [
    ...teamIds.flatMap((id) => lane.filter((team) => team.id === id)),
    ...lane.filter((team) => !teamIds.includes(team.id)),
  ]
  const orderOf = new Map(ordered.map((team, index) => [team.id, index]))
  return {
    ...plan,
    teams: sortPlanTeams(
      plan.teams.map((team) =>
        orderOf.has(team.id)
          ? { ...team, sortOrder: orderOf.get(team.id)! }
          : team
      )
    ),
  }
}

/** The plan without the team, its lane re-densified. */
export function withoutTeam(
  plan: LegendaryEventPlan,
  teamId: string
): LegendaryEventPlan {
  const removed = plan.teams.find((team) => team.id === teamId)
  if (!removed) return plan
  const remaining = {
    ...plan,
    teams: plan.teams.filter((t) => t.id !== teamId),
  }
  return withLaneOrder(
    remaining,
    removed.laneId,
    laneTeams(remaining, removed.laneId).map((team) => team.id)
  )
}

/** The plan with one team's depth for `run` set (or removed with null), other runs untouched. */
export function withTeamDepth(
  plan: LegendaryEventPlan,
  teamId: string,
  run: LegendaryEventRun,
  depth: number | null,
  recordedAt: string
): LegendaryEventPlan {
  return {
    ...plan,
    teams: plan.teams.map((team) => {
      if (team.id !== teamId) return team
      const others = team.runDepths.filter((entry) => entry.run !== run)
      const runDepths =
        depth === null
          ? others
          : [
              ...others,
              {
                run,
                expectedBattleClears: depth,
                expectedBattleClearsSource: "manual" as const,
                recordedAt,
              },
            ].sort((a, b) => a.run - b.run)
      return { ...team, runDepths }
    }),
  }
}

const LANE_ORDER: Record<LegendaryEventLaneId, number> = {
  alpha: 0,
  beta: 1,
  gamma: 2,
}

function sortPlanTeams(teams: LegendaryEventTeam[]): LegendaryEventTeam[] {
  return [...teams].sort(
    (a, b) =>
      LANE_ORDER[a.laneId] - LANE_ORDER[b.laneId] || a.sortOrder - b.sortOrder
  )
}

/** The draft of an existing team, for a depth-only write from its card. */
export function draftOfTeam(
  team: LegendaryEventTeam,
  run: LegendaryEventRun
): TeamDraft {
  return {
    name: team.name,
    memberUnitIds: team.memberUnitIds,
    reserveUnitId: team.reserveUnitId,
    objectiveIndexes: team.objectiveIndexes,
    expectedBattleClears:
      teamDepthForRun(team, run)?.expectedBattleClears ?? null,
  }
}

/**
 * The update body for a draft (design D8): the depth goes to `run` only. A depth the user changed
 * is `manual`; an unchanged one keeps its stored source; a null depth carries a null source.
 */
export function teamUpdateRequest(
  draft: TeamDraft,
  run: LegendaryEventRun,
  expectedRevision: number,
  stored?: LegendaryEventTeam
): UpdateTeamRequest {
  const storedDepth = stored ? teamDepthForRun(stored, run) : null
  const depth = draft.expectedBattleClears
  const source =
    depth === null
      ? null
      : storedDepth?.expectedBattleClears === depth
        ? storedDepth.expectedBattleClearsSource
        : "manual"
  return {
    expectedRevision,
    name: draft.name.trim(),
    memberUnitIds: draft.memberUnitIds,
    reserveUnitId: draft.reserveUnitId,
    objectiveIndexes: [...draft.objectiveIndexes].sort((a, b) => a - b),
    run,
    expectedBattleClears: depth,
    expectedBattleClearsSource: source,
  }
}

export function teamCreateRequest(
  laneId: LegendaryEventLaneId,
  draft: TeamDraft,
  run: LegendaryEventRun,
  expectedRevision: number
): CreateTeamRequest {
  return { ...teamUpdateRequest(draft, run, expectedRevision), laneId }
}
