import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import {
  sortLeaderboard,
  type LeaderboardRow,
  type LeaderboardSort,
  type LeaderboardSortKey,
  type LegendaryEventUnit,
} from "@/entities/legendary-event"

/** What one lane's leaderboard body shows after the user's sort and filter. */
export type LaneLeaderboardBody =
  | { kind: "noEligible" }
  | { kind: "noUnlocked" }
  | { kind: "rows"; rows: LeaderboardRow[] }

/** Applies "Only unlocked" (drops `locked` rows; unknown ownership is never filtered) and the
 *  chosen sort, ordering names by the localized unit name. */
export function laneLeaderboardBody(
  rows: readonly LeaderboardRow[],
  {
    sort,
    onlyUnlocked,
    nameOf,
    locale,
  }: {
    sort: LeaderboardSort
    onlyUnlocked: boolean
    nameOf: (unit: LegendaryEventUnit) => string
    locale: string
  }
): LaneLeaderboardBody {
  if (rows.length === 0) return { kind: "noEligible" }
  const visible = onlyUnlocked
    ? rows.filter((row) => row.ownership !== "locked")
    : rows
  if (visible.length === 0) return { kind: "noUnlocked" }
  return {
    kind: "rows",
    rows: sortLeaderboard(visible, sort, (row) => nameOf(row.unit), locale),
  }
}

/** Each key's natural first direction: names A→Z, numbers highest first. */
export const SORT_FIRST_DIRECTION: Record<
  LeaderboardSortKey,
  LeaderboardSort["direction"]
> = { name: "asc", points: "desc", slots: "desc" }

/** Clicking a sortable header: the active key flips direction, another key starts at its natural
 *  direction. */
export function nextLeaderboardSort(
  current: LeaderboardSort,
  key: LeaderboardSortKey
): LeaderboardSort {
  if (current.key === key) {
    return { key, direction: current.direction === "asc" ? "desc" : "asc" }
  }
  return { key, direction: SORT_FIRST_DIRECTION[key] }
}

/** The localized display name of a catalog unit, falling back to its catalog name. */
export function useLeaderboardUnitName(): (unit: LegendaryEventUnit) => string {
  const { t } = useTranslation("characters")
  return useCallback((unit) => t(unit.id, { defaultValue: unit.name }), [t])
}
