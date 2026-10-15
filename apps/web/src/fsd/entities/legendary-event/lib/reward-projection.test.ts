import { describe, expect, it } from "vitest"

import { utharEvent } from "@/test/fixtures/legendary-events"

import type {
  LegendaryEventRun,
  LegendaryEventRunInputs,
} from "../model/plan.types"
import type { LegendaryEventRewards } from "../model/types"
import { projectRewards, type RewardProjectionInput } from "./reward-projection"

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
  currentEventRun: 2,
  extraCurrencyPerPayout: null,
  ...fields,
})

// The spec's worked example: Uthar in run 2, run inputs 1 `10, 0, off, 0`, 2 `6, 0, off, 0`,
// 3 `10, 0, bundle on, 0`, Show paid options on.
const utharExample: RewardProjectionInput = {
  rewards: uthar,
  progress: synced(),
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
        currentEventRun: 1,
      }),
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
        currentEventRun: 1,
      }),
      runs: [],
      showPaidOptions: false,
    })

    expect(projection.points).toMatchObject({
      state: "milestone",
      cumulativePoints: 12_500,
    })
  })
})
