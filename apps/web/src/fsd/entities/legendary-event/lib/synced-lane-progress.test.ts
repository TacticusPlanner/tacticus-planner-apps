import { describe, expect, it } from "vitest"

import { lysanderEvent } from "@/test/fixtures/legendary-events"

import { buildLanePointsModel } from "./lane-points-model"
import { buildSyncedLaneProgress } from "./synced-lane-progress"

const model = buildLanePointsModel(lysanderEvent.alpha)
// `encounterPoints` mirrors the synced shape but is never read (spec: earned points are the high
// score plus cleared scores).
const encounter = (objectivesCleared: number[], highScore: number) => ({
  objectivesCleared,
  highScore,
  encounterPoints: highScore,
})

describe("buildSyncedLaneProgress", () => {
  it("maps a partially cleared battle: 31 + 32 + 95 + 80 = 238 of 471", () => {
    const view = buildSyncedLaneProgress(model, {
      encounters: [encounter([0, 2, 3], 31)],
    })
    expect(view.status).toBe("synced")
    expect(view.battles[0]).toEqual({
      index: 0,
      // defeat-all, Eviscerate, Suppressive Fire, Flying, Min 5 hits, No Resilient
      cleared: [true, false, true, true, false, false],
      clearedCount: 3,
      pointsEarned: 238,
      maxPoints: 471,
      highScore: 31,
      complete: false,
    })
  })

  it("marks a battle with every objective id cleared complete: 37 + 32 + 375 = 444", () => {
    const encounters = [
      encounter([0], 0),
      encounter([0], 0),
      encounter([0], 0),
      encounter([0, 1, 2, 3, 4, 5], 37),
    ]
    const view = buildSyncedLaneProgress(model, { encounters })
    expect(view.battles[3]).toMatchObject({
      cleared: [true, true, true, true, true, true],
      clearedCount: 6,
      complete: true,
      pointsEarned: 444,
      highScore: 37,
    })
    expect(view.completeBattles).toBe(1)
  })

  it("ignores ids outside 0..5", () => {
    const view = buildSyncedLaneProgress(model, {
      encounters: [encounter([0, 6, -1, 2], 0)],
    })
    expect(view.battles[0]).toMatchObject({
      cleared: [true, false, true, false, false, false],
      clearedCount: 2,
      pointsEarned: 32 + 95,
    })
  })

  it("leaves battles beyond the synced encounters empty and sums the rest", () => {
    const highScores = [10, 20, 30, 40, 50, 60, 70]
    const view = buildSyncedLaneProgress(model, {
      encounters: highScores.map((value) => encounter([0, 1], value)),
    })
    expect(view.battles).toHaveLength(18)
    for (const battle of view.battles.slice(7)) {
      expect(battle.cleared.every((cleared) => !cleared)).toBe(true)
      expect(battle.clearedCount).toBe(0)
      expect(battle.pointsEarned).toBe(0)
      expect(battle.highScore).toBe(0)
    }
    // Σ high scores + 7 × (defeat-all 32 + Eviscerate 75)
    expect(view.pointsEarned).toBe(280 + 7 * 107)
    expect(view.maxPoints).toBe(9000)
    expect(view.completeBattles).toBe(0)
  })

  it("presents a null lane as noLane with nothing earned", () => {
    const view = buildSyncedLaneProgress(model, null)
    expect(view.status).toBe("noLane")
    expect(view.pointsEarned).toBe(0)
    expect(view.maxPoints).toBe(9000)
    expect(view.completeBattles).toBe(0)
    expect(view.battles.every((battle) => battle.pointsEarned === 0)).toBe(true)
  })

  it("presents an absent event entry as noEvent with the lane maximum", () => {
    const view = buildSyncedLaneProgress(model, undefined)
    expect(view.status).toBe("noEvent")
    expect(view.pointsEarned).toBe(0)
    expect(view.maxPoints).toBe(9000)
    expect(view.completeBattles).toBe(0)
  })
})
