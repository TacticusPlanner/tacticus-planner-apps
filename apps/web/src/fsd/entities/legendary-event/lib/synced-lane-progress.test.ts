import { describe, expect, it } from "vitest"

import { lysanderEvent } from "@/test/fixtures/legendary-events"

import { buildLanePointsModel } from "./lane-points-model"
import { buildSyncedLaneProgress } from "./synced-lane-progress"

const model = buildLanePointsModel(lysanderEvent.alpha)
const encounter = (
  objectivesCleared: number[],
  highScore: number,
  encounterPoints: number
) => ({ objectivesCleared, highScore, encounterPoints })

describe("buildSyncedLaneProgress", () => {
  it("maps a partially cleared battle: defeat-all, Suppressive Fire and Flying, 238 of 471", () => {
    const view = buildSyncedLaneProgress(model, {
      encounters: [encounter([0, 2, 3], 31, 238)],
    })
    expect(view.status).toBe("synced")
    expect(view.battles[0]).toEqual({
      index: 0,
      // defeat-all, Eviscerate, Suppressive Fire, Flying, Min 5 hits, No Resilient
      cleared: [true, false, true, true, false, false],
      pointsEarned: 238,
      maxPoints: 471,
      highScore: 31,
      complete: false,
    })
  })

  it("marks a battle with every objective id cleared complete", () => {
    const encounters = [
      encounter([0], 0, 60),
      encounter([0], 0, 60),
      encounter([0], 0, 60),
      encounter([0, 1, 2, 3, 4, 5], 37, 486),
    ]
    const view = buildSyncedLaneProgress(model, { encounters })
    expect(view.battles[3]).toMatchObject({
      cleared: [true, true, true, true, true, true],
      complete: true,
      pointsEarned: 486,
      highScore: 37,
    })
  })

  it("ignores ids outside 0..5", () => {
    const view = buildSyncedLaneProgress(model, {
      encounters: [encounter([0, 6, -1, 2], 0, 100)],
    })
    expect(view.battles[0]?.cleared).toEqual([
      true,
      false,
      true,
      false,
      false,
      false,
    ])
  })

  it("leaves battles beyond the synced encounters empty and sums the rest", () => {
    const points = [238, 300, 410, 486, 520, 700, 756]
    const view = buildSyncedLaneProgress(model, {
      encounters: points.map((value) => encounter([0], 10, value)),
    })
    expect(view.battles).toHaveLength(18)
    for (const battle of view.battles.slice(7)) {
      expect(battle.cleared.every((cleared) => !cleared)).toBe(true)
      expect(battle.pointsEarned).toBe(0)
      expect(battle.highScore).toBe(0)
    }
    expect(view.pointsEarned).toBe(3410)
    expect(view.maxPoints).toBe(9000)
  })

  it("presents a null lane as noLane with nothing earned", () => {
    const view = buildSyncedLaneProgress(model, null)
    expect(view.status).toBe("noLane")
    expect(view.pointsEarned).toBe(0)
    expect(view.maxPoints).toBe(9000)
    expect(view.battles.every((battle) => battle.pointsEarned === 0)).toBe(true)
  })

  it("presents an absent event entry as noEvent with the lane maximum", () => {
    const view = buildSyncedLaneProgress(model, undefined)
    expect(view.status).toBe("noEvent")
    expect(view.pointsEarned).toBe(0)
    expect(view.maxPoints).toBe(9000)
  })
})
