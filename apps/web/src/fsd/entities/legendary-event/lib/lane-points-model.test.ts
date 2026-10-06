import { describe, expect, it } from "vitest"

import { lysanderEvent } from "@/test/fixtures/legendary-events"

import { buildLanePointsModel } from "./lane-points-model"

describe("buildLanePointsModel", () => {
  const model = buildLanePointsModel(lysanderEvent.alpha)

  it("reproduces Lysander Alpha battle 1: 32 kill + 32 high score + 32 defeat-all + 375 = 471", () => {
    expect(model.battles[0]).toEqual({
      index: 0,
      battlePoints: 32,
      defeatAllPoints: 32,
      objectiveScores: [75, 95, 80, 85, 40],
      maxPoints: 471,
    })
  })

  it("reproduces the Lysander Alpha lane maximum: 829 × 2 + 592 + 18 × 375 = 9,000", () => {
    expect(model.battles).toHaveLength(18)
    expect(
      model.battles.reduce((sum, battle) => sum + battle.battlePoints, 0)
    ).toBe(829)
    expect(
      model.battles.reduce((sum, battle) => sum + battle.defeatAllPoints, 0)
    ).toBe(592)
    expect(model.maxPoints).toBe(9000)
  })

  it("orders objectives by catalog index", () => {
    const shuffled = buildLanePointsModel({
      ...lysanderEvent.alpha,
      unitsRestrictions: [...lysanderEvent.alpha.unitsRestrictions].reverse(),
    })
    expect(shuffled.objectives.map((objective) => objective.index)).toEqual([
      0, 1, 2, 3, 4,
    ])
    expect(shuffled.maxPoints).toBe(9000)
  })
})
