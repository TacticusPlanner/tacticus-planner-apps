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
  it("adds 0, 75, 140, 144, 146 = 505 for Four at depth 5", () => {
    const reach = laneReachablePoints(UTHAR_ALPHA_MODEL, UTHAR_ALPHA_PROGRESS, [
      four,
    ])
    expect(reach.perBattle.slice(0, 6)).toEqual([0, 75, 140, 144, 146, 0])
    expect(reach.perBattle).toHaveLength(18)
    expect(reach.total).toBe(505)
  })

  it("counts an objective once when teams overlap: 1,043", () => {
    const reach = laneReachablePoints(UTHAR_ALPHA_MODEL, UTHAR_ALPHA_PROGRESS, [
      four,
      { depth: 6, coveredObjectiveIndexes: [ULTRAMARINES, MELEE] },
    ])
    expect(reach.perBattle.slice(0, 6)).toEqual([65, 140, 205, 209, 211, 213])
    expect(reach.total).toBe(1043)
  })

  it("counts only the kill score left above a partial high score", () => {
    const progress = {
      ...UTHAR_ALPHA_PROGRESS,
      battles: UTHAR_ALPHA_PROGRESS.battles.map((battle) =>
        battle.index === 2 ? { ...battle, highScore: 20 } : battle
      ),
    }
    const reach = laneReachablePoints(UTHAR_ALPHA_MODEL, progress, [four])
    expect(reach.perBattle[2]).toBe(35 - 20 + 30 + 75)
  })

  it("reads a lane with no synced record as nothing cleared", () => {
    const reach = laneReachablePoints(UTHAR_ALPHA_MODEL, undefined, [
      { depth: 1, coveredObjectiveIndexes: [] },
    ])
    expect(reach.total).toBe(29 + 30)
  })

  it("counts nothing a team does not cover and nothing past every depth", () => {
    // A reserve is never passed in as a member, and a muted stored objective is not in the covered
    // list: neither scores.
    const reach = laneReachablePoints(UTHAR_ALPHA_MODEL, UTHAR_ALPHA_PROGRESS, [
      { depth: 0, coveredObjectiveIndexes: [PIERCING] },
      four,
    ])
    expect(reach.total).toBe(505)
    expect(
      laneReachablePoints(UTHAR_ALPHA_MODEL, UTHAR_ALPHA_PROGRESS, []).total
    ).toBe(0)
  })
})
