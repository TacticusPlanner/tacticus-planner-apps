import {
  derivedTeamCoverage,
  LEGENDARY_EVENT_LANE_IDS,
  objectiveClearedCounts,
  objectivesSatisfied,
  teamPower,
  type ClearEstimateRoster,
  type LaneProgressView,
  type LegendaryEventLane,
  type LegendaryEventLaneId,
  type LegendaryEventObjective,
  type LegendaryEventTeam,
  type LegendaryEventUnit,
  type EventUnitChipData,
} from "@/entities/legendary-event"
import type { UnitPowerContext } from "@/shared/unit-power"

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
interface EventBoardTeam {
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
 * A lane's column on the Teams tab's Event board: every objective in objective order with its
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

/** What a unit chip on the board shows (the entity's chip data). */
export type EventBoardUnit = EventUnitChipData

/** A unit chip's data from the synced roster (`rosterById` undefined: ownership unknown). */
export function eventBoardUnit(
  unitId: string,
  rosterById: ClearEstimateRoster | undefined
): EventBoardUnit {
  if (!rosterById) return { unitId, owned: undefined }
  const entry = rosterById.get(unitId)
  if (!entry) return { unitId, owned: false }
  return {
    unitId,
    owned: true,
    rank: entry.rank,
    progression: entry.progressionIndex,
    activeLevel: entry.abilities?.[0]?.level ?? 1,
    passiveLevel: entry.abilities?.[1]?.level ?? 1,
  }
}

/** One column of a lane's unit table: one objective, or every selected objective merged (V1's
 *  selection), and every allowed unit satisfying all of them, strongest owned first. */
export interface EventBoardTableColumn {
  objectiveIndexes: number[]
  units: EventBoardUnit[]
  /** How many leading units are owned (the "best five" line falls inside them). */
  ownedCount: number
}

type TableLane = Pick<
  LegendaryEventLane,
  "availableUnitIds" | "allowedUnitsFilter" | "unitsRestrictions"
>

/**
 * A lane's unit table, as V1's Teams table drew it: one column per objective (the selected ones
 * merged into a single leading column that lists the units satisfying all of them), each listing
 * the lane's allowed units that satisfy it. Owned units come first by power (strongest first, a
 * unit without power data as 0), then the units the player does not own, by name. Without a
 * roster every unit's ownership is unknown and the column is by name.
 */
export function buildEventBoardTable(
  lane: TableLane,
  units: readonly LegendaryEventUnit[],
  rosterById: ClearEstimateRoster | undefined,
  powerContext: UnitPowerContext | null,
  selectedObjectiveIndexes: ReadonlySet<number>,
  nameOf: (unitId: string) => string
): EventBoardTableColumn[] {
  const allowed = new Set(lane.availableUnitIds)
  const candidates = units
    .filter((unit) => allowed.has(unit.id))
    .map((unit) => {
      const owned = rosterById?.has(unit.id) ?? false
      return {
        id: unit.id,
        owned,
        satisfied: new Set(objectivesSatisfied(unit, lane)),
        power: owned
          ? (teamPower([unit.id], rosterById!, powerContext) ?? 0)
          : 0,
        name: nameOf(unit.id),
      }
    })
    .sort(
      (a, b) =>
        Number(b.owned) - Number(a.owned) ||
        b.power - a.power ||
        a.name.localeCompare(b.name)
    )
  const ordered = [...lane.unitsRestrictions]
    .map((objective) => objective.index)
    .sort((a, b) => a - b)
  const selected = ordered.filter((index) =>
    selectedObjectiveIndexes.has(index)
  )
  const groups = [
    ...(selected.length > 0 ? [selected] : []),
    ...ordered
      .filter((index) => !selectedObjectiveIndexes.has(index))
      .map((index) => [index]),
  ]
  return groups.map((objectiveIndexes) => {
    const matching = candidates.filter((candidate) =>
      objectiveIndexes.every((index) => candidate.satisfied.has(index))
    )
    return {
      objectiveIndexes,
      units: matching.map((candidate) =>
        eventBoardUnit(candidate.id, rosterById)
      ),
      ownedCount: matching.filter((candidate) => candidate.owned).length,
    }
  })
}

/** The lanes shown on the board, stored as their ids joined by commas (every lane by default). */
export function parseVisibleLanes(raw: string): LegendaryEventLaneId[] {
  const ids = new Set(raw.split(","))
  return LEGENDARY_EVENT_LANE_IDS.filter((laneId) => ids.has(laneId))
}

export function serializeVisibleLanes(
  lanes: readonly LegendaryEventLaneId[]
): string {
  return LEGENDARY_EVENT_LANE_IDS.filter((laneId) =>
    lanes.includes(laneId)
  ).join(",")
}

export function isVisibleLanesValue(value: unknown): value is string {
  return typeof value === "string" && parseVisibleLanes(value).length > 0
}
