import type { i18n as I18n } from "i18next"
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { render, screen } from "@/test/render"

import {
  buildRunStatusViewModel,
  type RunStatusViewModel,
} from "./legendary-event-page.view-model"
import { RunStatusCard } from "./run-status-card"

const NOW = Date.parse("2026-09-02T12:00:00Z")
const lifecycle = {
  state: "active" as const,
  runStartMs: Date.parse("2026-08-30T00:00:00Z"),
  runEndMs: Date.parse("2026-09-06T00:00:00Z"),
}
const retry = () => {}
// The lre-progress chunk was observed at sync time, 10 minutes before NOW.
const OBSERVED = NOW - 10 * 60_000

type BuildInput = Parameters<typeof buildRunStatusViewModel>[0]
const build = (
  progress: BuildInput["progress"],
  common: BuildInput["common"],
  progressObservedAtMs: number | null = OBSERVED
) =>
  buildRunStatusViewModel({
    progress,
    common,
    progressObservedAtMs,
    nowMs: NOW,
  })

// The spec's populated example: Lysander, run 1, 3 of 12 tokens with the next in 5,400 s.
const lysanderProgress = {
  id: "astarLysander",
  alpha: null,
  beta: null,
  gamma: null,
  currentPoints: 3410,
  currentCurrency: 120,
  currentShards: 125,
  currentClaimedChestIndex: 4,
  currentEventRun: 1,
  currentEventTokens: {
    current: 3,
    max: 12,
    nextTokenInSeconds: 5400,
    regenDelayInSeconds: 7200,
  },
  hasUsedAdForExtraTokenToday: false,
  extraCurrencyPerPayout: null,
}
const ladder = {
  id: "lre-common",
  pointsMilestones: [
    { milestone: 13, cumulativePoints: 3000, engramPayout: 55 },
    { milestone: 14, cumulativePoints: 3500, engramPayout: 60 },
  ],
  chestsMilestones: [],
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

let i18n: I18n

function renderCard(
  runStatus: RunStatusViewModel,
  syncedAtMs: number | null | undefined = OBSERVED
) {
  return render(
    <RunStatusCard
      lifecycle={lifecycle}
      nowMs={NOW}
      runStatus={runStatus}
      syncedAtMs={syncedAtMs}
    />,
    { wrapper: i18nWrapper(i18n) }
  )
}

describe("RunStatusCard", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(NOW)
  })
  afterEach(() => vi.useRealTimers())

  it("renders the populated example", () => {
    const view = build(
      { status: "ready", data: lysanderProgress as never, retry },
      { status: "ready", data: ladder as never, retry },
      NOW
    )
    renderCard(view)

    expect(screen.getByTestId("run-status-run")).toHaveTextContent(
      "Event 1 of 3"
    )
    // Observed now, so the full 5,400 s remain.
    expect(screen.getByTestId("run-status-tokens")).toHaveTextContent(
      "3/12 tokens, next in 1 hr 30 min"
    )
    expect(screen.getByTestId("run-status-points")).toHaveTextContent(
      "3,410 points"
    )
    expect(screen.getByTestId("run-status-currency")).toHaveTextContent(
      "120 currency"
    )
    // currentClaimedChestIndex is the API's 1-based count of chests opened.
    expect(screen.getByTestId("run-status-chests")).toHaveTextContent(
      "4 chests claimed"
    )
    expect(screen.getByTestId("run-status-shards")).toHaveTextContent(
      "125 shards"
    )
    // 3,500 - 3,410 = 90 points to milestone 14, which pays 60 currency.
    expect(screen.getByTestId("run-status-milestone")).toHaveTextContent(
      "90 points to milestone 14 (+60 currency)"
    )
    expect(screen.getByTestId("event-timing-countdown")).toHaveTextContent(
      "Ends in 4 days"
    )
  })

  it("counts the next token down from the sync, and reads it as ready once due", () => {
    const progress = {
      status: "ready" as const,
      data: lysanderProgress as never,
      retry,
    }
    const common = { status: "ready" as const, data: ladder as never, retry }

    // Observed exactly at sync time: the full 1 hr 30 min remain.
    const fresh = render(
      <RunStatusCard
        lifecycle={lifecycle}
        nowMs={NOW}
        runStatus={build(progress, common, NOW)}
        syncedAtMs={NOW}
      />,
      { wrapper: i18nWrapper(i18n) }
    )
    expect(screen.getByTestId("run-status-tokens")).toHaveTextContent(
      "3/12 tokens, next in 1 hr 30 min"
    )
    fresh.unmount()

    // Observed two hours ago: the 1 hr 30 min timer has run out.
    renderCard(build(progress, common, NOW - 2 * 3_600_000))
    expect(screen.getByTestId("run-status-tokens")).toHaveTextContent(
      "3/12 tokens, next token ready"
    )
  })

  it("never shows a negative chest count for the API's 'omitted' sentinel", () => {
    renderCard(
      build(
        {
          status: "ready",
          data: { ...lysanderProgress, currentClaimedChestIndex: -1 } as never,
          retry,
        },
        { status: "ready", data: ladder as never, retry }
      )
    )
    expect(screen.getByTestId("run-status-chests")).toHaveTextContent(
      "0 chests claimed"
    )
  })

  it("shows a dash for the milestone without the reward ladder", () => {
    const view = build(
      { status: "ready", data: lysanderProgress as never, retry },
      { status: "error", retry }
    )
    renderCard(view)

    expect(screen.getByTestId("run-status-milestone")).toHaveTextContent(
      "Next milestone: —"
    )
  })

  it("omits the run when the sync has none and the regen line when tokens are full", () => {
    const view = build(
      {
        status: "ready",
        data: {
          ...lysanderProgress,
          currentEventRun: null,
          currentEventTokens: {
            ...lysanderProgress.currentEventTokens,
            current: 12,
          },
        } as never,
        retry,
      },
      { status: "ready", data: ladder as never, retry }
    )
    renderCard(view)

    expect(screen.queryByTestId("run-status-run")).toBeNull()
    expect(screen.getByTestId("run-status-tokens")).toHaveTextContent(
      /^12\/12 tokens$/
    )
  })

  it("shows the run timing and the no-entry body for an event not in the chunk", () => {
    const view = build(
      { status: "ready", data: undefined, retry },
      { status: "ready", data: ladder as never, retry }
    )
    renderCard(view)

    expect(screen.getByTestId("run-status-no-entry")).toHaveTextContent(
      "No synced progress for this event yet."
    )
    expect(screen.getByTestId("event-timing")).toBeInTheDocument()
    expect(screen.queryByTestId("run-status-values")).toBeNull()
  })

  it("shows synced data unavailable in place of the values when player data fails", () => {
    renderCard(
      build(
        { status: "error", retry },
        { status: "ready", data: ladder as never, retry }
      )
    )

    expect(screen.getByTestId("run-status-unavailable")).toHaveTextContent(
      "Synced data unavailable"
    )
    expect(screen.getByTestId("event-timing")).toBeInTheDocument()
    expect(screen.queryByTestId("run-status-values")).toBeNull()
  })

  it("shows the last-synced age and no sync button", () => {
    renderCard({ kind: "noEntry" }, NOW - 25 * 60_000)

    expect(screen.getByTestId("run-status-synced-at")).toHaveTextContent(
      "Synced 25 minutes ago"
    )
    expect(
      screen.getByTestId("legendary-event-run-status").querySelector("button")
    ).toBeNull()
  })

  it("says not synced yet before the first sync, and hides the line while unknown", () => {
    const { unmount } = renderCard({ kind: "noEntry" }, null)
    expect(screen.getByTestId("run-status-synced-at")).toHaveTextContent(
      "Not synced yet"
    )
    unmount()

    render(
      <RunStatusCard
        lifecycle={lifecycle}
        nowMs={NOW}
        runStatus={{ kind: "noEntry" }}
        syncedAtMs={undefined}
      />,
      { wrapper: i18nWrapper(i18n) }
    )
    expect(screen.queryByTestId("run-status-synced-at")).toBeNull()
  })
})
