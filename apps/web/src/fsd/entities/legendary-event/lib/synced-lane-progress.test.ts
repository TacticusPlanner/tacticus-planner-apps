import { describe, expect, it } from "vitest"

import { lysanderEvent, utharEvent } from "@/test/fixtures/legendary-events"

import { buildLanePointsModel } from "./lane-points-model"
import {
  buildSyncedLaneProgress,
  objectiveClearedCounts,
} from "./synced-lane-progress"

const model = buildLanePointsModel(lysanderEvent.alpha)
// The game reports `encounterPoints` (the kill score) equal to `highScore`; both are counted (spec:
// earned points are the kill score plus the high score plus cleared scores).
const encounter = (
  objectivesCleared: number[],
  highScore: number,
  encounterPoints = highScore
) => ({
  objectivesCleared,
  highScore,
  encounterPoints,
})

describe("buildSyncedLaneProgress", () => {
  it("maps a partially cleared battle: 31 + 31 + 32 + 95 + 80 = 269 of 471", () => {
    const view = buildSyncedLaneProgress(model, {
      encounters: [encounter([0, 2, 3], 31)],
    })
    expect(view.status).toBe("synced")
    expect(view.battles[0]).toEqual({
      index: 0,
      // defeat-all, Eviscerate, Suppressive Fire, Flying, Min 5 hits, No Resilient
      cleared: [true, false, true, true, false, false],
      clearedCount: 3,
      pointsEarned: 269,
      maxPoints: 471,
      killScore: 31,
      highScore: 31,
      complete: false,
    })
  })

  it("marks a battle with every objective id cleared complete: 37 + 37 + 32 + 375 = 481, its maximum", () => {
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
      pointsEarned: 481,
      maxPoints: 481,
      killScore: 37,
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
    const highScores = [10, 20, 30, 35, 40, 45, 45]
    const view = buildSyncedLaneProgress(model, {
      encounters: highScores.map((value) => encounter([0, 1], value)),
    })
    expect(view.battles).toHaveLength(18)
    for (const battle of view.battles.slice(7)) {
      expect(battle.cleared.every((cleared) => !cleared)).toBe(true)
      expect(battle.clearedCount).toBe(0)
      expect(battle.pointsEarned).toBe(0)
      expect(battle.killScore).toBe(0)
      expect(battle.highScore).toBe(0)
    }
    // Σ kill scores + Σ high scores + 7 × (defeat-all 32 + Eviscerate 75)
    expect(view.pointsEarned).toBe(225 + 225 + 7 * 107)
    expect(view.maxPoints).toBe(9000)
    expect(view.completeBattles).toBe(0)
  })

  it("reads the kill score and the high score independently, each capped at battlesPoints", () => {
    // Lysander Alpha battle 1: battlesPoints 32.
    const view = buildSyncedLaneProgress(model, {
      encounters: [encounter([0], 20, 12)],
    })
    expect(view.battles[0]).toMatchObject({
      killScore: 12,
      highScore: 20,
      pointsEarned: 12 + 20 + 32,
    })
    const capped = buildSyncedLaneProgress(model, {
      encounters: [encounter([0, 1, 2, 3, 4, 5], 90, 70)],
    })
    expect(capped.battles[0]).toMatchObject({
      killScore: 32,
      highScore: 32,
      pointsEarned: 471,
    })
  })

  it("works the Uthar Alpha battle 1 example: 29 + 29 + 30 + 95 + 50 + 65 = 298 of 463", () => {
    const uthar = buildLanePointsModel(utharEvent.alpha)
    const view = buildSyncedLaneProgress(uthar, {
      encounters: [encounter([0, 2, 3, 4], 29)],
    })
    expect(view.battles[0]).toMatchObject({
      pointsEarned: 298,
      maxPoints: 463,
      killScore: 29,
      highScore: 29,
      complete: false,
    })
  })

  it("makes Uthar's lane totals equal the synced run points: 4,137 + 4,709 + 4,293 = 13,139", () => {
    const full = [0, 1, 2, 3, 4, 5]
    // Battles played at full scores (Σ battlesPoints of the first 12, 13 and 12 battles is 506, 551
    // and 441) with cleared defeat-all and objective scores of 3,125, 3,607 and 3,411.
    const cleared = {
      alpha: [
        ...Array.from({ length: 7 }, () => full),
        [0],
        [0],
        [0],
        [0],
        [0, 1, 4],
      ],
      beta: [
        ...Array.from({ length: 8 }, () => full),
        [0],
        [0],
        [0, 2],
        [0, 2],
        [0, 2],
      ],
      gamma: [
        ...Array.from({ length: 7 }, () => full),
        [0],
        [0],
        [0],
        [0, 2],
        [0, 2, 3],
      ],
    } as const
    const lanes = (["alpha", "beta", "gamma"] as const).map((laneId) => {
      const laneModel = buildLanePointsModel(utharEvent[laneId])
      const encounters = cleared[laneId].map((ids, index) =>
        encounter([...ids], laneModel.battles[index]!.battlePoints)
      )
      const view = buildSyncedLaneProgress(laneModel, { encounters })
      const highScores = view.battles.reduce((sum, b) => sum + b.highScore, 0)
      const killScores = view.battles.reduce((sum, b) => sum + b.killScore, 0)
      for (const battle of view.battles) {
        expect(battle.pointsEarned).toBeLessThanOrEqual(battle.maxPoints)
      }
      return {
        killScores,
        highScores,
        clearedScores: view.pointsEarned - killScores - highScores,
        pointsEarned: view.pointsEarned,
      }
    })
    expect(lanes).toEqual([
      {
        killScores: 506,
        highScores: 506,
        clearedScores: 3125,
        pointsEarned: 4137,
      },
      {
        killScores: 551,
        highScores: 551,
        clearedScores: 3607,
        pointsEarned: 4709,
      },
      {
        killScores: 441,
        highScores: 441,
        clearedScores: 3411,
        pointsEarned: 4293,
      },
    ])
    expect(lanes.reduce((sum, lane) => sum + lane.pointsEarned, 0)).toBe(13_139)
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

describe("objectiveClearedCounts", () => {
  it("counts the battles with each objective cleared, in catalog order", () => {
    const complete = encounter([0, 1, 2, 3, 4, 5], 37)
    const view = buildSyncedLaneProgress(model, {
      encounters: [
        encounter([0, 2, 3], 31),
        encounter([0], 268),
        encounter([0, 1], 303),
        complete,
        encounter([0, 1, 2], 318),
        encounter([0, 1, 2, 3], 418),
        encounter([0, 1, 2, 3, 5], 476),
        ...Array.from({ length: 6 }, () => complete),
      ],
    })
    expect(objectiveClearedCounts(view, 5)).toEqual([11, 11, 10, 7, 8])
  })

  it("yields zeros for a lane without progress", () => {
    const view = buildSyncedLaneProgress(model, null)
    expect(objectiveClearedCounts(view, 5)).toEqual([0, 0, 0, 0, 0])
  })
})
