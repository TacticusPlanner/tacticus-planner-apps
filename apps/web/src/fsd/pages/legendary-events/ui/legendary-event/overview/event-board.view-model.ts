import {
  derivedTeamCoverage,
  objectiveClearedCounts,
  type LaneProgressView,
  type LegendaryEventLane,
  type LegendaryEventObjective,
  type LegendaryEventTeam,
  type LegendaryEventUnit,
} from "@/entities/legendary-event"

/** One lane objective on the Event board: its synced cleared count and how many saved teams on
 *  the lane cover it (0 marks a gap in the plan). */
export interface EventBoardObjective {
  objective: LegendaryEventObjective
  /** Battles that cleared it; null while progress is unavailable. */
  cleared: number | null
  battles: number
  coveringTeams: number
}

/** One saved team on the Event board, in lane order. */
export interface EventBoardTeam {
  team: LegendaryEventTeam
  /** The stored objectives the current members still derive, in objective order. */
  coveredObjectiveIndexes: number[]
}

export interface EventBoardLane {
  objectives: EventBoardObjective[]
  teams: EventBoardTeam[]
}

type BoardLane = Pick<
  LegendaryEventLane,
  "allowedUnitsFilter" | "unitsRestrictions" | "battleIds"
>

/**
 * A lane's column on the Overview Event board: every objective in objective order with its
 * cleared count and covering-team count, then the lane's saved teams (already in stored order)
 * with the objectives they cover. A team covers an objective when it is stored on the team and
 * the members still derive it, as the team card counts it in points.
 */
export function buildEventBoardLane(
  lane: BoardLane,
  teams: readonly LegendaryEventTeam[],
  units: readonly LegendaryEventUnit[],
  progress: LaneProgressView | undefined
): EventBoardLane {
  const ordered = [...lane.unitsRestrictions].sort((a, b) => a.index - b.index)
  const boardTeams = teams.map((team): EventBoardTeam => {
    const derived = new Set(
      derivedTeamCoverage(team.memberUnitIds, lane, units)
    )
    const stored = new Set(team.objectiveIndexes)
    return {
      team,
      coveredObjectiveIndexes: ordered
        .map((objective) => objective.index)
        .filter((index) => stored.has(index) && derived.has(index)),
    }
  })
  const counts = progress
    ? objectiveClearedCounts(progress, ordered.length)
    : undefined
  const battles = progress ? progress.battles.length : lane.battleIds.length
  return {
    objectives: ordered.map((objective, position) => ({
      objective,
      cleared: counts ? (counts[position] ?? 0) : null,
      battles,
      coveringTeams: boardTeams.filter((entry) =>
        entry.coveredObjectiveIndexes.includes(objective.index)
      ).length,
    })),
    teams: boardTeams,
  }
}
