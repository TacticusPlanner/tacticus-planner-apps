import { describe, expect, it } from "vitest"

import { fewestTokensForFullClear } from "./minimum-tokens"
import { fiveTeam, meleeTeam } from "./token-plan.fixtures"

const team = (objectiveIndexes: number[], depth: number | null = 1) => ({
  objectiveIndexes,
  depth,
})

describe("fewestTokensForFullClear", () => {
  it("names the objectives the worked Uthar Alpha teams do not cover", () => {
    // Ultramarines (0) and Melee (3) are covered; Resilient, Max 2 Hits and Piercing are not.
    expect(fewestTokensForFullClear([fiveTeam, meleeTeam], 5)).toEqual({
      kind: "uncovered",
      objectiveIndexes: [1, 2, 4],
    })
  })

  it("finds two teams among overlapping coverage", () => {
    expect(
      fewestTokensForFullClear(
        [team([0, 1]), team([1, 2]), team([2, 3, 4]), team([0, 3])],
        5
      )
    ).toEqual({ kind: "tokensPerBattle", tokens: 2 })
  })

  it("ignores teams without a depth", () => {
    expect(
      fewestTokensForFullClear([team([0, 1, 2, 3, 4], null)], 5)
    ).toBeNull()
    expect(
      fewestTokensForFullClear(
        [team([0, 1, 2, 3, 4], 0), team([0, 1, 2, 3])],
        5
      )
    ).toEqual({ kind: "uncovered", objectiveIndexes: [4] })
  })

  // V1 `token-estimation-service.spec.ts` › computeMinimumTokensToClearBattle, with V1's
  // restriction names mapped to objective indexes: Flame 0, Physical 1, Psychic 2, Bolter 3,
  // Direct 4, Piercing 3 in the last case (its lane has Flame, Physical, Piercing, Direct, Psychic).
  describe("V1 parity", () => {
    it("is not a full clear when the restrictions are not all covered", () => {
      expect(fewestTokensForFullClear([team([0, 1, 2, 3], 3)], 5)).toEqual({
        kind: "uncovered",
        objectiveIndexes: [4],
      })
    })

    it("returns 5 when each team clears one restriction", () => {
      expect(
        fewestTokensForFullClear(
          [team([0]), team([1]), team([2]), team([3]), team([4])],
          5
        )
      ).toEqual({ kind: "tokensPerBattle", tokens: 5 })
    })

    it("respects overlapping coverage", () => {
      expect(
        fewestTokensForFullClear(
          [team([0]), team([1, 0]), team([2, 0]), team([3, 0]), team([4, 0])],
          5
        )
      ).toEqual({ kind: "tokensPerBattle", tokens: 4 })
    })

    it("recognises unnecessary teams", () => {
      // Flame 0, Physical 1, Piercing 2, Direct 3, Psychic 4.
      expect(
        fewestTokensForFullClear(
          [
            team([0, 1, 2]),
            team([3, 4]),
            team([4, 0]),
            team([2, 0]),
            team([2]),
          ],
          5
        )
      ).toEqual({ kind: "tokensPerBattle", tokens: 2 })
    })
  })
})
