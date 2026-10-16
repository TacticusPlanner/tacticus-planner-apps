import { describe, expect, it } from "vitest"

import type {
  LegendaryEventRewards,
  LegendaryEventRunInputs,
} from "@/entities/legendary-event"
import { utharEvent } from "@/test/fixtures/legendary-events"

import { forecastRuns, ohSoCloseHint, type ForecastInput } from "./run-forecast"
import type { RunSupply } from "./token-supply"

const runInputs = (
  run: 1 | 2 | 3,
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
  updatedAt: "2026-10-15T00:00:00Z",
})

const supply = (
  run: 1 | 2 | 3,
  state: RunSupply["state"],
  total: number
): RunSupply => ({ run, state, free: total, ad: 0, bonusDelivery: 0, total })

const workedPoints = [205, 209, 211, 148, 140, 65].map((points) => ({ points }))

/** The worked forecast: Uthar in run 2 (32 tokens left), run 3 planned (68), Stage 3's inputs. */
const worked = (overrides: Partial<ForecastInput> = {}): ForecastInput => ({
  rewards: utharEvent.rewards,
  progress: {
    currentPoints: 5000,
    currentCurrency: 120,
    currentClaimedChestIndex: 10,
    currentShards: 250,
    extraCurrencyPerPayout: null,
  },
  supply: [
    supply(1, "done", 0),
    supply(2, "now", 32),
    supply(3, "planned", 68),
  ],
  tokens: workedPoints,
  runs: [runInputs(1, 10), runInputs(2, 6), runInputs(3, 10, 0, true)],
  showPaidOptions: true,
  ...overrides,
})

describe("forecastRuns", () => {
  it("works the Uthar forecast", () => {
    const { runs, markers } = forecastRuns(worked())
    const [run1, run2, run3] = runs

    expect(run1).toMatchObject({
      state: "done",
      tokensUsed: 0,
      endingPoints: 5000,
    })
    expect(run2).toMatchObject({
      state: "now",
      tokensUsed: 6,
      tokensLeftOver: 26,
      pointsEarned: 978,
      endingPoints: 5978,
      // Milestone 13 at 5,500 pays 85, no bonus; chest 11 costs 260.
      currencyEarned: 85,
      missionCurrency: 0,
      endingCurrency: 205,
      chestsOpened: 0,
      chestsClaimed: 10,
      endingShards: 250,
      stepsReached: [],
      next: { step: "unlock", threshold: 400 },
      shardsMissing: 150,
      ohSoClose: null,
    })
    expect(run3).toMatchObject({
      state: "planned",
      tokensUsed: 0,
      tokensLeftOver: 68,
      pointsEarned: 0,
      endingPoints: 5978,
      // 10 × 25 missions + the 300 bundle: 755 in hand, chests 11 (260) and 12 (280) open.
      missionCurrency: 250,
      bundleCurrency: 300,
      currencyEarned: 550,
      endingCurrency: 215,
      chestsOpened: 2,
      chestsClaimed: 12,
      endingShards: 300,
      shardsMissing: 100,
      ohSoClose: null,
    })
    expect(markers.map((marker) => marker.milestones)).toEqual([
      [],
      [],
      [{ milestone: 13, payout: 85 }],
      [],
      [],
      [],
    ])
  })

  it("adds the payout bonus from the synced premium track", () => {
    const run2 = forecastRuns(
      worked({
        progress: { ...worked().progress!, extraCurrencyPerPayout: 15 },
      })
    ).runs[1]

    expect(run2?.currencyEarned).toBe(100)
  })

  it("carries the plan into the next run when it is longer than the run", () => {
    const tokens = Array.from({ length: 40 }, () => ({ points: 10 }))
    const [, run2, run3] = forecastRuns(worked({ tokens })).runs

    expect(run2).toMatchObject({
      tokensUsed: 32,
      tokensLeftOver: 0,
      pointsEarned: 320,
    })
    expect(run3).toMatchObject({
      tokensUsed: 8,
      tokensLeftOver: 60,
      pointsEarned: 80,
    })
  })

  it("opens the chests synced currency already covers in the current run", () => {
    const run2 = forecastRuns(
      worked({
        progress: { ...worked().progress!, currentCurrency: 300 },
        tokens: [],
      })
    ).runs[1]

    // Chest 11 costs 260: the synced 300 opens it before any token is played.
    expect(run2).toMatchObject({
      chestsOpened: 1,
      endingCurrency: 40,
      endingShards: 275,
    })
  })

  it("ignores paid inputs with paid options off", () => {
    const run3 = forecastRuns(
      worked({
        runs: [runInputs(3, 10, 10, true, 50)],
        showPaidOptions: false,
      })
    ).runs[2]

    // 205 + 250 opens chest 11 (25 shards); the 50 Oh So Close shards are not added.
    expect(run3).toMatchObject({ missionCurrency: 250, bundleCurrency: 0 })
    expect(run3?.endingShards).toBe(275)
  })

  it("adds a planned run's Oh So Close shards", () => {
    const run3 = forecastRuns(worked({ runs: [runInputs(3, 0, 0, false, 75)] }))
      .runs[2]

    expect(run3?.endingShards).toBe(325)
  })

  it("starts from zero without a synced entry", () => {
    const { runs } = forecastRuns(
      worked({
        progress: undefined,
        supply: [
          supply(1, "next", 68),
          supply(2, "planned", 68),
          supply(3, "planned", 68),
        ],
        tokens: [{ points: 100 }],
        runs: [],
      })
    )

    // Milestone 1 at 100 points pays 25: not enough for chest 1 (60).
    expect(runs[0]).toMatchObject({
      endingPoints: 100,
      endingCurrency: 25,
      chestsClaimed: 0,
    })
  })

  it("marks an ascension step on the token that reaches it", () => {
    // 395 shards: the first chest opened completes Unlock.
    const { runs, markers } = forecastRuns(
      worked({
        progress: {
          ...worked().progress!,
          currentShards: 395,
          currentCurrency: 200,
        },
        tokens: [{ points: 600 }],
      })
    )

    expect(markers[0]?.steps).toEqual(["unlock"])
    expect(runs[1]?.stepsReached).toEqual(["unlock"])
  })

  it("reports every step reached", () => {
    const run2 = forecastRuns(
      worked({ progress: { ...worked().progress!, currentShards: 1300 } })
    ).runs[1]

    expect(run2).toMatchObject({
      next: { step: "fullyAscended" },
      shardsMissing: 0,
    })
  })

  // V1 `le-round-outcome-forecast.service.spec.ts`, translated: Dante's first two milestones and
  // chests, 330 shards held, rounds 1 and 2 finished, round 3 upcoming.
  describe("V1 parity", () => {
    const dante = {
      ...utharEvent.rewards,
      shardsPerChest: 25,
      pointsMilestones: [
        { milestone: 1, cumulativePoints: 100, engramPayout: 25 },
        { milestone: 2, cumulativePoints: 250, engramPayout: 30 },
      ],
      chestsMilestones: [
        { chestLevel: 1, engramCost: 60 },
        { chestLevel: 2, engramCost: 80 },
        { chestLevel: 3, engramCost: 100 },
      ],
    } as LegendaryEventRewards
    const v1 = (overrides: Partial<ForecastInput> = {}) =>
      forecastRuns({
        rewards: dante,
        progress: {
          currentPoints: 0,
          currentCurrency: 0,
          currentClaimedChestIndex: -1,
          currentShards: 330,
          extraCurrencyPerPayout: null,
        },
        supply: [
          supply(1, "done", 0),
          supply(2, "done", 0),
          supply(3, "next", 68),
        ],
        tokens: [],
        runs: [],
        showPaidOptions: true,
        ...overrides,
      }).runs[2]

    it("applies point milestones, missions and chests to an upcoming run", () => {
      const round3 = v1({ tokens: [{ points: 250 }], runs: [runInputs(3, 10)] })

      expect(round3).toMatchObject({
        tokensUsed: 1,
        pointsEarned: 250,
        currencyEarned: 305,
        chestsOpened: 3,
        // V1 reports 5 shards past Unlock; V2 keeps the cumulative count.
        endingShards: 405,
        stepsReached: ["unlock"],
        next: { step: "fourStars" },
        shardsMissing: 115,
      })
    })

    it("offers Oh So Close for an Unlock gap of 70 at 500 + 100 per shard", () => {
      expect(v1()?.ohSoClose).toEqual({ shards: 70, blackstone: 7500 })
    })

    it("prices a promotion gap at 500 + 50 per shard", () => {
      // V1's Red 3★ with 50 shards toward four stars is 450 cumulative shards.
      const round3 = v1({
        progress: {
          currentPoints: 0,
          currentCurrency: 0,
          currentClaimedChestIndex: -1,
          currentShards: 450,
          extraCurrencyPerPayout: null,
        },
      })

      expect(round3?.ohSoClose).toEqual({ shards: 70, blackstone: 4000 })
    })
  })
})

describe("ohSoCloseHint", () => {
  it("is offered only within 75 shards", () => {
    expect(
      ohSoCloseHint(
        {
          step: "unlock",
          threshold: 400,
          shardsTowardStep: 340,
          stepSize: 400,
        },
        340
      )
    ).toEqual({ shards: 60, blackstone: 6500 })
    expect(
      ohSoCloseHint(
        {
          step: "unlock",
          threshold: 400,
          shardsTowardStep: 300,
          stepSize: 400,
        },
        300
      )
    ).toBeNull()
    expect(ohSoCloseHint({ step: "fullyAscended" }, 1300)).toBeNull()
  })
})
