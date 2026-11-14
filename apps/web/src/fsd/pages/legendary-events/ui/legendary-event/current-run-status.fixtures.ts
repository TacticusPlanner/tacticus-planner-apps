import type { TokenPlanView } from "@/features/legendary-event-tokens"

import type { RunStatusViewModel } from "./legendary-event-page.view-model"

/** The reported Fabius Bile account: one token left this run, 87 points to milestone 27. */
export const syncedRunStatus: Extract<RunStatusViewModel, { kind: "synced" }> =
  {
    kind: "synced",
    run: 1,
    tokens: { current: 0, max: 12, next: { kind: "due" } },
    points: 12_413,
    currency: 160,
    chestsClaimed: 15,
    shards: 375,
    milestone: {
      milestone: 27,
      cumulativePoints: 12_500,
      pointsToGo: 87,
      engramPayout: 300,
    },
  }

const runForecast = (overrides: Record<string, unknown> = {}) => ({
  run: 1,
  state: "now",
  supply: {
    run: 1,
    state: "now",
    unknownRun: false,
    free: 1,
    ad: 0,
    adTodayPending: false,
    bonusDelivery: 0,
    total: 1,
  },
  tokensUsed: 1,
  tokensLeftOver: 0,
  pointsEarned: 95,
  endingPoints: 12_508,
  currencyEarned: 300,
  missionCurrency: 0,
  bundleCurrency: 0,
  endingCurrency: 110,
  chestsOpened: 1,
  chestsClaimed: 16,
  endingShards: 400,
  stepsReached: ["unlock"],
  next: { step: "fourStars", threshold: 520 },
  shardsMissing: 120,
  ohSoClose: null,
  ...overrides,
})

/** A ready plan whose first token reaches Unlock in run 1 (or `stepAt`), with `run` overrides. */
export function currentRunView({
  run = {},
  stepAt = 0,
  stepRun = 1,
}: {
  run?: Record<string, unknown>
  stepAt?: number | null
  stepRun?: number
} = {}): TokenPlanView {
  const markers = Array.from({ length: 6 }, (_, index) => ({
    milestones: [],
    steps: index === stepAt ? ["unlock"] : [],
  }))
  return {
    kind: "ready",
    forecast: { runs: [runForecast(run)], markers },
    byRun: {
      sections: [
        { run: 1, start: 0, count: stepRun === 1 ? 6 : 1 },
        ...(stepRun === 1 ? [] : [{ run: stepRun, start: 1, count: 5 }]),
      ],
      overflow: null,
    },
    milestoneGap: null,
  } as unknown as TokenPlanView
}
