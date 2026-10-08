import {
  progressionRarity,
  type Progression,
  type Rank,
  type Rarity,
} from "@workspace/game-domain"

import {
  LEGENDARY_EVENT_LANE_IDS,
  type LegendaryEvent,
  type LegendaryEventLane,
  type LegendaryEventLaneId,
  type LegendaryEventRosterUnit,
  type LegendaryEventUnit,
  type LegendaryEventUnitFilter,
} from "../model/types"
import { isUnitAllowedOnLane, objectivesSatisfied } from "./objective-match"
import type { LaneProgressView } from "./synced-lane-progress"

type PotentialLane = Pick<
  LegendaryEventLane,
  "killPoints" | "allowedUnitsFilter" | "unitsRestrictions" | "battleIds"
>

export interface LaneUnitPotential {
  /** Points per battle: the lane's kill points plus the score of every satisfied objective. */
  pointsPerBattle: number
  /** How many of the lane's objectives the unit satisfies. */
  objectivesCount: number
  /** Catalog `index` of each satisfied objective. */
  satisfied: number[]
}

/** The identity of an objective's filter, shared by equal objectives across lanes (design D7). */
export function objectiveFilterKey(filter: LegendaryEventUnitFilter): string {
  return `${filter.kind}:${filter.target}:${filter.exclude ? "not" : "is"}`
}

/** A unit's potential points per battle and objectives count on a lane; 0 / 0 when the lane does
 *  not allow it (spec: unit potential points and slots per lane). */
export function unitLanePotential(
  unit: LegendaryEventUnit,
  lane: PotentialLane
): LaneUnitPotential {
  if (!isUnitAllowedOnLane(unit, lane)) {
    return { pointsPerBattle: 0, objectivesCount: 0, satisfied: [] }
  }
  const satisfied = objectivesSatisfied(unit, lane)
  const scores = lane.unitsRestrictions
    .filter((objective) => satisfied.includes(objective.index))
    .reduce((sum, objective) => sum + objective.points, 0)
  return {
    pointsPerBattle: lane.killPoints + scores,
    objectivesCount: satisfied.length,
    satisfied,
  }
}

/**
 * The points a unit can still score on a lane (spec: remaining points per unit on a lane): per
 * battle, the kill points unless defeat-all is cleared, plus each satisfied objective's score
 * unless that objective is cleared. Without synced progress nothing is cleared, so it is points
 * per battle × the battle count.
 */
export function remainingLanePoints(
  potential: LaneUnitPotential,
  laneProgress: LaneProgressView | undefined,
  lane: PotentialLane
): number {
  if (potential.satisfied.length === 0 && potential.pointsPerBattle === 0) {
    return 0
  }
  if (!laneProgress) {
    return potential.pointsPerBattle * lane.battleIds.length
  }
  const objectives = [...lane.unitsRestrictions].sort(
    (a, b) => a.index - b.index
  )
  return laneProgress.battles.reduce((total, battle) => {
    let points = battle.cleared[0] ? 0 : lane.killPoints
    for (const [column, objective] of objectives.entries()) {
      if (
        potential.satisfied.includes(objective.index) &&
        !battle.cleared[column + 1]
      ) {
        points += objective.points
      }
    }
    return total + points
  }, 0)
}

/** Whether the roster holds the unit; `unknown` when the roster could not be read (design D5). */
export type LeaderboardOwnership = "owned" | "locked" | "unknown"

export interface LeaderboardUnitRow {
  unit: LegendaryEventUnit
  ownership: LeaderboardOwnership
  /** The owned unit's progression, rarity and rank; absent unless `ownership` is `owned`. */
  progression?: Progression
  rarity?: Rarity
  rank?: Rank
  /** `objectiveFilterKey` of every objective the unit satisfies (on any lane for cross-lane rows). */
  satisfiedKeys: string[]
}

export interface LeaderboardRow extends LeaderboardUnitRow {
  pointsPerBattle: number
  remainingPoints: number
  objectivesCount: number
  /** One flag per lane objective, in catalog `index` order. */
  objectives: boolean[]
}

/** Which points figure the leaderboards show and order by (spec: deduct scored points toggle). */
export type LeaderboardFigure = "remaining" | "perBattle"

export interface LeaderboardFilter {
  onlyUnlocked: boolean
  /** `objectiveFilterKey`s the unit must satisfy, all of them. */
  objectiveKeys: ReadonlySet<string>
}

function ownershipOf(
  roster: readonly LegendaryEventRosterUnit[] | undefined
): (
  unit: LegendaryEventUnit
) => Pick<LeaderboardUnitRow, "ownership" | "progression" | "rarity" | "rank"> {
  const owned = roster
    ? new Map(roster.map((entry) => [entry.unitId as string, entry]))
    : undefined
  return (unit) => {
    const entry = owned?.get(unit.id)
    if (!owned) return { ownership: "unknown" }
    if (!entry) return { ownership: "locked" }
    return {
      ownership: "owned",
      progression: entry.progressionIndex,
      rarity: progressionRarity(entry.progressionIndex),
      rank: entry.rank,
    }
  }
}

/**
 * Every unit the lane allows with its ownership, points per battle, remaining points and
 * objective flags, in the default order (remaining points descending). Units the lane does not
 * allow are left out. `roster` is `undefined` when the synced `characters` chunk is unavailable;
 * `laneProgress` is `undefined` when progress could not be read (nothing counts as cleared).
 */
export function buildLaneLeaderboard(
  lane: PotentialLane,
  characters: readonly LegendaryEventUnit[],
  roster: readonly LegendaryEventRosterUnit[] | undefined,
  laneProgress?: LaneProgressView
): LeaderboardRow[] {
  const ownership = ownershipOf(roster)
  const objectives = [...lane.unitsRestrictions].sort(
    (a, b) => a.index - b.index
  )

  const rows = characters
    .filter((unit) => isUnitAllowedOnLane(unit, lane))
    .map((unit): LeaderboardRow => {
      const potential = unitLanePotential(unit, lane)
      const satisfiedObjectives = objectives.filter((objective) =>
        potential.satisfied.includes(objective.index)
      )
      return {
        unit,
        ...ownership(unit),
        satisfiedKeys: satisfiedObjectives.map((objective) =>
          objectiveFilterKey(objective.filter)
        ),
        pointsPerBattle: potential.pointsPerBattle,
        remainingPoints: remainingLanePoints(potential, laneProgress, lane),
        objectivesCount: potential.objectivesCount,
        objectives: objectives.map((objective) =>
          potential.satisfied.includes(objective.index)
        ),
      }
    })
  return sortLeaderboard(rows, "remaining", (row) => row.unit.name)
}

/**
 * Orders lane rows by the shown figure descending, then objectives count descending, then name
 * ascending (spec: eligibility leaderboard default order; no user sort control).
 */
export function sortLeaderboard(
  rows: readonly LeaderboardRow[],
  figure: LeaderboardFigure,
  nameOf: (row: LeaderboardUnitRow) => string,
  locale?: string
): LeaderboardRow[] {
  const figureOf = (row: LeaderboardRow) =>
    figure === "remaining" ? row.remainingPoints : row.pointsPerBattle
  return [...rows].sort(
    (a, b) =>
      figureOf(b) - figureOf(a) ||
      b.objectivesCount - a.objectivesCount ||
      nameOf(a).localeCompare(nameOf(b), locale)
  )
}

/** Keeps the rows that pass the shared filters (spec: only unlocked, objective multi-select). */
export function filterLeaderboard<Row extends LeaderboardUnitRow>(
  rows: readonly Row[],
  filter: LeaderboardFilter
): Row[] {
  return rows.filter(
    (row) =>
      (!filter.onlyUnlocked || row.ownership !== "locked") &&
      [...filter.objectiveKeys].every((key) => row.satisfiedKeys.includes(key))
  )
}

export interface CrossLaneFigures {
  pointsPerBattle: number
  remainingPoints: number
}

export interface CrossLaneLeaderboardRow extends LeaderboardUnitRow {
  /** The unit's figures per lane; `undefined` where the lane does not allow it ("—"). */
  lanes: Record<LegendaryEventLaneId, CrossLaneFigures | undefined>
}

export function crossLaneFigure(
  row: CrossLaneLeaderboardRow,
  laneId: LegendaryEventLaneId,
  figure: LeaderboardFigure
): number | undefined {
  const lane = row.lanes[laneId]
  if (!lane) return undefined
  return figure === "remaining" ? lane.remainingPoints : lane.pointsPerBattle
}

/** The sum of a cross-lane row's figures over the lanes that allow the unit. */
export function crossLaneTotal(
  row: CrossLaneLeaderboardRow,
  figure: LeaderboardFigure
): number {
  return LEGENDARY_EVENT_LANE_IDS.reduce(
    (sum, laneId) => sum + (crossLaneFigure(row, laneId, figure) ?? 0),
    0
  )
}

/**
 * One row per unit allowed on at least one lane, with the per-lane figures (spec: cross-lane
 * eligibility leaderboard on Overview), ordered by the remaining-points total.
 */
export function buildCrossLaneLeaderboard(
  event: Pick<LegendaryEvent, LegendaryEventLaneId>,
  characters: readonly LegendaryEventUnit[],
  roster: readonly LegendaryEventRosterUnit[] | undefined,
  progressByLane: Partial<Record<LegendaryEventLaneId, LaneProgressView>>
): CrossLaneLeaderboardRow[] {
  const ownership = ownershipOf(roster)
  const rows = characters.flatMap((unit): CrossLaneLeaderboardRow[] => {
    const satisfiedKeys = new Set<string>()
    const lanes = {} as CrossLaneLeaderboardRow["lanes"]
    let allowed = false
    for (const laneId of LEGENDARY_EVENT_LANE_IDS) {
      const lane = event[laneId]
      if (!isUnitAllowedOnLane(unit, lane)) {
        lanes[laneId] = undefined
        continue
      }
      allowed = true
      const potential = unitLanePotential(unit, lane)
      for (const objective of lane.unitsRestrictions) {
        if (potential.satisfied.includes(objective.index)) {
          satisfiedKeys.add(objectiveFilterKey(objective.filter))
        }
      }
      lanes[laneId] = {
        pointsPerBattle: potential.pointsPerBattle,
        remainingPoints: remainingLanePoints(
          potential,
          progressByLane[laneId],
          lane
        ),
      }
    }
    if (!allowed) return []
    return [
      { unit, ...ownership(unit), satisfiedKeys: [...satisfiedKeys], lanes },
    ]
  })
  return sortCrossLaneLeaderboard(rows, "remaining", (row) => row.unit.name)
}

/** Orders cross-lane rows by the sum of the shown figure descending, then name ascending. */
export function sortCrossLaneLeaderboard(
  rows: readonly CrossLaneLeaderboardRow[],
  figure: LeaderboardFigure,
  nameOf: (row: LeaderboardUnitRow) => string,
  locale?: string
): CrossLaneLeaderboardRow[] {
  return [...rows].sort(
    (a, b) =>
      crossLaneTotal(b, figure) - crossLaneTotal(a, figure) ||
      nameOf(a).localeCompare(nameOf(b), locale)
  )
}
