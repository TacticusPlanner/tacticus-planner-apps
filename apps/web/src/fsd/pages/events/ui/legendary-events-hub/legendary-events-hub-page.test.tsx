import { useEffect, useState } from "react"
import { MemoryRouter, Route, Routes, useParams } from "react-router"
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

import {
  farsightEvent,
  lysanderEvent,
  utharEvent,
} from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { fireEvent, render, screen, waitFor, within } from "@/test/render"
import { setViewportWidth } from "@/test/viewport"

import { LegendaryEventsHubPage } from "./legendary-events-hub-page"

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: <T,>(querier: () => Promise<T>, deps: unknown[]) => {
    const [value, setValue] = useState<T>()
    useEffect(() => {
      void querier().then(setValue)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)
    return value
  },
}))

const data = vi.hoisted(() => ({
  events: [] as unknown[],
  eventsFail: false,
  eventsPending: false,
  eventsCalls: 0,
  progress: [] as unknown[] | undefined,
  progressFail: false,
}))
vi.mock("@workspace/game-catalog/queries", () => ({
  getLegendaryEvents: () => {
    data.eventsCalls += 1
    if (data.eventsPending) return new Promise(() => {})
    return data.eventsFail
      ? Promise.reject(new Error("catalog"))
      : Promise.resolve(data.events)
  },
  getCharactersMap: async () => new Map(),
  getMowsMap: async () => new Map(),
}))
vi.mock("@workspace/player-data/queries", () => ({
  getLegendaryEventsProgress: () =>
    data.progressFail
      ? Promise.reject(new Error("player data"))
      : Promise.resolve(data.progress),
}))
const tour = vi.hoisted(() => ({ steps: undefined as unknown }))
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => {
    tour.steps = steps
  },
}))

const dante = {
  ...lysanderEvent,
  id: "bloodDante",
  name: "Dante",
  finished: true,
  eventStageStartDatesUtc: ["2026-01-04T00:00:00Z"],
}
const lysanderProgress = {
  id: "astarLysander",
  alpha: null,
  beta: null,
  gamma: null,
  currentPoints: 3410,
  currentCurrency: 120,
  currentShards: 125,
  currentClaimedChestIndex: 4,
  currentEventRun: 2,
  currentEventTokens: {
    current: 5,
    max: 12,
    nextTokenInSeconds: 1200,
    regenDelayInSeconds: 7200,
  },
  hasUsedAdForExtraTokenToday: false,
  extraCurrencyPerPayout: null,
}

let i18n: I18n

function EventProbe() {
  const { eventId } = useParams()
  return <div data-testid="event-page">{eventId}</div>
}

function renderHub() {
  return render(
    <MemoryRouter initialEntries={["/events/legendary-events"]}>
      <Routes>
        <Route
          element={<LegendaryEventsHubPage />}
          path="/events/legendary-events"
        />
        <Route
          element={<EventProbe />}
          path="/events/legendary-events/:eventId"
        />
      </Routes>
    </MemoryRouter>,
    { wrapper: i18nWrapper(i18n) }
  )
}

const ready = () => screen.findByTestId("legendary-events-hub")
const names = (container: HTMLElement) =>
  within(container)
    .getAllByTestId("legendary-event-name")
    .map((node) => node.textContent)

describe("LegendaryEventsHubPage", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })
  beforeEach(() => {
    Object.assign(data, {
      events: [dante, farsightEvent, utharEvent, lysanderEvent],
      eventsFail: false,
      eventsPending: false,
      eventsCalls: 0,
      progress: [lysanderProgress],
      progressFail: false,
    })
    setViewportWidth(1280)
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-09-02T12:00:00Z"))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it("orders the events under Active, Upcoming and Archived", async () => {
    renderHub()
    await ready()

    expect(names(screen.getByTestId("legendary-events-group-active"))).toEqual([
      "Lysander",
    ])
    expect(
      names(screen.getByTestId("legendary-events-group-upcoming"))
    ).toEqual(["Uthar", "Farsight"])
    expect(
      names(screen.getByTestId("legendary-events-group-archived"))
    ).toEqual(["Dante"])
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)
    ).toEqual(["Active", "Upcoming", "Archived"])
    expect(screen.queryByTestId("legendary-events-no-active")).toBeNull()
  })

  it("shows the active row's synced run, tokens and points", async () => {
    renderHub()
    await ready()

    const active = within(screen.getByTestId("legendary-events-group-active"))
    const synced = active.getByTestId("legendary-event-synced")
    expect(synced).toHaveTextContent("Run 2 of 3")
    expect(synced).toHaveTextContent("5/12 tokens")
    expect(synced).toHaveTextContent("3,410 points")
    // Run ends 2026-09-06T00:00Z: 3.5 days away, rounded to whole days.
    expect(active.getByTestId("event-timing-countdown")).toHaveTextContent(
      "Ends in 4 days"
    )
  })

  it("shows only the run timing for an active row without a synced entry", async () => {
    data.progress = []
    renderHub()
    await ready()

    const active = within(screen.getByTestId("legendary-events-group-active"))
    expect(active.getByTestId("event-timing")).toBeInTheDocument()
    expect(active.queryByTestId("legendary-event-synced")).toBeNull()
    expect(active.queryByText(/Run \d of 3/)).toBeNull()
  })

  it("shows an upcoming row's local start and countdown", async () => {
    vi.stubEnv("TZ", "Europe/Kyiv")
    vi.setSystemTime(new Date("2026-09-20T00:00:00Z"))
    renderHub()
    await ready()

    const uthar = within(
      screen.getByTestId("legendary-events-group-upcoming")
    ).getAllByTestId("legendary-event-card")[0]!
    expect(uthar).toHaveTextContent("Uthar")
    // 2026-10-04T00:00Z is 03:00 in Kyiv (UTC+3 in October).
    expect(within(uthar).getByTestId("event-timing-date")).toHaveTextContent(
      /Starts Oct 4, 2026, 3:00\sAM/
    )
    expect(
      within(uthar).getByTestId("event-timing-countdown")
    ).toHaveTextContent("Starts in 14 days")
  })

  it("heads the page with the no-active line when nothing is running", async () => {
    data.events = [utharEvent, farsightEvent]
    renderHub()
    await ready()

    expect(screen.getByTestId("legendary-events-no-active")).toHaveTextContent(
      "No Legendary Event is running right now."
    )
    expect(screen.queryByTestId("legendary-events-group-active")).toBeNull()
    expect(screen.queryByRole("heading", { name: "Active" })).toBeNull()
  })

  it("shows a skeleton and no headings while the catalog loads", () => {
    data.eventsPending = true
    renderHub()

    expect(screen.getByTestId("legendary-events-hub-loading")).toBeVisible()
    expect(screen.queryByRole("heading")).toBeNull()
  })

  it("shows the error body on a catalog failure, and Retry re-issues the read", async () => {
    data.eventsFail = true
    renderHub()
    const error = await screen.findByTestId("legendary-events-hub-error")
    const callsBefore = data.eventsCalls

    data.eventsFail = false
    fireEvent.click(within(error).getByRole("button", { name: "Retry" }))

    await ready()
    expect(data.eventsCalls).toBeGreaterThan(callsBefore)
  })

  it("still lists catalog rows when the player data read fails", async () => {
    data.progressFail = true
    renderHub()
    await ready()

    const active = within(screen.getByTestId("legendary-events-group-active"))
    await waitFor(() =>
      expect(
        active.getByTestId("legendary-event-synced-unavailable")
      ).toHaveTextContent("Synced data unavailable")
    )
    expect(names(screen.getByTestId("legendary-events-hub"))).toHaveLength(4)
  })

  it("opens the event page when a card is activated", async () => {
    renderHub()
    await ready()

    fireEvent.click(
      within(
        screen.getByTestId("legendary-events-group-upcoming")
      ).getAllByTestId("legendary-event-card")[0]!
    )
    expect(screen.getByTestId("event-page")).toHaveTextContent("votanUthar")
  })

  it("registers tour steps for the active group and the first upcoming row", async () => {
    renderHub()
    await ready()

    const steps = tour.steps as {
      desktop: { target: string }[]
      mobile: { target: string }[]
    }
    for (const form of [steps.desktop, steps.mobile]) {
      expect(form.map((step) => step.target)).toEqual([
        '[data-testid="legendary-events-group-active"]',
        '[data-testid="legendary-events-group-upcoming"] [data-testid="legendary-event-card"]',
      ])
      for (const step of form) {
        expect(document.querySelector(step.target)).not.toBeNull()
      }
    }
  })

  describe("layout", () => {
    it("lays the cards out as a grid at 1280px", async () => {
      setViewportWidth(1280)
      renderHub()
      await ready()

      for (const list of screen.getAllByTestId("legendary-events-list")) {
        expect(list).toHaveAttribute("data-layout", "grid")
        expect(list).toHaveClass("grid", "grid-cols-2")
      }
    })

    it("stacks full-width cards at 390px with nothing forcing horizontal scroll", async () => {
      setViewportWidth(390)
      const { container } = renderHub()
      await ready()

      for (const list of screen.getAllByTestId("legendary-events-list")) {
        expect(list).toHaveAttribute("data-layout", "stack")
        expect(list).toHaveClass("flex", "flex-col")
        expect(list.className).not.toMatch(/grid-cols/)
      }
      // Every card may shrink (min-w-0) and truncates its name instead of overflowing.
      for (const card of screen.getAllByTestId("legendary-event-card")) {
        expect(card).toHaveClass("min-w-0")
        expect(within(card).getByTestId("legendary-event-name")).toHaveClass(
          "truncate"
        )
      }
      expect(container.querySelector('[class*="overflow-x"]')).toBeNull()
      expect(container.querySelector('[class*="min-w-["]')).toBeNull()
      expect(container.querySelector('[class*="w-["]')).toBeNull()

      // The mobile tour's targets exist on the mobile form too.
      const { mobile } = tour.steps as { mobile: { target: string }[] }
      for (const step of mobile) {
        expect(document.querySelector(step.target)).not.toBeNull()
      }
    })

    it("targets the no-active line in the tour when nothing is running", async () => {
      setViewportWidth(390)
      data.events = [utharEvent]
      renderHub()
      await ready()

      const { mobile } = tour.steps as { mobile: { target: string }[] }
      expect(mobile[0]?.target).toBe(
        '[data-testid="legendary-events-no-active"]'
      )
      for (const step of mobile) {
        expect(document.querySelector(step.target)).not.toBeNull()
      }
    })
  })
})
