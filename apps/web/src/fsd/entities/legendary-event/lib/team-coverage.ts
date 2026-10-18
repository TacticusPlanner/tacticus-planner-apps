import type { LegendaryEventLane, LegendaryEventUnit } from "../model/types"
import { objectivesSatisfied } from "./objective-match"

type CoverageLane = Pick<
  LegendaryEventLane,
  "allowedUnitsFilter" | "unitsRestrictions"
>

const ascending = (indexes: Iterable<number>) =>
  [...new Set(indexes)].sort((a, b) => a - b)

/**
 * The objectives a team covers by derivation (design D3): the lane objective `index`es every
 * member satisfies, ascending. The reserve is not a member and never affects coverage; pass only
 * the non-reserve member ids. No members, or a member the catalog no longer knows, derives nothing.
 */
export function derivedTeamCoverage(
  memberUnitIds: readonly string[],
  lane: CoverageLane,
  units: readonly LegendaryEventUnit[]
): number[] {
  if (memberUnitIds.length === 0) return []
  const byId = new Map<string, LegendaryEventUnit>(
    units.map((unit) => [unit.id, unit])
  )
  let covered: Set<number> | undefined
  for (const id of memberUnitIds) {
    const unit = byId.get(id)
    const satisfied = new Set(unit ? objectivesSatisfied(unit, lane) : [])
    covered = covered
      ? new Set([...covered].filter((index) => satisfied.has(index)))
      : satisfied
  }
  return ascending(covered ?? [])
}
