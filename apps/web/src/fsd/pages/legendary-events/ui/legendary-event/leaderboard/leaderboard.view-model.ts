import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import {
  filterLeaderboard,
  objectiveClearedCounts,
  objectiveFilterKey,
  sortCrossLaneLeaderboard,
  sortLeaderboard,
  useObjectiveLabel,
  type CrossLaneLeaderboardRow,
  type LeaderboardFigure,
  type LeaderboardRow,
  type LegendaryEvent,
  type LegendaryEventLaneId,
  type LegendaryEventUnit,
  type ObjectiveIconModel,
} from "@/entities/legendary-event"

import type {
  LeaderboardControlsState,
  ProgressGridViewModel,
} from "../legendary-event-page.view-model"

/** What a leaderboard body shows after the shared filters. */
export type LeaderboardBody<Row> =
  | { kind: "noEligible" }
  | { kind: "noUnlocked" }
  | { kind: "noneMatch" }
  | { kind: "rows"; rows: Row[] }

export interface LeaderboardFilterInput {
  onlyUnlocked: boolean
  objectiveKeys: ReadonlySet<string>
  figure: LeaderboardFigure
  nameOf: (unit: LegendaryEventUnit) => string
  locale: string
}

function classify<Row extends { ownership: string }>(
  rows: readonly Row[],
  { onlyUnlocked, objectiveKeys }: LeaderboardFilterInput,
  filtered: Row[]
): Exclude<LeaderboardBody<Row>, { kind: "rows" }> | undefined {
  if (rows.length === 0) return { kind: "noEligible" }
  if (filtered.length > 0) return undefined
  // Which filter emptied the list: the objective selection, or Only unlocked alone.
  const unlocked = onlyUnlocked
    ? rows.filter((row) => row.ownership !== "locked")
    : rows
  return objectiveKeys.size > 0 && unlocked.length > 0
    ? { kind: "noneMatch" }
    : { kind: "noUnlocked" }
}

/** Applies "Only unlocked" (drops `locked` rows; unknown ownership is never filtered), the
 *  objective selection and the shown figure's order, naming units by their localized name. */
export function laneLeaderboardBody(
  rows: readonly LeaderboardRow[],
  input: LeaderboardFilterInput
): LeaderboardBody<LeaderboardRow> {
  const filtered = filterLeaderboard(rows, input)
  return (
    classify(rows, input, filtered) ?? {
      kind: "rows",
      rows: sortLeaderboard(
        filtered,
        input.figure,
        (row) => input.nameOf(row.unit),
        input.locale
      ),
    }
  )
}

/** The Overview counterpart of `laneLeaderboardBody`, ordered by the figures' sum. */
export function crossLaneLeaderboardBody(
  rows: readonly CrossLaneLeaderboardRow[],
  input: LeaderboardFilterInput
): LeaderboardBody<CrossLaneLeaderboardRow> {
  const filtered = filterLeaderboard(rows, input)
  return (
    classify(rows, input, filtered) ?? {
      kind: "rows",
      rows: sortCrossLaneLeaderboard(
        filtered,
        input.figure,
        (row) => input.nameOf(row.unit),
        input.locale
      ),
    }
  )
}

/** Which figure the controls state shows (spec: deduct scored points toggle). */
export function leaderboardFigure(
  state: Pick<LeaderboardControlsState, "deductScored">
): LeaderboardFigure {
  return state.deductScored ? "remaining" : "perBattle"
}

/** One objective chip of the filter: keyed by its filter identity, so the same objective in two
 *  lanes is one filter entry (design D2). `count` is how many of the lane's battles have the
 *  objective cleared, absent while the progress read failed. */
export interface ObjectiveChip {
  key: string
  label: string
  icon: ObjectiveIconModel | undefined
  count?: { cleared: number; total: number }
}

/** One lane's chips, in catalog `index` order. */
export interface ObjectiveChipGroup {
  laneId: LegendaryEventLaneId
  chips: ObjectiveChip[]
}

/** One chip group per listed lane, with cleared counts when the progress grid is ready. */
export function useObjectiveChips(): (
  event: LegendaryEvent,
  laneIds: readonly LegendaryEventLaneId[],
  progressGrid: ProgressGridViewModel
) => ObjectiveChipGroup[] {
  const objectiveLabel = useObjectiveLabel()
  return useCallback(
    (event, laneIds, progressGrid) =>
      laneIds.map((laneId) => {
        const objectives = [...event[laneId].unitsRestrictions].sort(
          (a, b) => a.index - b.index
        )
        const progress =
          progressGrid.kind === "ready" ? progressGrid.lanes[laneId] : undefined
        const counts = progress
          ? objectiveClearedCounts(progress, objectives.length)
          : undefined
        return {
          laneId,
          chips: objectives.map((objective, index) => ({
            key: objectiveFilterKey(objective.filter),
            ...objectiveLabel(objective),
            ...(progress && counts
              ? {
                  count: {
                    cleared: counts[index] ?? 0,
                    total: progress.battles.length,
                  },
                }
              : {}),
          })),
        }
      }),
    [objectiveLabel]
  )
}

/** The localized display name of a catalog unit, falling back to its catalog name. */
export function useLeaderboardUnitName(): (unit: LegendaryEventUnit) => string {
  const { t } = useTranslation("characters")
  return useCallback((unit) => t(unit.id, { defaultValue: unit.name }), [t])
}
