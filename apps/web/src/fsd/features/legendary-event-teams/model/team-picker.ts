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
}

/**
 * One tile per unit the lane allows (`lane.availableUnitIds`, the list the API validates members
 * against), with its points per battle and satisfied objectives, ordered by points per battle then
 * objectives count descending, then name.
 */
export function buildPickerTiles(
  lane: PickerLane,
  units: readonly LegendaryEventUnit[],
  roster: readonly LegendaryEventRosterUnit[] | undefined,
  nameOf: (unit: LegendaryEventUnit) => string
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
      }
    })
    .sort(
      (a, b) =>
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
