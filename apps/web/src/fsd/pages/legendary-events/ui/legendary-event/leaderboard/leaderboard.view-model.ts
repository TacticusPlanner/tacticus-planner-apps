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
  ClearEstimatesViewModel,
  LeaderboardControlsState,
  ProgressGridViewModel,
} from "../legendary-event-page.view-model"

/** What a leaderboard body shows after the shared filters. */
export type LeaderboardBody<Row> =
  | { kind: "noEligible" }
  | { kind: "noUnlocked" }
  | { kind: "noneInTeams" }
  | { kind: "noneMatch" }
  | { kind: "rows"; rows: Row[] }

export interface LeaderboardFilterInput {
  onlyUnlocked: boolean
  objectiveKeys: ReadonlySet<string>
  /** "Only in my teams": the unit ids the shown lanes' teams use; absent while it is off. */
  teamUnitIds?: ReadonlySet<string>
  figure: LeaderboardFigure
  nameOf: (unit: LegendaryEventUnit) => string
  locale: string
}

function classify<Row extends { ownership: string; unit: { id: string } }>(
  rows: readonly Row[],
  { onlyUnlocked, objectiveKeys, teamUnitIds }: LeaderboardFilterInput,
  filtered: Row[]
): Exclude<LeaderboardBody<Row>, { kind: "rows" }> | undefined {
  if (rows.length === 0) return { kind: "noEligible" }
  if (filtered.length > 0) return undefined
  // Which filter emptied the list: Only in my teams, the objective selection, or Only unlocked.
  const inTeams = teamUnitIds
    ? rows.filter((row) => teamUnitIds.has(row.unit.id))
    : rows
  if (inTeams.length === 0) return { kind: "noneInTeams" }
  const unlocked = onlyUnlocked
    ? inTeams.filter((row) => row.ownership !== "locked")
    : inTeams
  return objectiveKeys.size > 0 && unlocked.length > 0
    ? { kind: "noneMatch" }
    : { kind: "noUnlocked" }
}

/** The ids the teams of `laneIds` use while "Only in my teams" is on and the plan is read;
 *  `undefined` (no filtering) otherwise. */
export function shownTeamUnitIds(
  state: Pick<LeaderboardControlsState, "onlyInTeams" | "teamUnitIds">,
  laneIds: readonly LegendaryEventLaneId[]
): ReadonlySet<string> | undefined {
  const byLane = state.teamUnitIds
  if (!state.onlyInTeams || !byLane) return undefined
  return new Set(laneIds.flatMap((laneId) => [...byLane[laneId]]))
}

/** Applies "Only unlocked" (drops `locked` rows; unknown ownership is never filtered), "Only in
 *  my teams", the objective selection and the shown figure's order, naming units by their localized name. */
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
/** The cross-lane body over the shown lanes: a unit no shown lane allows is left out, and the
 *  order is the sum over the shown lanes. */
export function crossLaneLeaderboardBody(
  allRows: readonly CrossLaneLeaderboardRow[],
  input: LeaderboardFilterInput,
  laneIds: readonly LegendaryEventLaneId[]
): LeaderboardBody<CrossLaneLeaderboardRow> {
  const rows = allRows.filter((row) =>
    laneIds.some((laneId) => row.lanes[laneId])
  )
  const filtered = filterLeaderboard(rows, input)
  return (
    classify(rows, input, filtered) ?? {
      kind: "rows",
      rows: sortCrossLaneLeaderboard(
        filtered,
        input.figure,
        (row) => input.nameOf(row.unit),
        input.locale,
        laneIds
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

/** One row's Clears figure (design D5, D6): `~n` for an owned unit, "—" without an estimate
 *  (locked unit, unknown ownership), a placeholder dash while the inputs load. */
export type LeaderboardClears =
  { kind: "pending" } | { kind: "none" } | { kind: "estimate"; depth: number }

/** The lane's Clears figure per unit, or `undefined` when the column is hidden (the
 *  clear estimates are hidden). */
export function laneClearsOf(
  clears: ClearEstimatesViewModel,
  laneId: LegendaryEventLaneId
): ((unitId: string) => LeaderboardClears) | undefined {
  if (clears.kind === "hidden") return undefined
  if (clears.kind === "pending") return () => ({ kind: "pending" })
  const estimator = clears.byLane[laneId]
  return (unitId) => {
    const estimate = estimator.unit(unitId)
    return estimate
      ? { kind: "estimate", depth: estimate.depth }
      : { kind: "none" }
  }
}

/** The figure's text: "~6", "—" or the placeholder dash. */
export function useClearsText(): (clears: LeaderboardClears) => string {
  const { t } = useTranslation("legendaryEvents")
  return useCallback(
    (clears) => {
      if (clears.kind === "pending") return t("estimates.clearsPending")
      if (clears.kind === "none") return t("estimates.clearsNone")
      return t("estimates.clearsEstimate", { depth: clears.depth })
    },
    [t]
  )
}

/** The objective selection the shown lanes can draw: keys of a lane the user hid no longer filter
 *  (their chips are gone), and come back when the lane is shown again. Returns `selected` itself
 *  when nothing is dropped. */
function shownObjectiveKeys(
  event: Pick<LegendaryEvent, LegendaryEventLaneId>,
  laneIds: readonly LegendaryEventLaneId[]
): ReadonlySet<string> {
  return new Set(
    laneIds.flatMap((laneId) =>
      event[laneId].unitsRestrictions.map((objective) =>
        objectiveFilterKey(objective.filter)
      )
    )
  )
}

export function shownObjectiveSelection(
  event: Pick<LegendaryEvent, LegendaryEventLaneId>,
  laneIds: readonly LegendaryEventLaneId[],
  selected: ReadonlySet<string>
): ReadonlySet<string> {
  const shown = shownObjectiveKeys(event, laneIds)
  return [...selected].every((key) => shown.has(key))
    ? selected
    : new Set([...selected].filter((key) => shown.has(key)))
}

/** Applies an edit made on the shown chips, keeping hidden lanes' picks for when they're shown again. */
export function mergeShownObjectiveSelection(
  event: Pick<LegendaryEvent, LegendaryEventLaneId>,
  laneIds: readonly LegendaryEventLaneId[],
  selected: ReadonlySet<string>,
  next: ReadonlySet<string>
): ReadonlySet<string> {
  const shown = shownObjectiveKeys(event, laneIds)
  return new Set([...[...selected].filter((key) => !shown.has(key)), ...next])
}
