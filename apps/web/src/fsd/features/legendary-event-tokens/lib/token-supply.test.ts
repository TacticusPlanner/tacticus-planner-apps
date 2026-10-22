import { describe, expect, it } from "vitest"

import {
  deriveLegendaryEventLifecycle,
  resolveLegendaryEventRunsAt,
  type LegendaryEventRunInputs,
  type LegendaryEventRunResolution,
} from "@/entities/legendary-event"

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
  completedRegularMissions: [],
  completedPremiumMissions: [],
  updatedAt: "2026-10-15T00:00:00Z",
})

const inRun = (run: 1 | 2 | 3): LegendaryEventRunResolution => ({
  kind: "known",
  endedRuns: (run - 1) as 0 | 1 | 2,
  currentRun: run,
  nextRun: run < 3 ? ((run + 1) as 2 | 3) : null,
  nextStartMs: null,
})

/** An upcoming event's lifecycle and resolved runs from its schedule on 2026-10-16. */
const between = (
  eventStageStartDatesUtc: string[],
  points: number
): Pick<TokenSupplyInput, "lifecycle" | "resolution" | "nowMs"> => {
  const nowMs = Date.parse("2026-10-16T00:00:00Z")
  const schedule = { eventStageStartDatesUtc }
  const lifecycle = deriveLegendaryEventLifecycle(schedule, nowMs)
  return {
    lifecycle,
    nowMs,
    resolution: resolveLegendaryEventRunsAt(
      schedule,
      {
        currentEventRun: null,
        currentPoints: points,
        alpha: null,
        beta: null,
        gamma: null,
      },
      nowMs,
      lifecycle
    ),
  }
}

const states = (supply: ReturnType<typeof runTokenSupply>) =>
  supply?.map((run) => [run.run, run.state, run.total])

/** The worked supply: Uthar active in run 2 with 76 hours left, observed now. */
const worked = (
  overrides: Partial<TokenSupplyInput> = {}
): TokenSupplyInput => ({
  lifecycle: {
    state: "active",
    runStartMs: NOW + 76 * HOUR - 7 * DAY,
    runEndMs: NOW + 76 * HOUR,
  },
  resolution: inRun(2),
  progress: {
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
      {
        run: 1,
        state: "done",
        unknownRun: false,
        free: 0,
        ad: 0,
        bonusDelivery: 0,
        total: 0,
      },
      // 3 + 1 + ⌊(76 h − 1.5 h) ÷ 3 h⌋ = 28 free; ⌊(76 h − 1 ms) ÷ 24 h⌋ + 1 = 4 ad.
      {
        run: 2,
        state: "now",
        unknownRun: false,
        free: 28,
        ad: 4,
        bonusDelivery: 0,
        total: 32,
      },
      {
        run: 3,
        state: "planned",
        unknownRun: false,
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

  it("Uthar between runs: runs 1 and 2 Done, run 3 Next with 68", () => {
    const supply = runTokenSupply(
      worked(between(["2026-03-08T00:00:00Z", "2026-10-04T00:00:00Z"], 13_139))
    )

    expect(states(supply)).toEqual([
      [1, "done", 0],
      [2, "done", 0],
      [3, "next", 68],
    ])
  })

  it("Lysander after run 1: run 1 Done, run 2 Next", () => {
    const supply = runTokenSupply(
      worked(between(["2026-08-30T00:00:00Z"], 12_531))
    )

    expect(states(supply)).toEqual([
      [1, "done", 0],
      [2, "next", 68],
      [3, "planned", 68],
    ])
  })

  it("plans one conservative Next run of 68 when the run is unknown", () => {
    const supply = runTokenSupply(
      worked({ ...between([], 12_530), runs: [premiumRun(1, 10)] })
    )

    expect(supply).toEqual([
      {
        run: 1,
        state: "next",
        unknownRun: true,
        free: 61,
        ad: 7,
        bonusDelivery: 0,
        total: 68,
      },
    ])
  })

  it("has no supply once every run has ended", () => {
    expect(
      runTokenSupply(
        worked(
          between(
            [
              "2026-03-08T00:00:00Z",
              "2026-06-07T00:00:00Z",
              "2026-09-06T00:00:00Z",
            ],
            14_000
          )
        )
      )
    ).toBeNull()
  })

  it("plans all three runs without a synced entry", () => {
    const supply = runTokenSupply(
      worked({
        lifecycle: { state: "upcoming" },
        resolution: {
          kind: "known",
          endedRuns: 0,
          currentRun: null,
          nextRun: 1,
          nextStartMs: null,
        },
        progress: undefined,
      })
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
        resolution: inRun(1),
        progress: {
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
