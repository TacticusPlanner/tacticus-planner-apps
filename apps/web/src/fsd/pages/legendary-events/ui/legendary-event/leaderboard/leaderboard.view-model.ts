import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import {
  filterLeaderboard,
  objectiveFilterKey,
  sortCrossLaneLeaderboard,
  sortLeaderboard,
  useObjectiveLabel,
  type CrossLaneLeaderboardRow,
  type LeaderboardFigure,
  type LeaderboardRow,
  type LegendaryEvent,
  type LegendaryEventLane,
  type LegendaryEventUnit,
  type ObjectiveIconModel,
} from "@/entities/legendary-event"

import type { LeaderboardControlsState } from "../legendary-event-page.view-model"

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

/** One objective chip of the filter: keyed by its filter identity so equal objectives across
 *  lanes merge on Overview (design D7). */
export interface ObjectiveChip {
  key: string
  label: string
  icon: ObjectiveIconModel | undefined
}

/** The chips of one lane (catalog order), or of every lane's objectives merged by key. */
export function useObjectiveChips(): (
  lanes: readonly Pick<LegendaryEventLane, "unitsRestrictions">[]
) => ObjectiveChip[] {
  const objectiveLabel = useObjectiveLabel()
  return useCallback(
    (lanes) => {
      const chips = new Map<string, ObjectiveChip>()
      for (const lane of lanes) {
        const objectives = [...lane.unitsRestrictions].sort(
          (a, b) => a.index - b.index
        )
        for (const objective of objectives) {
          const key = objectiveFilterKey(objective.filter)
          if (chips.has(key)) continue
          chips.set(key, { key, ...objectiveLabel(objective) })
        }
      }
      return [...chips.values()]
    },
    [objectiveLabel]
  )
}

/** The lanes of an event, for the Overview chip union. */
export function eventLanes(
  event: LegendaryEvent
): Pick<LegendaryEventLane, "unitsRestrictions">[] {
  return [event.alpha, event.beta, event.gamma]
}

/** The localized display name of a catalog unit, falling back to its catalog name. */
export function useLeaderboardUnitName(): (unit: LegendaryEventUnit) => string {
  const { t } = useTranslation("characters")
  return useCallback((unit) => t(unit.id, { defaultValue: unit.name }), [t])
}
