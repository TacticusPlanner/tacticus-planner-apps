import type {
  LegendaryEventLane,
  LegendaryEventUnit,
  LegendaryEventUnitFilter,
} from "../model/types"
import { unitDealtDamageTypes } from "./damage-profile-exclusions"

/** Every filter kind the served `lres` data uses. A kind outside this list matches no unit. */
const SUPPORTED_UNIT_FILTER_KINDS = [
  "Alliance",
  "Faction",
  "Trait",
  "DamageType",
  "MinHits",
  "MaxHits",
  "AttackType",
] as const

type SupportedKind = (typeof SUPPORTED_UNIT_FILTER_KINDS)[number]

export function isSupportedUnitFilterKind(kind: string): kind is SupportedKind {
  return (SUPPORTED_UNIT_FILTER_KINDS as readonly string[]).includes(kind)
}

/** A unit's hits for `MinHits` / `MaxHits`: its ranged hits when it has a ranged attack, else its
 *  melee hits (V1 used `rangeHits || meleeHits`). */
function unitHits(unit: LegendaryEventUnit): number {
  return unit.rangedHits ?? unit.meleeHits
}

function matchesKind(
  unit: LegendaryEventUnit,
  kind: SupportedKind,
  target: string
): boolean | undefined {
  switch (kind) {
    case "Alliance": {
      return unit.alliance === target
    }
    case "Faction": {
      return unit.faction === target
    }
    case "Trait": {
      return unit.traits.includes(target)
    }
    case "DamageType": {
      return unitDealtDamageTypes(unit).includes(target)
    }
    case "MinHits":
    case "MaxHits": {
      const count = Number(target)
      if (target.trim() === "" || !Number.isFinite(count)) return undefined
      return kind === "MinHits"
        ? unitHits(unit) >= count
        : unitHits(unit) <= count
    }
    case "AttackType": {
      // The catalog encodes "Melee" as "not Ranged"; accept a literal "Melee" target as well.
      if (target === "Ranged") return unit.rangedHits !== null
      if (target === "Melee") return unit.rangedHits === null
      return undefined
    }
  }
}

/**
 * Whether a unit passes a filter `{ kind, target, exclude }` (spec: objective matching per filter
 * kind). `exclude` inverts the match; an unknown kind or an unreadable target matches no unit,
 * whatever `exclude` says, so a new game objective empties instead of matching everyone.
 */
export function matchesObjectiveFilter(
  unit: LegendaryEventUnit,
  filter: LegendaryEventUnitFilter
): boolean {
  if (!isSupportedUnitFilterKind(filter.kind)) return false
  const matches = matchesKind(unit, filter.kind, filter.target)
  if (matches === undefined) return false
  return filter.exclude ? !matches : matches
}

/** Whether a lane allows the unit: it passes every filter of the lane's `allowedUnitsFilter`. */
export function isUnitAllowedOnLane(
  unit: LegendaryEventUnit,
  lane: Pick<LegendaryEventLane, "allowedUnitsFilter">
): boolean {
  return lane.allowedUnitsFilter.every((filter) =>
    matchesObjectiveFilter(unit, filter)
  )
}

/** The catalog `index` of every lane objective the unit satisfies, in objective order; empty when
 *  the lane does not allow the unit. */
export function objectivesSatisfied(
  unit: LegendaryEventUnit,
  lane: Pick<LegendaryEventLane, "allowedUnitsFilter" | "unitsRestrictions">
): number[] {
  if (!isUnitAllowedOnLane(unit, lane)) return []
  return [...lane.unitsRestrictions]
    .sort((a, b) => a.index - b.index)
    .filter((objective) => matchesObjectiveFilter(unit, objective.filter))
    .map((objective) => objective.index)
}
