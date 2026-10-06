import {
  progressionRarity,
  type Progression,
  type Rank,
  type Rarity,
} from "@workspace/game-domain"

import type {
  LegendaryEventLane,
  LegendaryEventRosterUnit,
  LegendaryEventUnit,
} from "../model/types"
import { isUnitAllowedOnLane, objectivesSatisfied } from "./objective-match"

type PotentialLane = Pick<
  LegendaryEventLane,
  "killPoints" | "allowedUnitsFilter" | "unitsRestrictions"
>

export interface LaneUnitPotential {
  /** Points per battle: the lane's kill points plus the score of every satisfied objective. */
  points: number
  /** How many of the lane's objectives the unit satisfies. */
  slots: number
  /** Catalog `index` of each satisfied objective. */
  satisfied: number[]
}

/** A unit's potential points per battle and slots on a lane; 0 / 0 when the lane does not allow
 *  it (spec: unit potential points and slots per lane). */
export function unitLanePotential(
  unit: LegendaryEventUnit,
  lane: PotentialLane
): LaneUnitPotential {
  if (!isUnitAllowedOnLane(unit, lane)) {
    return { points: 0, slots: 0, satisfied: [] }
  }
  const satisfied = objectivesSatisfied(unit, lane)
  const scores = lane.unitsRestrictions
    .filter((objective) => satisfied.includes(objective.index))
    .reduce((sum, objective) => sum + objective.points, 0)
  return {
    points: lane.killPoints + scores,
    slots: satisfied.length,
    satisfied,
  }
}

/** Whether the roster holds the unit; `unknown` when the roster could not be read (design D5). */
export type LeaderboardOwnership = "owned" | "locked" | "unknown"

export interface LeaderboardRow {
  unit: LegendaryEventUnit
  ownership: LeaderboardOwnership
  /** The owned unit's progression, rarity and rank; absent unless `ownership` is `owned`. */
  progression?: Progression
  rarity?: Rarity
  rank?: Rank
  points: number
  slots: number
  /** One flag per lane objective, in catalog `index` order. */
  objectives: boolean[]
}

export type LeaderboardSortKey = "points" | "slots" | "name"

export interface LeaderboardSort {
  key: LeaderboardSortKey
  direction: "asc" | "desc"
}

export const DEFAULT_LEADERBOARD_SORT: LeaderboardSort = {
  key: "points",
  direction: "desc",
}

/**
 * Every unit the lane allows with its ownership and potential, in the default order: points
 * descending, then slots descending, then catalog name ascending. Units the lane does not allow are
 * left out. `roster` is `undefined` when the synced `characters` chunk is unavailable.
 */
export function buildLaneLeaderboard(
  lane: PotentialLane,
  characters: readonly LegendaryEventUnit[],
  roster: readonly LegendaryEventRosterUnit[] | undefined
): LeaderboardRow[] {
  const owned = roster
    ? new Map(roster.map((entry) => [entry.unitId as string, entry]))
    : undefined
  const objectiveIndices = lane.unitsRestrictions
    .map((objective) => objective.index)
    .sort((a, b) => a - b)

  const rows = characters
    .filter((unit) => isUnitAllowedOnLane(unit, lane))
    .map((unit): LeaderboardRow => {
      const { points, slots, satisfied } = unitLanePotential(unit, lane)
      const entry = owned?.get(unit.id)
      const ownership: LeaderboardOwnership = owned
        ? entry
          ? "owned"
          : "locked"
        : "unknown"
      return {
        unit,
        ownership,
        ...(entry && {
          progression: entry.progressionIndex,
          rarity: progressionRarity(entry.progressionIndex),
          rank: entry.rank,
        }),
        points,
        slots,
        objectives: objectiveIndices.map((index) => satisfied.includes(index)),
      }
    })
  return sortLeaderboard(rows, DEFAULT_LEADERBOARD_SORT, (row) => row.unit.name)
}

/**
 * Orders leaderboard rows by the chosen key and direction. Ties fall back to the default order's
 * remaining keys (points, slots descending; name ascending), so equal rows keep a stable order.
 */
export function sortLeaderboard(
  rows: readonly LeaderboardRow[],
  sort: LeaderboardSort,
  nameOf: (row: LeaderboardRow) => string,
  locale?: string
): LeaderboardRow[] {
  const sign = sort.direction === "asc" ? 1 : -1
  const byName = (a: LeaderboardRow, b: LeaderboardRow) =>
    nameOf(a).localeCompare(nameOf(b), locale)
  const comparators: Record<
    LeaderboardSortKey,
    (a: LeaderboardRow, b: LeaderboardRow) => number
  > = {
    points: (a, b) => a.points - b.points,
    slots: (a, b) => a.slots - b.slots,
    name: byName,
  }
  const tieBreakers: ((a: LeaderboardRow, b: LeaderboardRow) => number)[] = [
    (a, b) => b.points - a.points,
    (a, b) => b.slots - a.slots,
    byName,
  ]
  return [...rows].sort((a, b) => {
    const primary = sign * comparators[sort.key](a, b)
    if (primary !== 0) return primary
    for (const compare of tieBreakers) {
      const result = compare(a, b)
      if (result !== 0) return result
    }
    return 0
  })
}
