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

import { CreateGoalLauncherContext } from "@/entities/goal"
import { setTestAuth } from "@/test/auth"
import { legendaryEventCharacters } from "@/test/fixtures/legendary-event-characters"
import { lysanderEvent } from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { act, render, waitFor } from "@/test/render"
import { seedGameCatalog, seedPlayerData } from "@/test/seed"

import type { LegendaryEventPageViewModel } from "./legendary-event-page.view-model"
import { LegendaryEventPage } from "./legendary-event-page"

// Captures the view model the page hands its view, render by render.
const views = vi.hoisted(() => [] as LegendaryEventPageViewModel[])
vi.mock("./legendary-event-page-view", () => ({
  LegendaryEventPageView: (props: LegendaryEventPageViewModel) => {
    views.push(props)
    return null
  },
}))
const captureEvent = vi.hoisted(() => vi.fn())
vi.mock("@/shared/analytics", () => ({
  useAnalyticsActions: () => ({ captureEvent }),
}))
vi.mock("@/shared/tour", () => ({ useTourPageSteps: () => {} }))

let i18n: I18n
const launchCreateGoal = vi.fn()
const last = () => views[views.length - 1]!

describe("LegendaryEventPage memo boundaries", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })
  beforeEach(async () => {
    views.length = 0
    setTestAuth({ authenticated: false })
    await seedGameCatalog({
      lres: [lysanderEvent],
      characters: legendaryEventCharacters,
    })
    await seedPlayerData({ "lre-progress": [] })
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date("2026-09-02T12:00:00Z"))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("keeps its memoised parts across an unrelated re-render and rebuilds the countdown parts on a tick", async () => {
    const ui = <LegendaryEventPage />
    const I18nWrapper = i18nWrapper(i18n)
    const { rerender, queryClient } = render(ui, {
      route: "/legendary-events/:eventId",
      initialEntries: ["/legendary-events/astarLysander"],
      wrapper: ({ children }) => (
        <CreateGoalLauncherContext.Provider value={launchCreateGoal}>
          <I18nWrapper>{children}</I18nWrapper>
        </CreateGoalLauncherContext.Provider>
      ),
    })
    await waitFor(() => expect(views.length).toBeGreaterThan(0))
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
    await waitFor(() => expect(last().runStatus.kind).toBe("noEntry"))
    const settled = last()
    const count = views.length

    rerender(<LegendaryEventPage />)
    expect(views.length).toBeGreaterThan(count)
    // The page's own memos hold; the whole view model still follows the plan and annotation
    // hooks, which return fresh objects per render.
    expect(last().runStatus).toBe(settled.runStatus)
    expect(last().leaderboard.goals.onPreviewChange).toBe(
      settled.leaderboard.goals.onPreviewChange
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000)
    })
    expect(last().nowMs).toBeGreaterThan(settled.nowMs)
    expect(last().runStatus).not.toBe(settled.runStatus)
  })
})
