import {
  remainingLanePoints,
  unitLanePotential,
  type ClearEstimateConfig,
  type LaneProgressView,
  type LegendaryEventLane,
  type LegendaryEventRosterUnit,
  type LegendaryEventUnit,
} from "@/entities/legendary-event"
import { normalizeSearchText } from "@/shared/lib"

type PickerLane = Pick<
  LegendaryEventLane,
  | "availableUnitIds"
  | "killPoints"
  | "allowedUnitsFilter"
  | "unitsRestrictions"
  | "battleIds"
>

export interface PickerTile {
  unit: LegendaryEventUnit
  /** `undefined` when the roster could not be read (ownership unknown). */
  owned: boolean | undefined
  /** The points the unit can still score on the lane, net of the synced progress (spec: picker
   *  tiles show remaining points). */
  remainingPoints: number
  /** Effective power on the shown roster; 0 when not held, null when power data is unavailable. */
  effectivePower: number | null
  /** Catalog `index` of each lane objective the unit satisfies. */
  satisfied: number[]
  /** Whether the unit satisfies every selected objective chip (true while none is selected);
   *  a non-matching tile is listed after the matching ones, dimmed. */
  matches: boolean
}

/** The picker's order (spec: the picker has a Points left / Power sort). */
export type PickerSort = "pointsLeft" | "power"

export interface PickerTileOptions {
  /** The lane's synced progress; undefined while it loads or failed (nothing is cleared). */
  progress?: LaneProgressView
  sort?: PickerSort
  /** A unit's effective power on the shown roster (0 when not held, null when unavailable). */
  powerOf?: (unitId: string) => number | null
}

/** Whether a unit satisfying `satisfied` meets every selected objective. */
function matchesObjectives(
  satisfied: readonly number[],
  selectedObjectives: readonly number[]
): boolean {
  return selectedObjectives.every((index) => satisfied.includes(index))
}

/**
 * One tile per unit the lane allows (`lane.availableUnitIds`, the list the API validates members
 * against), with its remaining points, effective power and satisfied objectives. Points left
 * orders by remaining points then objectives count descending, then name; Power by effective power
 * descending (unavailable reads 0), then remaining points, then name. With objective chips
 * selected (design D1) the units satisfying every selected objective come first in that order and
 * the others follow, marked as not matching; no unit is removed.
 */
export function buildPickerTiles(
  lane: PickerLane,
  units: readonly LegendaryEventUnit[],
  roster: readonly LegendaryEventRosterUnit[] | undefined,
  nameOf: (unit: LegendaryEventUnit) => string,
  selectedObjectives: readonly number[] = [],
  { progress, sort = "pointsLeft", powerOf }: PickerTileOptions = {}
): PickerTile[] {
  const allowed = new Set(lane.availableUnitIds)
  const owned = roster
    ? new Set(roster.map((entry) => entry.unitId as string))
    : undefined
  return units
    .filter((unit) => allowed.has(unit.id))
    .map((unit) => {
      const potential = unitLanePotential(unit, lane)
      return {
        unit,
        owned: owned ? owned.has(unit.id) : undefined,
        remainingPoints: remainingLanePoints(potential, progress, lane),
        effectivePower: powerOf?.(unit.id) ?? null,
        satisfied: potential.satisfied,
        matches: matchesObjectives(potential.satisfied, selectedObjectives),
      }
    })
    .sort(
      (a, b) =>
        Number(b.matches) - Number(a.matches) ||
        (sort === "power"
          ? (b.effectivePower ?? 0) - (a.effectivePower ?? 0) ||
            b.remainingPoints - a.remainingPoints
          : b.remainingPoints - a.remainingPoints ||
            b.satisfied.length - a.satisfied.length) ||
        nameOf(a.unit).localeCompare(nameOf(b.unit))
    )
}

/** The tiles matching the search (localized name, case-insensitive) and the only-unlocked switch;
 *  a unit already in the team stays listed whatever the filters say. */
export function filterPickerTiles(
  tiles: readonly PickerTile[],
  {
    search,
    onlyUnlocked,
    selected,
    nameOf,
  }: {
    search: string
    onlyUnlocked: boolean
    selected: ReadonlySet<string>
    nameOf: (unit: LegendaryEventUnit) => string
  }
): PickerTile[] {
  const needle = normalizeSearchText(search)
  return tiles.filter((tile) => {
    if (selected.has(tile.unit.id)) return true
    if (onlyUnlocked && tile.owned === false) return false
    return !needle || normalizeSearchText(nameOf(tile.unit)).includes(needle)
  })
}

/** Per objective chip, how many of the listed tiles (after the search and Only unlocked) satisfy
 *  it together with every selected chip, so a chip's count is what the grid would list first with
 *  that chip added to the selection (a selected chip counts the current selection). */
export function objectiveChipCounts(
  tiles: readonly PickerTile[],
  objectiveIndexes: readonly number[],
  selected: readonly number[] = []
): Map<number, number> {
  const matching = tiles.filter((tile) =>
    selected.every((index) => tile.satisfied.includes(index))
  )
  return new Map(
    objectiveIndexes.map((index) => [
      index,
      matching.filter((tile) => tile.satisfied.includes(index)).length,
    ])
  )
}

/** Selects an objective chip, or clears it when it already is selected. */
export function toggleObjectiveChip(
  selected: readonly number[],
  index: number
): number[] {
  return selected.includes(index)
    ? selected.filter((entry) => entry !== index)
    : [...selected, index]
}

/** Goals Preview inside the picker (spec `legendary-event-goals-preview`): the switch starts from
 *  the page's value; while on, tiles read the preview roster. */
export interface PickerGoalsPreview {
  /** The page's Goals Preview value. */
  enabled: boolean
  /** False while goals load, failed or none target the event's units: the switch is disabled. */
  available: boolean
  /** The roster as if every Active goal target were reached; undefined while ownership is unknown. */
  roster: readonly LegendaryEventRosterUnit[] | undefined
  /** Units whose preview differs from the synced state. */
  previewed: ReadonlySet<string>
  /** A unit's estimated clears on the preview roster; absent without clear estimates. */
  clearsOf?: (unitId: string) => number | null
  /** Called when the picker's own switch changes (analytics). */
  onToggle?: (enabled: boolean) => void
}

/** The lane's clear estimates as the picker reads them (spec: picker tiles show each owned unit's
 *  strength): "pending" while they load, absent when unavailable. */
export type PickerEstimates =
  | "pending"
  | {
      /** A unit's estimated clears on the synced roster. */
      clearsOf: (unitId: string) => number | null
      /** The power formula's inputs; absent without power data (Power sort unavailable). */
      config?: ClearEstimateConfig
    }
