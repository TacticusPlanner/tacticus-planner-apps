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
import { spyOnIndexedDbReads } from "@/test/fixtures/indexeddb-failure"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { fireEvent, render, screen, waitFor, within } from "@/test/render"
import { seedGameCatalog, seedPlayerData } from "@/test/seed"
import { setViewportWidth } from "@/test/viewport"

import { LegendaryEventsHubPage } from "./legendary-events-hub-page"

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
  eventStageStartDatesUtc: [
    "2025-05-04T00:00:00Z",
    "2025-09-07T00:00:00Z",
    "2026-01-04T00:00:00Z",
  ],
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
let reads: ReturnType<typeof spyOnIndexedDbReads>

function EventProbe() {
  const { eventId } = useParams()
  return <div data-testid="event-page">{eventId}</div>
}

function renderHub() {
  return render(
    <MemoryRouter initialEntries={["/legendary-events"]}>
      <Routes>
        <Route element={<LegendaryEventsHubPage />} path="/legendary-events" />
        <Route element={<EventProbe />} path="/legendary-events/:eventId" />
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
  beforeEach(async () => {
    await seedGameCatalog({
      lres: [dante, farsightEvent, utharEvent, lysanderEvent],
    })
    await seedPlayerData({ "lre-progress": [lysanderProgress] })
    reads = spyOnIndexedDbReads()
    setViewportWidth(1280)
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-09-02T12:00:00Z"))
  })
  afterEach(() => {
    reads.restore()
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
    expect(synced).toHaveTextContent("Event 2 of 3")
    expect(synced).toHaveTextContent("5/12 tokens")
    expect(synced).toHaveTextContent("3,410 points")
    // Run ends 2026-09-06T00:00Z: 3.5 days away, rounded to whole days.
    expect(active.getByTestId("event-timing-countdown")).toHaveTextContent(
      "Ends in 4 days"
    )
  })

  it("shows only the run timing for an active row without a synced entry", async () => {
    await seedPlayerData({ "lre-progress": [] })
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
    // Only run 1 is announced: runs 2 and 3 are guessed 175 days apart.
    expect(within(uthar).getByTestId("legendary-event-runs")).toHaveTextContent(
      "Run 1: Oct 4, 2026Run 2: maybe ~Mar 2027Run 3: maybe ~Sep 2027"
    )
    expect(within(uthar).getByTestId("legendary-event-run-2")).toHaveAttribute(
      "data-guessed",
      "true"
    )
  })

  it("heads the page with the no-active line when nothing is running", async () => {
    await seedGameCatalog({ lres: [utharEvent, farsightEvent] })
    renderHub()
    await ready()

    expect(screen.getByTestId("legendary-events-no-active")).toHaveTextContent(
      "No Legendary Event is running right now."
    )
    expect(screen.queryByTestId("legendary-events-group-active")).toBeNull()
    expect(screen.queryByRole("heading", { name: "Active" })).toBeNull()
  })

  it("shows a skeleton and no headings while the catalog loads", () => {
    // The first render precedes the asynchronous catalog read.
    renderHub()

    expect(screen.getByTestId("legendary-events-hub-loading")).toBeVisible()
    expect(screen.queryByRole("heading")).toBeNull()
  })

  it("shows the error body on a catalog failure, and Retry re-issues the read", async () => {
    reads.fail("lres")
    renderHub()
    const error = await screen.findByTestId("legendary-events-hub-error")
    const callsBefore = reads.calls()

    reads.fail(false)
    fireEvent.click(within(error).getByRole("button", { name: "Retry" }))

    await ready()
    expect(reads.calls()).toBeGreaterThan(callsBefore)
  })

  it("still lists catalog rows when the player data read fails", async () => {
    reads.fail("tacticus-planner-player-data")
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
      await seedGameCatalog({ lres: [utharEvent] })
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
