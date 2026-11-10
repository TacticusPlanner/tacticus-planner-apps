import type { LegendaryEventAnnotationStatus } from "@/entities/legendary-event"

/**
 * The cells a Next token card action marks (design D5): Couldn't clear marks every cell the token
 * clears Stop here; Partly cleared marks its objective cells Maybe clear, or its defeat-all cell
 * when it clears no objective.
 */
export function tokenMarkIds(
  clearedIds: readonly number[],
  status: LegendaryEventAnnotationStatus
): number[] {
  if (status === "stopHere") return [...clearedIds]
  const objectives = clearedIds.filter((id) => id > 0)
  return objectives.length > 0
    ? objectives
    : clearedIds.filter((id) => id === 0)
}

/** What a Next token card action does once the token's team fell short. */
export interface TokenMarkOutcome {
  /** The team's new manual depth for the current run: the battles before the one it failed. Null
   *  on battle 1, since a depth is at least 1. */
  depth: number | null
  /** Mark the token's cells too: no other team of the lane reaches the battle, so nobody will. */
  markCells: boolean
}

/**
 * A Partly cleared / Couldn't clear on a token means its team can't clear that battle, not that
 * nobody can: the team's depth becomes manual at the battles before it (battle number − 1), and the
 * cells are marked only when no other team of the lane reaches the battle. Otherwise the plan moves
 * the battle to that team.
 */
export function tokenMarkOutcome(input: {
  teamId: string
  laneId: string
  battleIndex: number
  teams: readonly { id: string; laneId: string }[]
  /** A team's depth this run (manual, else the estimate); null when it has none. */
  depthOf: (teamId: string) => number | null
}): TokenMarkOutcome {
  const otherReaches = input.teams.some(
    (team) =>
      team.id !== input.teamId &&
      team.laneId === input.laneId &&
      (input.depthOf(team.id) ?? 0) > input.battleIndex
  )
  if (input.battleIndex < 1) return { depth: null, markCells: true }
  return { depth: input.battleIndex, markCells: !otherReaches }
}
