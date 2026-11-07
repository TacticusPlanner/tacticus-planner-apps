import { describe, expect, it } from "vitest"

import {
  UTHAR_ALPHA_MODEL,
  UTHAR_ALPHA_PROGRESS,
} from "./clear-estimate.fixtures"
import { laneTokensNeeded } from "./lane-tokens-needed"

// Uthar Alpha objectives: 0 Ultramarines, 1 Resilient, 2 Max 2 Hits, 3 Melee, 4 Piercing.
const reach = (depth: number, coveredObjectiveIndexes: number[]) => ({
  depth,
  coveredObjectiveIndexes,
})

describe("laneTokensNeeded", () => {
  it("needs nothing without teams", () => {
    expect(laneTokensNeeded(UTHAR_ALPHA_MODEL, undefined, [])).toBe(0)
  })

  it("needs one token per reached battle for a single team", () => {
    expect(
      laneTokensNeeded(UTHAR_ALPHA_MODEL, undefined, [reach(4, [0])])
    ).toBe(4)
  })

  it("counts the fewest teams covering every open objective a reaching team covers", () => {
    const split = [reach(3, [0, 3]), reach(3, [0, 2])]
    expect(laneTokensNeeded(UTHAR_ALPHA_MODEL, undefined, split)).toBe(6)
    // A team covering both makes either split team redundant.
    expect(
      laneTokensNeeded(UTHAR_ALPHA_MODEL, undefined, [
        ...split,
        reach(3, [0, 2, 3]),
      ])
    ).toBe(3)
  })

  it("only counts teams that reach the battle", () => {
    // Battles 1–2 need both; battles 3–4 only the deeper team.
    expect(
      laneTokensNeeded(UTHAR_ALPHA_MODEL, undefined, [
        reach(2, [3]),
        reach(4, [2]),
      ])
    ).toBe(6)
  })

  it("ignores objectives already cleared and battles with nothing left", () => {
    const progress = {
      ...UTHAR_ALPHA_PROGRESS,
      battles: UTHAR_ALPHA_PROGRESS.battles.map((battle) => {
        const points = UTHAR_ALPHA_MODEL.battles[battle.index]!.battlePoints
        // Battle 1 fully cleared with both awards earned; Melee cleared everywhere else.
        return battle.index === 0
          ? {
              ...battle,
              cleared: battle.cleared.map(() => true),
              killScore: points,
              highScore: points,
            }
          : {
              ...battle,
              cleared: battle.cleared.map(
                (isCleared, column) => column === 4 || isCleared
              ),
            }
      }),
    }
    expect(
      laneTokensNeeded(UTHAR_ALPHA_MODEL, progress, [
        reach(3, [3]),
        reach(3, [2]),
      ])
    ).toBe(2)
  })
})
