import type { TokenPlanTeam } from "./token-plan"

/** A lane's fewest tokens to fully clear a battle, or the objectives no team covers. */
export type FullClearFigure =
  | { kind: "tokensPerBattle"; tokens: number }
  | {
      kind: "uncovered"
      /** Lane objective `index`es no team covers, ascending. */
      objectiveIndexes: number[]
    }

/**
 * The fewest teams whose covered objectives together include every lane objective (V1
 * `computeMinimumTokensToClearBattle`, spec: fewest tokens to fully clear a battle per lane). Only
 * teams with a depth of at least 1 count; null when there is none. An exact set cover over the
 * lane's objectives (a bitmask of at most a handful of bits), so it never depends on team order.
 */
export function fewestTokensForFullClear(
  teams: readonly Pick<TokenPlanTeam, "objectiveIndexes" | "depth">[],
  objectiveCount: number
): FullClearFigure | null {
  const masks = teams
    .filter((team) => (team.depth ?? 0) >= 1)
    .map((team) =>
      team.objectiveIndexes.reduce(
        (mask, index) =>
          index >= 0 && index < objectiveCount ? mask | (1 << index) : mask,
        0
      )
    )
  if (masks.length === 0) return null

  const full = (1 << objectiveCount) - 1
  const union = masks.reduce((all, mask) => all | mask, 0)
  if (union !== full) {
    return {
      kind: "uncovered",
      objectiveIndexes: Array.from(
        { length: objectiveCount },
        (_, index) => index
      ).filter((index) => (union & (1 << index)) === 0),
    }
  }

  // fewest[mask] = fewest teams whose union is exactly `mask`.
  const fewest = Array.from({ length: full + 1 }, () => Infinity)
  fewest[0] = 0
  for (let mask = 0; mask <= full; mask++) {
    const count = fewest[mask]!
    if (count === Infinity) continue
    for (const team of masks) {
      const next = mask | team
      if (count + 1 < fewest[next]!) fewest[next] = count + 1
    }
  }
  return { kind: "tokensPerBattle", tokens: fewest[full]! }
}
