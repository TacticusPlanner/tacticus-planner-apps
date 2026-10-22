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

import type {
  LegendaryEventPlan,
  LegendaryEventRosterUnit,
  LegendaryEventRunInputs,
  LegendaryEventRunResolution,
} from "@/entities/legendary-event"
import { lysanderEvent, utharEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { fireEvent, render, screen, within } from "@/test/render"

import {
  buildRewardOutlookViewModel,
  buildRunStatusViewModel,
  type RewardOutlookViewModel,
  type RunInputsViewModel,
  type RunStatusViewModel,
} from "./legendary-event-page.view-model"
import { RunStatusCard } from "./run-status-card"

vi.mock("@azure/msal-react", () => ({ useIsAuthenticated: () => true }))
vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  apiClient: (await import("@/test/fake-api-client")).fakeApiClient(() => ({
    eventId: "votanUthar",
    revision: 1,
    catalogVersion: "1",
    notes: null,
    showPaidOptions: false,
    teams: [],
    runs: [],
    annotations: [],
  })),
}))

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
  rewards: BuildInput["rewards"],
  progressObservedAtMs: number | null = OBSERVED
) =>
  buildRunStatusViewModel({
    progress,
    rewards,
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

// The spec's worked example: Uthar in run 2 with 5,000 points, 120 currency, 10 chests and 250
// shards; run 3 plans 10 missions and the bundle.
const utharProgress = {
  ...lysanderProgress,
  id: "votanUthar",
  currentPoints: 5000,
  currentCurrency: 120,
  currentClaimedChestIndex: 10,
  currentShards: 250,
  currentEventRun: 2,
}
/** Uthar active in run 2 (the worked example), and between runs on 2026-10-16 (runs 1 and 2 over). */
const UTHAR_RUN_2: LegendaryEventRunResolution = {
  kind: "known",
  endedRuns: 1,
  currentRun: 2,
  nextRun: 3,
  nextStartMs: null,
}
const UTHAR_BETWEEN_RUNS: LegendaryEventRunResolution = {
  kind: "known",
  endedRuns: 2,
  currentRun: null,
  nextRun: 3,
  nextStartMs: null,
}
/** The worked examples' event unit is not in the synced roster (the goal starts at Unlock). */
const OUTLOOK_DEFAULTS: {
  unit: LegendaryEventRosterUnit | undefined | "loading"
  resolution: LegendaryEventRunResolution
} = { unit: undefined, resolution: UTHAR_RUN_2 }
const runInputs = (
  run: 1 | 2 | 3,
  regularMissions: number,
  bundlePurchased = false
): LegendaryEventRunInputs => ({
  run,
  regularMissions,
  premiumMissions: 0,
  bundlePurchased,
  closeShards: 0,
  completedRegularMissions: [],
  completedPremiumMissions: [],
  updatedAt: "2026-10-10T00:00:00Z",
})
const utharPlan: LegendaryEventPlan = {
  eventId: "votanUthar",
  revision: 3,
  catalogVersion: "1",
  notes: null,
  showPaidOptions: true,
  teams: [],
  runs: [runInputs(1, 10), runInputs(2, 6), runInputs(3, 10, true)],
  annotations: [],
}
const outlookFor = (
  progress: unknown,
  plan: LegendaryEventPlan | undefined = utharPlan,
  overrides: Partial<typeof OUTLOOK_DEFAULTS> = {}
) =>
  buildRewardOutlookViewModel({
    ...OUTLOOK_DEFAULTS,
    ...overrides,
    rewards: utharEvent.rewards,
    progress: progress as never,
    plan: { isPending: false, data: plan },
    planEnabled: true,
  })
const signedOut: RunInputsViewModel = {
  enabled: false,
  runs: {
    kind: "known",
    endedRuns: 0,
    currentRun: null,
    nextRun: 1,
    nextStartMs: null,
  },
}

let i18n: I18n

function renderCard(
  runStatus: RunStatusViewModel,
  syncedAtMs: number | null | undefined = OBSERVED,
  outlook: RewardOutlookViewModel = { kind: "unavailable" },
  runInputsView: RunInputsViewModel = signedOut
) {
  return render(
    <RunStatusCard
      event={utharEvent}
      isMobile={false}
      lifecycle={lifecycle}
      nowMs={NOW}
      outlook={outlook}
      runInputs={runInputsView}
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
      ladder as never,
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
      "120 currency in hand"
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
    const rewards = ladder as never

    // Observed exactly at sync time: the full 1 hr 30 min remain.
    const fresh = render(
      <RunStatusCard
        event={utharEvent}
        isMobile={false}
        lifecycle={lifecycle}
        nowMs={NOW}
        outlook={{ kind: "unavailable" }}
        runInputs={signedOut}
        runStatus={build(progress, rewards, NOW)}
        syncedAtMs={NOW}
      />,
      { wrapper: i18nWrapper(i18n) }
    )
    expect(screen.getByTestId("run-status-tokens")).toHaveTextContent(
      "3/12 tokens, next in 1 hr 30 min"
    )
    fresh.unmount()

    // Observed two hours ago: the 1 hr 30 min timer has run out.
    renderCard(build(progress, rewards, NOW - 2 * 3_600_000))
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
        ladder as never
      )
    )
    expect(screen.getByTestId("run-status-chests")).toHaveTextContent(
      "0 chests claimed"
    )
  })

  it("shows a dash for the milestone without the reward ladder", () => {
    const view = build(
      { status: "ready", data: lysanderProgress as never, retry },
      undefined
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
      ladder as never
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
      ladder as never
    )
    renderCard(view)

    expect(screen.getByTestId("run-status-no-entry")).toHaveTextContent(
      "No synced progress for this event yet."
    )
    expect(screen.getByTestId("event-timing")).toBeInTheDocument()
    expect(screen.queryByTestId("run-status-values")).toBeNull()
  })

  it("shows synced data unavailable in place of the values when player data fails", () => {
    renderCard(build({ status: "error", retry }, ladder as never))

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
        event={utharEvent}
        isMobile={false}
        lifecycle={lifecycle}
        nowMs={NOW}
        outlook={{ kind: "unavailable" }}
        runInputs={signedOut}
        runStatus={{ kind: "noEntry" }}
        syncedAtMs={undefined}
      />,
      { wrapper: i18nWrapper(i18n) }
    )
    expect(screen.queryByTestId("run-status-synced-at")).toBeNull()
  })

  it("reads each event's own points ladder for the milestone line", () => {
    // Uthar's ladder here pays its next milestone at 3,600 instead of Lysander's 3,500.
    const utharRewards = {
      ...utharEvent.rewards,
      pointsMilestones: utharEvent.rewards.pointsMilestones.map((milestone) =>
        milestone.cumulativePoints === 3500
          ? { ...milestone, cumulativePoints: 3600, engramPayout: 70 }
          : milestone
      ),
    }
    const progress = {
      status: "ready" as const,
      data: lysanderProgress as never,
      retry,
    }

    const lysander = renderCard(build(progress, lysanderEvent.rewards))
    expect(screen.getByTestId("run-status-milestone")).toHaveTextContent(
      "90 points to milestone 9 (+65 currency)"
    )
    lysander.unmount()

    renderCard(build(progress, utharRewards))
    expect(screen.getByTestId("run-status-milestone")).toHaveTextContent(
      "190 points to milestone 9 (+70 currency)"
    )
  })

  describe("Reward outlook", () => {
    const synced = (fields: Record<string, unknown> = {}) => ({
      ...utharProgress,
      ...fields,
    })
    const renderOutlook = (outlook: RewardOutlookViewModel) =>
      renderCard({ kind: "noEntry" }, OBSERVED, outlook)

    it("shows the Uthar worked example in one line per figure", () => {
      renderOutlook(outlookFor(synced()))

      expect(screen.getByTestId("reward-outlook-next")).toHaveTextContent(
        "Next: Unlock · 250 / 400 shards"
      )
      expect(screen.getByTestId("reward-outlook-chests")).toHaveTextContent(
        "6 more chests (3,350 currency in total)"
      )
      expect(screen.getByTestId("reward-outlook-points")).toHaveTextContent(
        "5,000 points to reach 10,000 · about 6.7 battles per lane"
      )
      expect(screen.queryByTestId("reward-outlook-no-entry")).toBeNull()
    })

    it("aims an owned Uthar at its next step between runs (4 stars at 120)", () => {
      renderOutlook(
        outlookFor(
          synced({
            currentPoints: 13_139,
            currentCurrency: 60,
            currentClaimedChestIndex: 17,
            currentShards: 25,
            currentEventRun: null,
          }),
          { ...utharPlan, runs: [] },
          {
            unit: {
              unitId: "votanUthar",
              rank: "Diamond3",
              progressionIndex: "Legendary:RedThreeStars",
            } as LegendaryEventRosterUnit,
            resolution: UTHAR_BETWEEN_RUNS,
          }
        )
      )

      expect(screen.getByTestId("reward-outlook-next")).toHaveTextContent(
        "Next: 4 stars · 25 / 120 shards"
      )
      expect(screen.getByTestId("reward-outlook-chests")).toHaveTextContent(
        "4 more chests (5,250 currency in total)"
      )
      expect(screen.getByTestId("reward-outlook-points")).toHaveTextContent(
        "1,611 points to reach 14,750 · about 9.8 battles per lane"
      )
    })

    it("keeps an unowned Fabius Bile before run 1 at Unlock", () => {
      // Fabius Bile (lres-lostabile.json) shares Uthar's points milestones, progression and chests
      // 1–16; no synced entry, run 1 next, no inputs.
      renderOutlook(
        outlookFor(
          undefined,
          { ...utharPlan, eventId: "lostaBile", runs: [] },
          {
            resolution: {
              kind: "known",
              endedRuns: 0,
              currentRun: null,
              nextRun: 1,
              nextStartMs: Date.parse("2026-11-08T00:00:00Z"),
            },
          }
        )
      )

      expect(screen.getByTestId("reward-outlook-next")).toHaveTextContent(
        "Next: Unlock · 0 / 400 shards"
      )
      expect(screen.getByTestId("reward-outlook-chests")).toHaveTextContent(
        "16 more chests (3,350 currency in total)"
      )
      expect(screen.getByTestId("reward-outlook-points")).toHaveTextContent(
        "13,000 points to reach 13,000"
      )
    })

    it("waits for the roster before projecting the goal", () => {
      expect(outlookFor(synced(), utharPlan, { unit: "loading" })).toEqual({
        kind: "loading",
      })
    })

    it("explains the base, the future run currency, the bonus and started runs", () => {
      renderOutlook(outlookFor(synced()))
      const explain = screen.getByTestId("reward-outlook-explain")
      fireEvent.click(within(explain).getByText("How this is worked out"))

      const lines = within(explain)
        .getAllByRole("listitem")
        .map((line) => line.textContent)
      expect(lines).toEqual([
        "From your last sync: 120 currency in hand, 10 chests claimed, 250 shards, 5,000 points",
        "250 currency from run 3 missions",
        "300 currency from the run 3 bundle",
        "No payout bonus on points milestones",
        expect.stringMatching(/runs already started are not added again/),
      ])
    })

    it("says every step is reached", () => {
      renderOutlook(outlookFor(synced({ currentShards: 1300 })))
      expect(screen.getByTestId("reward-outlook-complete")).toHaveTextContent(
        "Every reward step reached"
      )
      expect(screen.queryByTestId("reward-outlook-chests")).toBeNull()
      expect(screen.queryByTestId("reward-outlook-points")).toBeNull()
    })

    it("says a goal beyond the chest ladder is not reachable", () => {
      renderOutlook(
        outlookFor(
          synced({ currentClaimedChestIndex: 41, currentShards: 50 }),
          undefined
        )
      )
      expect(
        screen.getByTestId("reward-outlook-beyond-chests")
      ).toHaveTextContent(
        "Not reachable this event (needs 55 chests, the event has 54)"
      )
      expect(screen.queryByTestId("reward-outlook-points")).toBeNull()
    })

    it("says when the currency already covers the chests", () => {
      renderOutlook(outlookFor(synced({ currentCurrency: 2000 })))
      expect(screen.getByTestId("reward-outlook-affordable")).toHaveTextContent(
        "Enough currency for the chests now"
      )
    })

    it("says when points alone cannot cover the chests", () => {
      renderOutlook(
        outlookFor(synced({ currentPoints: 26_900, currentCurrency: 0 }), {
          ...utharPlan,
          runs: [],
        })
      )
      expect(
        screen.getByTestId("reward-outlook-beyond-points")
      ).toHaveTextContent("Points alone can't cover it: 1,135 currency short")
    })

    it("computes from zero with a note without a synced entry", () => {
      renderCard(
        { kind: "noEntry" },
        OBSERVED,
        outlookFor(undefined, { ...utharPlan, runs: [runInputs(1, 10)] })
      )
      expect(screen.getByTestId("run-status-no-entry")).toBeInTheDocument()
      expect(screen.getByTestId("reward-outlook-no-entry")).toHaveTextContent(
        "No synced progress yet"
      )
      expect(screen.getByTestId("reward-outlook-next")).toHaveTextContent(
        "Next: Unlock · 0 / 400 shards"
      )
      expect(screen.getByTestId("reward-outlook-chests")).toHaveTextContent(
        "16 more chests (3,350 currency in total)"
      )
    })

    it("shows a skeleton while the synced entry or the plan loads", () => {
      expect(
        buildRewardOutlookViewModel({
          ...OUTLOOK_DEFAULTS,
          rewards: utharEvent.rewards,
          progress: synced() as never,
          plan: { isPending: true, data: undefined },
          planEnabled: true,
        })
      ).toEqual({ kind: "loading" })
      renderOutlook(
        buildRewardOutlookViewModel({
          ...OUTLOOK_DEFAULTS,
          rewards: utharEvent.rewards,
          progress: "loading",
          plan: { isPending: false, data: utharPlan },
          planEnabled: true,
        })
      )
      expect(screen.getByTestId("reward-outlook-loading")).toBeInTheDocument()
    })

    it("runs without inputs when signed out", () => {
      const outlook = buildRewardOutlookViewModel({
        ...OUTLOOK_DEFAULTS,
        rewards: utharEvent.rewards,
        progress: synced() as never,
        plan: { isPending: true, data: undefined },
        planEnabled: false,
      })
      expect(outlook).toMatchObject({
        kind: "ready",
        projection: { futureRuns: [{ run: 3, missionCurrency: 0 }] },
      })
    })

    it("hides the outlook when the catalog ladder or the synced data is unavailable", () => {
      expect(
        buildRewardOutlookViewModel({
          ...OUTLOOK_DEFAULTS,
          rewards: undefined,
          progress: synced() as never,
          plan: { isPending: false, data: utharPlan },
          planEnabled: true,
        })
      ).toEqual({ kind: "unavailable" })
      renderCard(
        build({ status: "error", retry }, utharEvent.rewards),
        OBSERVED,
        outlookFor("error")
      )
      expect(screen.getByTestId("run-status-unavailable")).toBeInTheDocument()
      expect(screen.queryByTestId("reward-outlook")).toBeNull()
    })
  })

  it("carries the Inputs button for signed-in users only", () => {
    const { unmount } = renderCard({ kind: "noEntry" })
    expect(screen.queryByTestId("legendary-event-run-inputs")).toBeNull()
    unmount()

    renderCard(
      { kind: "noEntry" },
      OBSERVED,
      { kind: "unavailable" },
      {
        enabled: true,
        runs: {
          kind: "known",
          endedRuns: 1,
          currentRun: 2,
          nextRun: 3,
          nextStartMs: null,
        },
      }
    )
    expect(screen.getByTestId("legendary-event-run-inputs")).toHaveTextContent(
      "Inputs"
    )
  })
})
