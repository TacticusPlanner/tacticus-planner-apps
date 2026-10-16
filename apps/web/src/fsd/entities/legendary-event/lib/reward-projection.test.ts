import { progressionOrder } from "@workspace/game-domain"
import { describe, expect, it } from "vitest"

import { utharEvent } from "@/test/fixtures/legendary-events"

import type {
  LegendaryEventRun,
  LegendaryEventRunInputs,
} from "../model/plan.types"
import type { LegendaryEventRewards } from "../model/types"
import {
  ASCENSION_STEP_PROGRESSION,
  ASCENSION_STEPS,
  nextAscensionStep,
  projectRewards,
  unitNextAscensionStep,
  type RewardProjectionInput,
} from "./reward-projection"
import type { LegendaryEventRunResolution } from "./run-resolution"

const uthar = utharEvent.rewards

const runInputs = (
  run: LegendaryEventRun,
  regularMissions: number,
  premiumMissions = 0,
  bundlePurchased = false,
  closeShards = 0
): LegendaryEventRunInputs => ({
  run,
  regularMissions,
  premiumMissions,
  bundlePurchased,
  closeShards,
  updatedAt: "2026-10-10T00:00:00Z",
})

const synced = (
  fields: Partial<NonNullable<RewardProjectionInput["progress"]>> = {}
): NonNullable<RewardProjectionInput["progress"]> => ({
  currentPoints: 5000,
  currentCurrency: 120,
  currentClaimedChestIndex: 10,
  currentShards: 250,
  extraCurrencyPerPayout: null,
  ...fields,
})

/** An active event with `run` in progress. */
const inRun = (run: LegendaryEventRun): LegendaryEventRunResolution => ({
  kind: "known",
  endedRuns: (run - 1) as 0 | 1 | 2,
  currentRun: run,
  nextRun: run < 3 ? ((run + 1) as LegendaryEventRun) : null,
  nextStartMs: null,
})
/** An upcoming event whose first `ended` runs are over. */
const between = (ended: 0 | 1 | 2): LegendaryEventRunResolution => ({
  kind: "known",
  endedRuns: ended,
  currentRun: null,
  nextRun: (ended + 1) as LegendaryEventRun,
  nextStartMs: null,
})
const UNKNOWN: LegendaryEventRunResolution = {
  kind: "unknown",
  endedRuns: null,
  currentRun: null,
  nextRun: null,
  nextStartMs: null,
}

// The spec's worked example: Uthar in run 2, run inputs 1 `10, 0, off, 0`, 2 `6, 0, off, 0`,
// 3 `10, 0, bundle on, 0`, Show paid options on.
const utharExample: RewardProjectionInput = {
  rewards: uthar,
  progress: synced(),
  resolution: inRun(2),
  // The event unit is not in the synced roster: the goal starts at Unlock.
  unit: undefined,
  runs: [runInputs(1, 10), runInputs(2, 6), runInputs(3, 10, 0, true)],
  showPaidOptions: true,
}

// V1's Dante ladder (tacticusplanner `10-dante.json`), copied so the parity cases stay pinned.
const danteChestCosts = [
  60,
  80,
  100,
  120,
  140,
  160,
  180,
  200,
  220,
  240,
  260,
  280,
  300,
  320,
  340,
  350,
  360,
  370,
  380,
  390,
  ...Array<number>(16).fill(400),
  800,
  900,
  1000,
  1100,
  1200,
  1300,
  1400,
  ...Array<number>(11).fill(1500),
]
const dantePayouts = [
  [100, 25],
  [250, 30],
  [500, 35],
  [1000, 40],
  [1500, 45],
  [2000, 50],
  [2500, 55],
  [3000, 60],
  [3500, 65],
  [4000, 70],
  [4500, 75],
  [5000, 80],
  [5500, 85],
  [6000, 90],
  [6500, 95],
  [7000, 100],
  [7500, 110],
  [8000, 120],
  [8500, 140],
  [9000, 160],
  [9500, 180],
  [10000, 200],
  [10500, 220],
  [11000, 240],
  [11500, 260],
  [12000, 280],
  [12500, 300],
  [13000, 310],
  [13500, 320],
  [14000, 330],
] as const
const dante: LegendaryEventRewards = {
  pointsMilestones: dantePayouts.map(([cumulativePoints, engramPayout], i) => ({
    milestone: i + 1,
    cumulativePoints,
    engramPayout,
  })),
  chestsMilestones: danteChestCosts.map((engramCost, i) => ({
    chestLevel: i + 1,
    engramCost,
  })),
  progression: {
    unlock: 400,
    fourStars: 120,
    fiveStars: 180,
    blueStar: 200,
    mythic: 250,
    twoBlueStars: 150,
  },
  shardsPerChest: 25,
}

describe("projectRewards", () => {
  it("works the Uthar example without the premium track", () => {
    const projection = projectRewards(utharExample)

    expect(projection.base).toEqual({
      points: 5000,
      currency: 120,
      chestsClaimed: 10,
      shards: 250,
    })
    expect(projection.currentRun).toBe(2)
    expect(projection.futureRuns).toEqual([
      { run: 3, missionCurrency: 250, bundleCurrency: 300, closeShards: 0 },
    ])
    expect(projection.bonusPerPayout).toBe(0)
    expect(projection.goal).toEqual({
      step: "unlock",
      threshold: 400,
      shardsTowardStep: 250,
      stepSize: 400,
    })
    expect(projection.chests).toEqual({
      beyondChestLadder: false,
      required: 16,
      toGo: 6,
    })
    expect(projection.currency).toEqual({
      required: 3350,
      collected: 1620,
      futureMissions: 250,
      futureBundles: 300,
      fromPoints: 1180,
    })
    // Running payouts from milestone 13: 85, 175, 270, 370, 480, 600, 740, 900, 1,080, 1,280.
    expect(projection.points).toEqual({
      state: "milestone",
      milestone: 22,
      cumulativePoints: 10000,
      pointsToGo: 5000,
      averageBattlesPerLane: 6.7,
    })
  })

  it("works the Uthar example with the premium track", () => {
    const projection = projectRewards({
      ...utharExample,
      progress: synced({ extraCurrencyPerPayout: 15 }),
      runs: [runInputs(1, 10), runInputs(2, 6), runInputs(3, 10, 10, true)],
    })

    expect(projection.futureRuns).toEqual([
      { run: 3, missionCurrency: 800, bundleCurrency: 315, closeShards: 0 },
    ])
    expect(projection.bonusPerPayout).toBe(15)
    expect(projection.currency).toEqual({
      required: 3350,
      collected: 1620,
      futureMissions: 800,
      futureBundles: 315,
      fromPoints: 615,
    })
    // 100, 205, 315, 430, 555, 690.
    expect(projection.points).toEqual({
      state: "milestone",
      milestone: 18,
      cumulativePoints: 8000,
      pointsToGo: 3000,
      averageBattlesPerLane: 5.3,
    })
  })

  it("does not add the inputs of runs already started again", () => {
    const changed = projectRewards({
      ...utharExample,
      runs: [
        runInputs(1, 10),
        runInputs(2, 10, 0, true),
        runInputs(3, 10, 0, true),
      ],
    })
    expect(changed).toEqual(projectRewards(utharExample))
  })

  it("starts from zero and counts every run without a synced entry", () => {
    const projection = projectRewards({
      rewards: uthar,
      progress: undefined,
      resolution: between(0),
      unit: undefined,
      runs: [runInputs(1, 10)],
      showPaidOptions: false,
    })

    expect(projection.synced).toBe(false)
    expect(projection.currentRun).toBe(1)
    expect(projection.base).toEqual({
      points: 0,
      currency: 0,
      chestsClaimed: 0,
      shards: 0,
    })
    expect(projection.futureRuns.map((run) => run.run)).toEqual([1, 2, 3])
    expect(projection.currency?.futureMissions).toBe(250)
    // 16 chests for unlock: 3,350 − 250 from run 1's missions.
    expect(projection.currency?.fromPoints).toBe(3100)
  })

  it("never counts chests to go below zero when fewer shards are held than chests claimed", () => {
    const projection = projectRewards({
      ...utharExample,
      progress: synced({ currentClaimedChestIndex: 20, currentShards: 100 }),
    })

    expect(projection.goal).toMatchObject({ step: "unlock", threshold: 400 })
    expect(projection.chests).toEqual({
      beyondChestLadder: false,
      required: 32,
      toGo: 12,
    })
  })

  it("reports enough currency now with nothing left for points", () => {
    const projection = projectRewards({
      ...utharExample,
      progress: synced({ currentCurrency: 2000 }),
    })

    expect(projection.currency?.fromPoints).toBeLessThanOrEqual(0)
    expect(projection.points).toEqual({ state: "affordableNow" })
  })

  it("reports a goal beyond the chest ladder without currency or points", () => {
    // Uthar has 54 chests; 41 claimed and 50 shards need 14 more for unlock: 55.
    const projection = projectRewards({
      ...utharExample,
      progress: synced({ currentClaimedChestIndex: 41, currentShards: 50 }),
    })

    expect(projection.chests).toEqual({
      beyondChestLadder: true,
      required: 55,
      ladderSize: 54,
    })
    expect(projection.currency).toBeNull()
    expect(projection.points).toBeNull()
  })

  it("reports the currency points alone cannot cover past the last milestone", () => {
    // Only milestone 82 (27,000, +715) is left; 3,350 − 1,500 = 1,850 is needed.
    const projection = projectRewards({
      rewards: uthar,
      progress: synced({ currentPoints: 26_900, currentCurrency: 0 }),
      resolution: inRun(2),
      unit: undefined,
      runs: [],
      showPaidOptions: false,
    })

    expect(projection.points).toEqual({
      state: "beyondPointsLadder",
      currencyShort: 1135,
    })
  })

  it("reports every step reached without chest, currency or points figures", () => {
    const projection = projectRewards({
      ...utharExample,
      progress: synced({ currentShards: 1300 }),
    })

    expect(projection.goal).toEqual({ step: "fullyAscended" })
    expect(projection.chests).toBeNull()
    expect(projection.currency).toBeNull()
    expect(projection.points).toBeNull()
  })

  it("moves to the next step once a threshold is held", () => {
    const projection = projectRewards({
      ...utharExample,
      progress: synced({ currentShards: 450 }),
    })

    expect(projection.goal).toEqual({
      step: "fourStars",
      threshold: 520,
      shardsTowardStep: 50,
      stepSize: 120,
    })
  })

  it("treats premium missions, the bundle and close shards as 0 with paid options off", () => {
    const projection = projectRewards({
      ...utharExample,
      runs: [runInputs(2, 0, 10), runInputs(3, 10, 10, true, 50)],
      showPaidOptions: false,
    })

    expect(projection.futureRuns).toEqual([
      { run: 3, missionCurrency: 250, bundleCurrency: 0, closeShards: 0 },
    ])
    expect(projection.futureCloseShards).toBe(0)
    // The current run's premium missions would add the payout bonus with paid options on.
    expect(projection.bonusPerPayout).toBe(0)
    expect(
      projectRewards({ ...utharExample, runs: [runInputs(2, 0, 10)] })
        .bonusPerPayout
    ).toBe(15)
  })

  it("adds future close shards to the shards held", () => {
    const projection = projectRewards({
      ...utharExample,
      runs: [runInputs(3, 0, 0, false, 50)],
    })

    // 250 + 50 = 300 of 400: 4 chests to go.
    expect(projection.futureCloseShards).toBe(50)
    expect(projection.goal).toMatchObject({ shardsTowardStep: 300 })
    expect(projection.chests).toMatchObject({ toGo: 4, required: 14 })
  })

  it("matches V1 on the Dante ladder without run inputs (13,000)", () => {
    const projection = projectRewards({
      rewards: dante,
      progress: synced({
        currentPoints: 1444,
        currentCurrency: 65,
        currentClaimedChestIndex: 2,
        currentShards: 50,
      }),
      resolution: inRun(1),
      unit: undefined,
      runs: [],
      showPaidOptions: false,
    })

    expect(projection.points).toMatchObject({
      state: "milestone",
      cumulativePoints: 13_000,
    })
  })

  it("matches V1 on the Dante ladder without run inputs (12,500)", () => {
    const projection = projectRewards({
      rewards: dante,
      progress: synced({
        currentPoints: 12_261,
        currentCurrency: 160,
        currentClaimedChestIndex: 15,
        currentShards: 375,
      }),
      resolution: inRun(1),
      unit: undefined,
      runs: [],
      showPaidOptions: false,
    })

    expect(projection.points).toMatchObject({
      state: "milestone",
      cumulativePoints: 12_500,
    })
  })
})

describe("projectRewards: resolved runs and the unit's step", () => {
  it("works the Uthar example with the unit already unlocked (4 stars at 120)", () => {
    const projection = projectRewards({
      rewards: uthar,
      progress: synced({
        currentPoints: 13_139,
        currentCurrency: 60,
        currentClaimedChestIndex: 17,
        currentShards: 25,
      }),
      resolution: between(2),
      unit: { progressionIndex: "Legendary:RedThreeStars" },
      runs: [],
      showPaidOptions: true,
    })

    expect(projection.fromStep).toBe("fourStars")
    expect(projection.futureRuns.map((run) => run.run)).toEqual([3])
    expect(projection.goal).toEqual({
      step: "fourStars",
      threshold: 120,
      shardsTowardStep: 25,
      stepSize: 120,
    })
    // ⌈(120 − 25) ÷ 25⌉ = 4; 17 + 4 = 21.
    expect(projection.chests).toEqual({
      beyondChestLadder: false,
      required: 21,
      toGo: 4,
    })
    // Chests 1–21 cost 5,250; chests 1–17 3,710 + 60 in hand = 3,770.
    expect(projection.currency).toEqual({
      required: 5250,
      collected: 3770,
      futureMissions: 0,
      futureBundles: 0,
      fromPoints: 1480,
    })
    // Running payouts from milestone 29: 320, 650, 990, 1,340, 1,695.
    expect(projection.points).toEqual({
      state: "milestone",
      milestone: 33,
      cumulativePoints: 14_750,
      pointsToGo: 1611,
      averageBattlesPerLane: 9.8,
    })
  })

  it("between runs counts only run 3's missions, not run 2's again", () => {
    const projection = projectRewards({
      rewards: uthar,
      progress: synced(),
      resolution: between(2),
      unit: undefined,
      runs: [runInputs(2, 10), runInputs(3, 10)],
      showPaidOptions: false,
    })

    expect(projection.currentRun).toBe(3)
    expect(projection.futureRuns).toEqual([
      { run: 3, missionCurrency: 250, bundleCurrency: 0, closeShards: 0 },
    ])
    expect(projection.currency?.futureMissions).toBe(250)
  })

  it("counts no future inputs while the run is unknown", () => {
    const runs = [
      runInputs(1, 10, 10, true, 20),
      runInputs(2, 10, 10, true, 20),
      runInputs(3, 10, 10, true, 20),
    ]
    const projection = projectRewards({
      ...utharExample,
      resolution: UNKNOWN,
      runs,
    })

    expect(projection.futureRuns).toEqual([])
    expect(projection.futureCloseShards).toBe(0)
    expect(projection.bonusPerPayout).toBe(0)
    expect(projection.currency).toMatchObject({
      futureMissions: 0,
      futureBundles: 0,
      // From the synced base alone: 3,350 − 1,620.
      fromPoints: 1730,
    })
    expect(
      projectRewards({ ...utharExample, resolution: UNKNOWN, runs: [] })
    ).toEqual(projection)
  })

  it("counts no future inputs once every run has ended", () => {
    const projection = projectRewards({
      ...utharExample,
      resolution: {
        kind: "known",
        endedRuns: 3,
        currentRun: null,
        nextRun: null,
        nextStartMs: null,
      },
    })

    expect(projection.futureRuns).toEqual([])
  })

  it("reports every step reached for a unit at two blue stars", () => {
    const projection = projectRewards({
      ...utharExample,
      unit: { progressionIndex: "Mythic:TwoBlueStars" },
    })

    expect(projection.goal).toEqual({ step: "fullyAscended" })
    expect(projection.chests).toBeNull()
  })
})

describe("unitNextAscensionStep", () => {
  it("maps each step to a state of the game-domain progression order, in order", () => {
    const indexes = ASCENSION_STEPS.map((step) =>
      progressionOrder.indexOf(ASCENSION_STEP_PROGRESSION[step])
    )
    expect(indexes.every((index) => index >= 0)).toBe(true)
    expect([...indexes].sort((a, b) => a - b)).toEqual(indexes)
    expect(new Set(indexes).size).toBe(ASCENSION_STEPS.length)
  })

  it.each([
    [undefined, "unlock"],
    ["Legendary:RedThreeStars", "fourStars"],
    ["Legendary:RedFourStars", "fiveStars"],
    ["Legendary:OneBlueStar", "mythic"],
    ["Mythic:OneBlueStar", "twoBlueStars"],
    ["Mythic:TwoBlueStars", "fullyAscended"],
    ["Mythic:MythicWings", "fullyAscended"],
  ] as const)("names the next step of a unit at %s", (state, step) => {
    expect(
      unitNextAscensionStep(state ? { progressionIndex: state } : undefined)
    ).toBe(step)
  })
})

describe("nextAscensionStep", () => {
  // Uthar: unlock 400, four stars +120, five stars +180, blue star +200, mythic +250, two blue +150.
  it.each([
    [0, "unlock", 400, 0, 400],
    [399, "unlock", 400, 399, 400],
    [400, "fourStars", 520, 0, 120],
    [600, "fiveStars", 700, 80, 180],
    [700, "blueStar", 900, 0, 200],
    [1000, "mythic", 1150, 100, 250],
    [1299, "twoBlueStars", 1300, 149, 150],
  ])(
    "names the step above %i shards",
    (shards, step, threshold, shardsTowardStep, stepSize) => {
      expect(nextAscensionStep(shards, uthar.progression, "unlock")).toEqual({
        step,
        threshold,
        shardsTowardStep,
        stepSize,
      })
    }
  )

  it("reports every step reached at the last threshold", () => {
    expect(nextAscensionStep(1300, uthar.progression, "unlock")).toEqual({
      step: "fullyAscended",
    })
  })

  it("counts the shards from the unit's next step", () => {
    expect(nextAscensionStep(25, uthar.progression, "fourStars")).toEqual({
      step: "fourStars",
      threshold: 120,
      shardsTowardStep: 25,
      stepSize: 120,
    })
    expect(nextAscensionStep(130, uthar.progression, "fourStars")).toEqual({
      step: "fiveStars",
      threshold: 300,
      shardsTowardStep: 10,
      stepSize: 180,
    })
    expect(nextAscensionStep(0, uthar.progression, "fullyAscended")).toEqual({
      step: "fullyAscended",
    })
  })
})
