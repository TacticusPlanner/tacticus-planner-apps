import {
  unitLanePotential,
  type LegendaryEventLane,
  type LegendaryEventRosterUnit,
  type LegendaryEventUnit,
} from "@/entities/legendary-event"

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
  pointsPerBattle: number
  /** Catalog `index` of each lane objective the unit satisfies. */
  satisfied: number[]
  /** Whether the unit satisfies every selected objective chip (true while none is selected);
   *  a non-matching tile is listed after the matching ones, dimmed. */
  matches: boolean
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
 * against), with its points per battle and satisfied objectives, ordered by points per battle then
 * objectives count descending, then name. With objective chips selected (design D1) the units
 * satisfying every selected objective come first in that order and the others follow, marked as
 * not matching; no unit is removed.
 */
export function buildPickerTiles(
  lane: PickerLane,
  units: readonly LegendaryEventUnit[],
  roster: readonly LegendaryEventRosterUnit[] | undefined,
  nameOf: (unit: LegendaryEventUnit) => string,
  selectedObjectives: readonly number[] = []
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
        pointsPerBattle: potential.pointsPerBattle,
        satisfied: potential.satisfied,
        matches: matchesObjectives(potential.satisfied, selectedObjectives),
      }
    })
    .sort(
      (a, b) =>
        Number(b.matches) - Number(a.matches) ||
        b.pointsPerBattle - a.pointsPerBattle ||
        b.satisfied.length - a.satisfied.length ||
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
  const needle = search.trim().toLocaleLowerCase()
  return tiles.filter((tile) => {
    if (selected.has(tile.unit.id)) return true
    if (onlyUnlocked && tile.owned === false) return false
    return !needle || nameOf(tile.unit).toLocaleLowerCase().includes(needle)
  })
}

/** Per objective chip, how many of the listed tiles (after the search and Only unlocked)
 *  satisfy it, so a chip's count is what the grid would list first for it alone. */
export function objectiveChipCounts(
  tiles: readonly PickerTile[],
  objectiveIndexes: readonly number[]
): Map<number, number> {
  return new Map(
    objectiveIndexes.map((index) => [
      index,
      tiles.filter((tile) => tile.satisfied.includes(index)).length,
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
