import { describe, expect, it } from "vitest"

import {
  UTHAR_ALPHA_MODEL,
  UTHAR_ALPHA_PROGRESS,
} from "./clear-estimate.fixtures"
import { laneReachablePoints } from "./reachable-points"

const ULTRAMARINES = 0
const MELEE = 3
const PIERCING = 4
const four = { depth: 5, coveredObjectiveIndexes: [ULTRAMARINES] }

describe("laneReachablePoints (spec worked examples)", () => {
  it("adds 0, 75, 175, 183, 187 = 620 for Four at depth 5", () => {
    const reach = laneReachablePoints(UTHAR_ALPHA_MODEL, UTHAR_ALPHA_PROGRESS, [
      four,
    ])
    expect(reach.perBattle.slice(0, 6)).toEqual([0, 75, 175, 183, 187, 0])
    expect(reach.perBattle).toHaveLength(18)
    expect(reach.total).toBe(620)
  })

  it("counts an objective once when teams overlap: 1,201", () => {
    const reach = laneReachablePoints(UTHAR_ALPHA_MODEL, UTHAR_ALPHA_PROGRESS, [
      four,
      { depth: 6, coveredObjectiveIndexes: [ULTRAMARINES, MELEE] },
    ])
    expect(reach.perBattle.slice(0, 6)).toEqual([65, 140, 240, 248, 252, 256])
    expect(reach.total).toBe(1201)
  })

  it("counts the kill score left and the high score left independently", () => {
    const progress = {
      ...UTHAR_ALPHA_PROGRESS,
      battles: UTHAR_ALPHA_PROGRESS.battles.map((battle) =>
        battle.index === 2
          ? { ...battle, killScore: 10, highScore: 20 }
          : battle
      ),
    }
    const reach = laneReachablePoints(UTHAR_ALPHA_MODEL, progress, [four])
    expect(reach.perBattle[2]).toBe(35 - 10 + (35 - 20) + 30 + 75)
  })

  it("reads a lane with no synced record as nothing cleared", () => {
    const reach = laneReachablePoints(UTHAR_ALPHA_MODEL, undefined, [
      { depth: 1, coveredObjectiveIndexes: [] },
    ])
    expect(reach.total).toBe(29 + 29 + 30)
  })

  it("counts nothing a team does not cover and nothing past every depth", () => {
    // A reserve is never passed in as a member, and a muted stored objective is not in the covered
    // list: neither scores.
    const reach = laneReachablePoints(UTHAR_ALPHA_MODEL, UTHAR_ALPHA_PROGRESS, [
      { depth: 0, coveredObjectiveIndexes: [PIERCING] },
      four,
    ])
    expect(reach.total).toBe(620)
    expect(
      laneReachablePoints(UTHAR_ALPHA_MODEL, UTHAR_ALPHA_PROGRESS, []).total
    ).toBe(0)
  })
})
