import { describe, expect, it } from "vitest"

import { hseTier, hseVariant } from "@/test/fixtures/home-screen-event-scoring"

import {
  ceilToTenth,
  hseModeScoring,
  projectHsePoints,
  type HseProjectionInput,
} from "./hse-projection"

const psyker = {
  tier: hseTier("hse-trait-boost-psyker", "High"),
  trackers: hseVariant("hse-trait-boost-psyker").trackers,
}
const upcomingTokens = { Arena: 58, Onslaught: 15, SalvageRun: 14 }
const runningTokens = { Arena: 28, Onslaught: 7, SalvageRun: 8 }

const project = (input: Partial<HseProjectionInput> = {}) => {
  const projection = projectHsePoints({
    ...psyker,
    tokens: upcomingTokens,
    averages: {},
    pointsSoFar: 0,
    ...input,
  })
  if (!projection) throw new Error("no projection")
  return projection
}

describe("projectHsePoints: Psyker Boost worked examples (High tier)", () => {
  it("upcoming: requirement and projection with the default averages", () => {
    const projection = project()

    expect(projection.target).toBe(765)
    expect(projection.pointsSoFar).toBe(0)
    expect(projection.remaining).toBe(765)
    expect(
      projection.modes.map(
        ({ mode, tokens, unit, pointsPerUnit, average, points }) => ({
          mode,
          tokens,
          unit,
          pointsPerUnit,
          average,
          points,
        })
      )
    ).toEqual([
      {
        mode: "Arena",
        tokens: 58,
        unit: "kills",
        pointsPerUnit: 1,
        average: 5,
        points: 290,
      },
      {
        mode: "Onslaught",
        tokens: 15,
        unit: "kills",
        pointsPerUnit: 1,
        average: 20,
        points: 300,
      },
      {
        mode: "SalvageRun",
        tokens: 14,
        unit: "kills",
        pointsPerUnit: 1,
        average: 12,
        points: 168,
      },
    ])
    // ceil(765 / 1)
    expect(projection.unitsToFinal).toBe(765)
    // 765 / (58 + 15 + 14) = 765 / 87 = 8.79... -> 8.8
    expect(765 / 87).toBeCloseTo(8.793, 3)
    expect(projection.requiredPerToken).toEqual({ value: 8.8, unit: "kills" })
    // 290 + 300 + 168 = 758: 18 of 19 milestones (705), 7 short of 765
    expect(projection.projected).toEqual({
      points: 758,
      milestonesReached: 18,
      milestoneCount: 19,
      lastReachedPoints: 705,
      pointsToNext: 7,
      repeats: 0,
    })
    expect(projection.finalReached).toBe(false)
  })

  it("running with 300 points so far", () => {
    const projection = project({ tokens: runningTokens, pointsSoFar: 300 })

    expect(projection.remaining).toBe(465)
    expect(projection.unitsToFinal).toBe(465)
    // 465 / (28 + 7 + 8) = 465 / 43 = 10.81... -> 10.9
    expect(465 / 43).toBeCloseTo(10.814, 3)
    expect(projection.requiredPerToken).toEqual({ value: 10.9, unit: "kills" })
    expect(projection.modes.map((mode) => mode.points)).toEqual([140, 140, 96])
    // 300 + 140 + 140 + 96 = 676: 17 of 19 (645), 29 to the next (705)
    expect(projection.projected).toEqual({
      points: 676,
      milestonesReached: 17,
      milestoneCount: 19,
      lastReachedPoints: 645,
      pointsToNext: 29,
      repeats: 0,
    })
  })

  it("past the final milestone: 880 points reach all 19 and floor((880 - 765) / 50) = 2 repeats", () => {
    // 58 x 10 + 15 x 20 + 14 x 0 = 880
    const projection = project({ averages: { Arena: 10, SalvageRun: 0 } })
    expect(projection.projected).toEqual({
      points: 880,
      milestonesReached: 19,
      milestoneCount: 19,
      lastReachedPoints: 765,
      pointsToNext: 35,
      repeats: 2,
    })
  })

  it("target already reached: remaining 0, repeats counted from the repeat step", () => {
    const projection = project({ pointsSoFar: 800 })
    expect(projection.remaining).toBe(0)
    expect(projection.finalReached).toBe(true)
    expect(projection.repeatsSoFar).toBe(0)
    expect(projection.unitsToFinal).toBe(0)
    expect(projection.requiredPerToken).toEqual({ value: 0, unit: "kills" })
    // 800 + 758 = 1558: floor((1558 - 765) / 50) = 15 repeats
    expect(projection.projected?.points).toBe(1558)
    expect(projection.projected?.repeats).toBe(15)

    expect(project({ pointsSoFar: 915 }).repeatsSoFar).toBe(3)
  })

  it("leaves out a mode that is not unlocked and names it", () => {
    const projection = project({
      tokens: { Arena: 58, Onslaught: null, SalvageRun: 14 },
    })
    expect(projection.modes.map((mode) => mode.mode)).toEqual([
      "Arena",
      "SalvageRun",
    ])
    expect(projection.lockedModes).toEqual(["Onslaught"])
    // 765 / 72 = 10.625 -> 10.7
    expect(projection.requiredPerToken).toEqual({ value: 10.7, unit: "kills" })
  })

  it("has no requirement or projection when every scoring mode is locked", () => {
    const projection = project({
      tokens: { Arena: null, Onslaught: null, SalvageRun: null },
    })
    expect(projection.modes).toEqual([])
    expect(projection.lockedModes).toEqual(["Arena", "Onslaught", "SalvageRun"])
    expect(projection.requiredPerToken).toBeNull()
    expect(projection.projected).toBeNull()
  })

  it("keeps an edited average and hides the projection while one is cleared", () => {
    expect(project({ averages: { Onslaught: 25 } }).projected?.points).toBe(
      290 + 15 * 25 + 168
    )
    const cleared = project({ averages: { Arena: null } })
    expect(cleared.modes[0]?.average).toBeNull()
    expect(cleared.modes[0]?.points).toBeNull()
    expect(cleared.projected).toBeNull()
    expect(cleared.requiredPerToken).toEqual({ value: 8.8, unit: "kills" })
  })
})

describe("projectHsePoints: other events", () => {
  it("sums Faction Boost's two Arena trackers: 3 points per kill, 334 kills to 1000", () => {
    const variant = hseVariant("hse-faction-boost", "DarkAngels")
    const projection = projectHsePoints({
      tier: hseTier("hse-faction-boost", "High", "DarkAngels"),
      trackers: variant.trackers,
      tokens: upcomingTokens,
      averages: {},
      pointsSoFar: 0,
    })!
    expect(projection.target).toBe(1000)
    expect(projection.modes[0]).toMatchObject({
      mode: "Arena",
      unit: "kills",
      pointsPerUnit: 3,
      trackerCount: 2,
    })
    // ceil(1000 / 3)
    expect(projection.unitsToFinal).toBe(334)
    // 1000 / (87 x 3) = 3.83 -> 3.9
    expect(projection.requiredPerToken).toEqual({ value: 3.9, unit: "kills" })
    // (290 + 300 + 168) x 3 = 2274: past 1000, floor(1274 / 50) = 25 repeats (cap 200)
    expect(projection.projected?.points).toBe(2274)
    expect(projection.projected?.repeats).toBe(25)
    expect(projection.repeatCap).toBe(200)
  })

  it("caps Faction Boost's repeats at 200 and has nothing next once capped", () => {
    const projection = projectHsePoints({
      tier: hseTier("hse-faction-boost", "High", "DarkAngels"),
      trackers: hseVariant("hse-faction-boost", "DarkAngels").trackers,
      tokens: { Arena: 0, Onslaught: 0, SalvageRun: 0 },
      averages: {},
      pointsSoFar: 1000 + 250 * 50,
    })!
    expect(projection.projected?.repeats).toBe(200)
    expect(projection.projected?.pointsToNext).toBeNull()
    expect(projection.requiredPerToken).toBeNull()
  })

  it("Faction Focus counts battles: 3 per Arena battle, 8 per Onslaught and Salvage Run battle", () => {
    const projection = projectHsePoints({
      tier: hseTier("hse-faction-focus", "Default", "october-2026"),
      trackers: hseVariant("hse-faction-focus", "october-2026").trackers,
      tokens: upcomingTokens,
      averages: { Arena: 7 },
      pointsSoFar: 0,
    })!
    expect(
      projection.modes.map(
        ({ mode, unit, pointsPerUnit, average, fixedAverage }) => ({
          mode,
          unit,
          pointsPerUnit,
          average,
          fixedAverage,
        })
      )
    ).toEqual([
      {
        mode: "Arena",
        unit: "battles",
        pointsPerUnit: 3,
        average: 1,
        fixedAverage: true,
      },
      {
        mode: "Onslaught",
        unit: "battles",
        pointsPerUnit: 8,
        average: 1,
        fixedAverage: true,
      },
      {
        mode: "SalvageRun",
        unit: "battles",
        pointsPerUnit: 8,
        average: 1,
        fixedAverage: true,
      },
    ])
    expect(projection.target).toBe(1220)
    expect(projection.unitsToFinal).toBeNull()
    // 1220 / 87 tokens = 14.02 -> 14.1 event points per token
    expect(projection.requiredPerToken).toEqual({ value: 14.1, unit: "points" })
    // 58 x 3 + 15 x 8 + 14 x 8 = 174 + 120 + 112 = 406
    expect(projection.projected?.points).toBe(406)
  })

  it("Defeat Waves asks for an average: requirement in waves, no projected points", () => {
    const projection = projectHsePoints({
      tier: hseTier("hse-defeat-waves", "High"),
      trackers: hseVariant("hse-defeat-waves").trackers,
      tokens: upcomingTokens,
      averages: {},
      pointsSoFar: 0,
    })!
    expect(
      projection.modes.map((mode) => [mode.mode, mode.unit, mode.average])
    ).toEqual([
      ["Onslaught", "waves", null],
      ["SalvageRun", "waves", null],
    ])
    expect(projection.target).toBe(340)
    expect(projection.unitsToFinal).toBe(340)
    // 340 / (15 + 14) = 11.72 -> 11.8
    expect(projection.requiredPerToken).toEqual({ value: 11.8, unit: "waves" })
    expect(projection.projected).toBeNull()

    const entered = projectHsePoints({
      tier: hseTier("hse-defeat-waves", "High"),
      trackers: hseVariant("hse-defeat-waves").trackers,
      tokens: upcomingTokens,
      averages: { Onslaught: 10, SalvageRun: 5 },
      pointsSoFar: 0,
    })!
    expect(entered.projected?.points).toBe(150 + 70)
  })

  it("Warp Surge projects Arena only (25 points per Chaos kill)", () => {
    const projection = projectHsePoints({
      tier: hseTier("hse-warp-surge", "High"),
      trackers: hseVariant("hse-warp-surge").trackers,
      tokens: upcomingTokens,
      averages: {},
      pointsSoFar: 0,
    })!
    expect(
      projection.modes.map((mode) => [mode.mode, mode.pointsPerUnit])
    ).toEqual([["Arena", 25]])
    expect(projection.unitsToFinal).toBe(400)
  })

  it("has no projection for an event that scores in no token mode (Arsenal of War)", () => {
    expect(hseModeScoring(hseVariant("hse-arsenal-of-war").trackers)).toEqual(
      []
    )
    expect(
      projectHsePoints({
        tier: hseTier("hse-arsenal-of-war", "High"),
        trackers: hseVariant("hse-arsenal-of-war").trackers,
        tokens: upcomingTokens,
        averages: {},
        pointsSoFar: 0,
      })
    ).toBeNull()
  })

  it("rounds a required average up to one decimal without floating-point dust", () => {
    expect(ceilToTenth(8.8)).toBe(8.8)
    expect(ceilToTenth(8.81)).toBe(8.9)
    expect(ceilToTenth(0)).toBe(0)
  })
})
