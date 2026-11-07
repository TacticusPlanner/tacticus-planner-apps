import { progressionIndex, rankIndex } from "@workspace/game-domain"

import {
  crossLaneFigure,
  type CrossLaneLeaderboardRow,
  type LeaderboardFigure,
  type LegendaryEventLaneId,
} from "@/entities/legendary-event"

/** What the cross-lane leaderboard is ordered by: its default order (the lanes' sum), a unit's
 *  progression or rank, or one lane's figure. */
export type CrossLaneSortKey = "progression" | "rank" | LegendaryEventLaneId

export interface CrossLaneSort {
  key: CrossLaneSortKey
  direction: "asc" | "desc"
}

/** A row's value for a sort key; a locked unit (no progression or rank) and a lane that disallows
 *  the unit sort below every real value. */
function sortValue(
  row: CrossLaneLeaderboardRow,
  key: CrossLaneSortKey,
  figure: LeaderboardFigure
): number {
  if (key === "progression")
    return row.progression ? progressionIndex(row.progression) : -1
  if (key === "rank") return row.rank ? rankIndex(row.rank) : -1
  return crossLaneFigure(row, key, figure) ?? -1
}

/** The rows re-ordered by `sort` (stable: ties keep the default order); `null` keeps the default
 *  order. Rows without a value stay last in either direction. */
export function sortCrossLaneRows(
  rows: readonly CrossLaneLeaderboardRow[],
  sort: CrossLaneSort | null,
  figure: LeaderboardFigure
): readonly CrossLaneLeaderboardRow[] {
  if (!sort) return rows
  const sign = sort.direction === "desc" ? -1 : 1
  return rows
    .map((row, index) => ({
      row,
      index,
      value: sortValue(row, sort.key, figure),
    }))
    .sort((a, b) => {
      if (a.value === -1 || b.value === -1)
        return a.value === b.value ? a.index - b.index : a.value === -1 ? 1 : -1
      return sign * (a.value - b.value) || a.index - b.index
    })
    .map((entry) => entry.row)
}

/** A header press: a new column sorts descending first, then ascending, then back to the default
 *  order. */
export function nextCrossLaneSort(
  current: CrossLaneSort | null,
  key: CrossLaneSortKey
): CrossLaneSort | null {
  if (current?.key !== key) return { key, direction: "desc" }
  return current.direction === "desc" ? { key, direction: "asc" } : null
}
