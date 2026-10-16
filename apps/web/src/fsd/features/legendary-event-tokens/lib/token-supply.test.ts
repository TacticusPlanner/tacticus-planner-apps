import { describe, expect, it } from "vitest"

import type { LegendaryEventRunInputs } from "@/entities/legendary-event"

import { runTokenSupply, type TokenSupplyInput } from "./token-supply"

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const NOW = Date.parse("2026-10-15T12:00:00Z")

const premiumRun = (
  run: 1 | 2 | 3,
  premiumMissions: number
): LegendaryEventRunInputs => ({
  run,
  regularMissions: 0,
  premiumMissions,
  bundlePurchased: false,
  closeShards: 0,
  updatedAt: "2026-10-15T00:00:00Z",
})

/** The worked supply: Uthar active in run 2 with 76 hours left, observed now. */
const worked = (
  overrides: Partial<TokenSupplyInput> = {}
): TokenSupplyInput => ({
  lifecycle: {
    state: "active",
    runStartMs: NOW + 76 * HOUR - 7 * DAY,
    runEndMs: NOW + 76 * HOUR,
  },
  progress: {
    currentEventRun: 2,
    currentEventTokens: {
      current: 3,
      max: 12,
      nextTokenInSeconds: 5400,
      regenDelayInSeconds: 10_800,
    },
    hasUsedAdForExtraTokenToday: false,
    extraCurrencyPerPayout: null,
  },
  progressObservedAtMs: NOW,
  nowMs: NOW,
  runs: [],
  showPaidOptions: true,
  ...overrides,
})

describe("runTokenSupply", () => {
  it("works the Uthar run 2 supply", () => {
    expect(runTokenSupply(worked())).toEqual([
      { run: 1, state: "done", free: 0, ad: 0, bonusDelivery: 0, total: 0 },
      // 3 + 1 + ⌊(76 h − 1.5 h) ÷ 3 h⌋ = 28 free; ⌊(76 h − 1 ms) ÷ 24 h⌋ + 1 = 4 ad.
      { run: 2, state: "now", free: 28, ad: 4, bonusDelivery: 0, total: 32 },
      {
        run: 3,
        state: "planned",
        free: 61,
        ad: 7,
        bonusDelivery: 0,
        total: 68,
      },
    ])
  })

  it("adds bonus delivery when premium is planned for the current run", () => {
    const now = runTokenSupply(worked({ runs: [premiumRun(2, 10)] }))?.[1]

    expect(now).toMatchObject({ bonusDelivery: 6, total: 38 })
  })

  it("adds nothing when premium is already bought", () => {
    const base = worked()
    const now = runTokenSupply({
      ...base,
      runs: [premiumRun(2, 10)],
      progress: { ...base.progress!, extraCurrencyPerPayout: 15 },
    })?.[1]

    expect(now).toMatchObject({ bonusDelivery: 0, total: 32 })
  })

  it("adds bonus delivery to a planned run only with paid options on", () => {
    expect(
      runTokenSupply(worked({ runs: [premiumRun(3, 5)] }))?.[2]?.total
    ).toBe(74)
    expect(
      runTokenSupply(
        worked({ runs: [premiumRun(3, 5)], showPaidOptions: false })
      )?.[2]?.total
    ).toBe(68)
  })

  it("counts no ad token for today once it is used", () => {
    const base = worked()
    const now = runTokenSupply({
      ...base,
      progress: { ...base.progress!, hasUsedAdForExtraTokenToday: true },
    })?.[1]

    expect(now?.ad).toBe(3)
  })

  it("regenerates from now every 3 hours with a null bucket", () => {
    const base = worked()
    const now = runTokenSupply({
      ...base,
      progress: { ...base.progress!, currentEventTokens: null },
    })?.[1]

    expect(now?.free).toBe(Math.floor(76 / 3))
  })

  it("adds no forced token when the next token comes after the run ends", () => {
    const base = worked({
      lifecycle: {
        state: "active",
        runStartMs: NOW - 7 * DAY + HOUR,
        runEndMs: NOW + HOUR,
      },
    })
    const now = runTokenSupply(base)?.[1]

    // The next token is 1.5 h away, after the run's end in 1 h.
    expect(now?.free).toBe(3)
    expect(now?.ad).toBe(1)
  })

  it("plans full runs after the last run on an upcoming event", () => {
    const supply = runTokenSupply(
      worked({
        lifecycle: {
          state: "upcoming",
          runStartMs: NOW + DAY,
          runEndMs: NOW + 8 * DAY,
        },
        progress: { ...worked().progress!, currentEventRun: 1 },
      })
    )

    expect(supply?.map((run) => [run.state, run.total])).toEqual([
      ["done", 0],
      ["next", 68],
      ["planned", 68],
    ])
  })

  it("plans all three runs without a synced entry", () => {
    const supply = runTokenSupply(
      worked({ lifecycle: { state: "upcoming" }, progress: undefined })
    )

    expect(supply?.map((run) => run.state)).toEqual([
      "next",
      "planned",
      "planned",
    ])
  })

  it("has no supply on an archived event", () => {
    expect(
      runTokenSupply(worked({ lifecycle: { state: "archived" } }))
    ).toBeNull()
  })

  // V1 `le-token-service.spec.ts`, translated: a run that started one day ago with no tokens held.
  describe("V1 parity", () => {
    const started = (daysIn: number, adUsed: boolean) =>
      worked({
        lifecycle: {
          state: "active",
          runStartMs: NOW - daysIn * DAY,
          runEndMs: NOW - daysIn * DAY + 7 * DAY,
        },
        progress: {
          currentEventRun: 1,
          currentEventTokens: null,
          hasUsedAdForExtraTokenToday: adUsed,
          extraCurrencyPerPayout: null,
        },
      })

    it("regenerates 48 free tokens over the 6 days left", () => {
      expect(runTokenSupply(started(1, false))?.[0]?.free).toBe(48)
    })

    it("offers 4 ad tokens 2.5 days in after today's ad", () => {
      // V1: getAdTokensRemainingInIteration(event, true, 2.5 days in) === 4.
      expect(runTokenSupply(started(2.5, true))?.[0]?.ad).toBe(4)
    })

    it("plans 61 free and 7 ad tokens for each later run", () => {
      const supply = runTokenSupply(started(1, false))

      expect(supply?.slice(1).map((run) => [run.free, run.ad])).toEqual([
        [61, 7],
        [61, 7],
      ])
    })
  })
})
