import type { i18n as I18n } from "i18next"
import { beforeAll, describe, expect, it } from "vitest"

import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { render, screen } from "@/test/render"

import {
  buildRunStatusView,
  type RunStatusView,
} from "./legendary-event-page.view-model"
import { RunStatusCard } from "./run-status-card"

const NOW = Date.parse("2026-09-02T12:00:00Z")
const lifecycle = {
  state: "active" as const,
  runStartMs: Date.parse("2026-08-30T00:00:00Z"),
  runEndMs: Date.parse("2026-09-06T00:00:00Z"),
}
const retry = () => {}

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

function renderCard(runStatus: RunStatusView, syncedAtMs: number | null = NOW) {
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

  it("renders the populated example", () => {
    const view = buildRunStatusView(
      { status: "ready", data: lysanderProgress as never, retry },
      { status: "ready", data: ladder as never, retry }
    )
    renderCard(view)

    expect(screen.getByTestId("run-status-run")).toHaveTextContent("Run 1 of 3")
    expect(screen.getByTestId("run-status-tokens")).toHaveTextContent(
      "3/12 tokens, next in 1 hr 30 min"
    )
    expect(screen.getByTestId("run-status-points")).toHaveTextContent(
      "3,410 points"
    )
    expect(screen.getByTestId("run-status-currency")).toHaveTextContent(
      "120 currency"
    )
    // currentClaimedChestIndex 4 is zero-based: five chests claimed.
    expect(screen.getByTestId("run-status-chests")).toHaveTextContent(
      "5 chests claimed"
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

  it("shows a dash for the milestone without the reward ladder", () => {
    const view = buildRunStatusView(
      { status: "ready", data: lysanderProgress as never, retry },
      { status: "error", retry }
    )
    renderCard(view)

    expect(screen.getByTestId("run-status-milestone")).toHaveTextContent(
      "Next milestone: —"
    )
  })

  it("omits the run when the sync has none and the regen line when tokens are full", () => {
    const view = buildRunStatusView(
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
    const view = buildRunStatusView(
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
      buildRunStatusView(
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
      "Synced 25 min ago"
    )
    expect(
      screen.getByTestId("legendary-event-run-status").querySelector("button")
    ).toBeNull()
  })
})
