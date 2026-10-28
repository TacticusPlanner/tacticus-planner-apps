import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes, useLocation } from "react-router"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen, within } from "@/test/render"

import { useHomeEvents } from "../../model/use-home-events"
import { RightNow } from "../right-now/right-now"
import { UpcomingEvents } from "./upcoming-events"

const { eventProjectsMock, hseMock, legendaryMock, progressMock } = vi.hoisted(
  () => ({
    eventProjectsMock: vi.fn(),
    hseMock: vi.fn(),
    legendaryMock: vi.fn(),
    progressMock: vi.fn(),
  })
)

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({
    i18n: { language: "en" },
    t: (key: string, values?: Record<string, unknown>) => {
      if (!values) return key
      const shown = Object.entries(values)
        .filter(([name]) => name !== "defaultValue")
        .map(([, value]) => value)
      return shown.length > 0 ? `${key}:${shown.join(",")}` : key
    },
  }),
}))
vi.mock("@/features/daily-raids", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/daily-raids")>()
  return { ...actual, useHomeScreenEventCalendar: () => hseMock() }
})
vi.mock("@/entities/legendary-event", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/entities/legendary-event")>()
  return {
    ...actual,
    useLegendaryEvents: () => legendaryMock(),
    useLegendaryEventsProgress: () => progressMock(),
  }
})
vi.mock("@/features/project-management", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/project-management")>()
  return {
    ...actual,
    useEventProjects: (eventId: string) => eventProjectsMock(eventId),
  }
})
// Tokens have their own tests; this file covers the events half of Right now.
vi.mock("../token-availability/token-availability", () => ({
  TokenAvailability: () => null,
}))
vi.mock("@/shared/unit-name", () => ({
  useUnitName: () => (_type: string, id: string) =>
    ({ astarLysander: "Lysander", votanUthar: "Uthar" })[id] ?? id,
}))

const NOW = Date.parse("2026-10-03T12:00:00Z")
const retry = vi.fn()
const entry = (definitionId: string, startUtc: string, endUtc: string) => ({
  definitionId,
  startUtc,
  endUtc,
})
// Machine Hunt live until 2026-10-05T08:00Z; Training Rush starts 2026-10-09T08:00Z.
const hunt = entry(
  "hse-machine-hunt",
  "2026-10-01T08:00:00Z",
  "2026-10-05T08:00:00Z"
)
const rush = entry(
  "hse-training-rush",
  "2026-10-09T08:00:00Z",
  "2026-10-12T08:00:00Z"
)
// Lysander's run 2026-09-29 → 2026-10-06; Uthar's starts 2026-10-11.
const lysander = {
  id: "astarLysander",
  eventStageStartDatesUtc: ["2026-09-29T00:00:00Z"],
}
const uthar = {
  id: "votanUthar",
  eventStageStartDatesUtc: ["2026-10-11T00:00:00Z"],
}

const hseReady = (active: typeof hunt | null, upcoming: (typeof hunt)[]) => ({
  status: "ready",
  active,
  next: upcoming[0] ?? null,
  upcoming,
  nowMs: NOW,
})
const legendaryReady = (events: unknown[]) => ({
  status: "ready",
  data: events,
  nowMs: NOW,
  retry,
})
const progressReady = (entries: unknown[] = []) => ({
  status: "ready",
  data: entries,
  retry,
})

function LocationProbe() {
  const { pathname } = useLocation()
  return <span data-testid="current-path">{pathname}</span>
}

function HomeEvents() {
  const events = useHomeEvents()
  return (
    <>
      <RightNow events={events} />
      <UpcomingEvents events={events} />
    </>
  )
}

function renderWidget() {
  return render(
    <MemoryRouter initialEntries={["/home"]}>
      <LocationProbe />
      <Routes>
        <Route element={<HomeEvents />} path="/home" />
        <Route element={<div data-testid="destination" />} path="*" />
      </Routes>
    </MemoryRouter>
  )
}

const currentPath = () => screen.getByTestId("current-path").textContent

const liveTiles = () => screen.queryAllByTestId("home-live-event")
const upcomingItems = () =>
  within(screen.getByTestId("home-events-widget")).queryAllByRole("listitem")

describe("Home events (Right now + Upcoming events)", () => {
  beforeEach(() => {
    // The minute clock the hook falls back to when the calendar read fails.
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(NOW)
    hseMock.mockReturnValue(hseReady(hunt, [rush]))
    legendaryMock.mockReturnValue(legendaryReady([lysander, uthar]))
    progressMock.mockReturnValue(
      progressReady([
        { id: "astarLysander", currentEventRun: 2, currentPoints: 3410 },
      ])
    )
    eventProjectsMock.mockReturnValue({
      status: "ready",
      projects: [],
      archivedCount: 0,
    })
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.useRealTimers()
  })

  it("puts live events in Right now with the Legendary Event's run and points", () => {
    renderWidget()

    const tiles = liveTiles()
    expect(tiles).toHaveLength(2)
    expect(tiles[0]).toHaveAttribute("data-type", "homeScreen")
    expect(tiles[0]).toHaveTextContent("definitions.hse-machine-hunt")
    expect(
      within(tiles[0]!).getByTestId("home-events-live-badge")
    ).toBeInTheDocument()
    expect(tiles[1]).toHaveAttribute("data-type", "legendaryEvent")
    expect(tiles[1]).toHaveTextContent("Lysander")
    expect(
      within(tiles[1]!).getByTestId("home-events-synced")
    ).toHaveTextContent("home.events.run:2")
    expect(
      within(tiles[1]!).getByTestId("home-events-synced")
    ).toHaveTextContent("home.events.points:3,410")
    expect(tiles[1]).toHaveTextContent("home.events.endsIn")
  })

  it("lists only not-yet-started events in Upcoming events, with countdowns", () => {
    renderWidget()

    const items = upcomingItems()
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent("definitions.hse-training-rush")
    expect(items[0]).toHaveTextContent("home.events.startsIn:5 days 20 hr")
    expect(items[1]).toHaveTextContent("Uthar")
    expect(
      within(screen.getByTestId("home-events-widget")).queryByTestId(
        "home-events-live-badge"
      )
    ).toBeNull()
  })

  it("selects and labels rows with one clock when the two sources tick apart", () => {
    legendaryMock.mockReturnValue({
      ...legendaryReady([lysander, uthar]),
      nowMs: NOW + 2 * 86_400_000,
    })
    renderWidget()

    expect(upcomingItems()[0]).toHaveTextContent(
      "home.events.startsIn:5 days 20 hr"
    )
  })

  it("omits run and points for a live Legendary Event without a synced entry", () => {
    progressMock.mockReturnValue(progressReady([]))
    renderWidget()

    const lysanderTile = liveTiles()[1]!
    expect(lysanderTile).toHaveTextContent("Lysander")
    expect(within(lysanderTile).queryByTestId("home-events-synced")).toBeNull()
  })

  it("shows the nothing-live note when no event is running", () => {
    hseMock.mockReturnValue(hseReady(null, [rush]))
    legendaryMock.mockReturnValue(legendaryReady([uthar]))
    renderWidget()

    expect(screen.getByTestId("home-live-none")).toHaveTextContent(
      "home.rightNow.nothingLive"
    )
    expect(
      screen.getAllByTestId("home-events-row").map((row) => row.dataset.type)
    ).toEqual(["homeScreen", "legendaryEvent"])
  })

  it("offers the plan wizard for a Legendary Event no project targets", () => {
    renderWidget()

    expect(eventProjectsMock).toHaveBeenCalledWith("votanUthar")
    const [live, upcoming] = screen.getAllByTestId("home-le-plan")
    expect(live).toHaveAttribute("href", "/legendary-events/astarLysander/plan")
    expect(upcoming).toHaveAttribute(
      "href",
      "/legendary-events/votanUthar/plan"
    )
  })

  it("opens the targeting project, or lists several in a menu", async () => {
    const user = userEvent.setup()
    const linked = (projectId: string, name: string) => ({
      project: { projectId, name },
      goals: 1,
    })
    eventProjectsMock.mockImplementation((eventId: string) => ({
      status: "ready",
      projects:
        eventId === "astarLysander"
          ? [linked("p1", "Lysander push")]
          : [linked("p2", "Uthar A"), linked("p3", "Uthar B")],
      archivedCount: 0,
    }))
    renderWidget()

    expect(screen.getByTestId("home-le-project")).toHaveAttribute(
      "href",
      "/plan/goals?project=p1"
    )
    await user.click(screen.getByTestId("home-le-projects"))
    expect(
      await screen.findByRole("menuitem", { name: "Uthar B" })
    ).toHaveAttribute("href", "/plan/goals?project=p3")
  })

  it.each([
    ["the calendar", "loading", "ready"],
    ["the catalog", "ready", "loading"],
  ])("shows loading bodies while %s read is pending", (_name, hse, le) => {
    hseMock.mockReturnValue(
      hse === "loading" ? { status: "loading" } : hseReady(null, [])
    )
    legendaryMock.mockReturnValue(
      le === "loading"
        ? { status: "loading", nowMs: NOW, retry }
        : legendaryReady([])
    )
    renderWidget()

    expect(screen.getByTestId("home-events-loading")).toBeInTheDocument()
    expect(screen.getByTestId("home-live-loading")).toBeInTheDocument()
  })

  it("shows the error body only when both reads fail", () => {
    hseMock.mockReturnValue({ status: "error" })
    legendaryMock.mockReturnValue({ status: "error", nowMs: NOW, retry })
    renderWidget()

    expect(screen.getByTestId("home-events-error")).toBeInTheDocument()
    expect(screen.getByTestId("home-live-none")).toBeInTheDocument()
    expect(screen.queryByTestId("home-events-row")).toBeNull()
  })

  it("keeps Legendary Event rows and notes the failed calendar read", () => {
    hseMock.mockReturnValue({ status: "error" })
    legendaryMock.mockReturnValue(legendaryReady([uthar]))
    renderWidget()

    expect(screen.getByTestId("home-events-source-failed")).toHaveTextContent(
      "home.events.sourceFailed:home.events.openHse"
    )
    expect(upcomingItems()).toHaveLength(1)
    expect(upcomingItems()[0]).toHaveTextContent("Uthar")
    expect(upcomingItems()[0]).toHaveTextContent(
      "home.events.startsIn:7 days 12 hr"
    )
  })

  it("keeps Home Screen Event rows and notes the failed catalog read", () => {
    legendaryMock.mockReturnValue({ status: "error", nowMs: NOW, retry })
    renderWidget()

    expect(screen.getByTestId("home-events-source-failed")).toHaveTextContent(
      "home.events.openLegendaryEvents"
    )
    expect(liveTiles().map((tile) => tile.dataset.type)).toEqual(["homeScreen"])
    expect(
      within(screen.getByTestId("home-events-widget"))
        .getAllByTestId("home-events-row")
        .map((row) => row.dataset.type)
    ).toEqual(["homeScreen"])
  })

  it("shows the empty body with links to both destinations when nothing is scheduled", () => {
    hseMock.mockReturnValue(hseReady(null, []))
    legendaryMock.mockReturnValue(legendaryReady([]))
    renderWidget()

    const empty = screen.getByTestId("home-events-empty")
    expect(empty).toHaveTextContent("home.events.empty")
    expect(
      within(empty).getByRole("link", { name: "home.events.openHse" })
    ).toHaveAttribute("href", "/dailies/hse")
    expect(
      within(empty).getByRole("link", {
        name: "home.events.openLegendaryEvents",
      })
    ).toHaveAttribute("href", "/legendary-events")
  })

  it("is titled Upcoming events, not the calendar, and the card itself is not a button", () => {
    renderWidget()

    const card = screen.getByTestId("home-events-widget")
    expect(within(card).getByText("home.events.title")).toBeVisible()
    expect(screen.queryByText("home.calendar.title")).toBeNull()
    expect(card).not.toHaveAttribute("role")
    expect(card).not.toHaveAttribute("tabindex")
  })

  it("renders each row as a link to its own destination", () => {
    renderWidget()
    const rows = screen.getAllByTestId("home-events-row")

    expect(rows.map((row) => row.tagName)).toEqual(["A", "A", "A", "A"])
    // An HSE row opens the HSE tab on that very instance.
    expect(rows[0]!.getAttribute("href")).toMatch(/^\/dailies\/hse\?event=/)
    expect(rows[1]).toHaveAttribute("href", "/legendary-events/astarLysander")
  })

  it("opens a row's destination on click, and the card itself navigates nowhere", async () => {
    const user = userEvent.setup()
    renderWidget()

    await user.click(screen.getByText("home.events.title"))
    expect(currentPath()).toBe("/home")

    await user.click(screen.getAllByTestId("home-events-row")[1]!)
    expect(currentPath()).toBe("/legendary-events/astarLysander")
  })

  it("activates a focused row with Enter", async () => {
    const user = userEvent.setup()
    renderWidget()

    screen.getAllByTestId("home-events-row")[0]!.focus()
    await user.keyboard("{Enter}")
    expect(currentPath()).toBe("/dailies/hse")
  })

  it("changes only the displayed local start with the device timezone", () => {
    hseMock.mockReturnValue(hseReady(null, [rush]))
    legendaryMock.mockReturnValue(legendaryReady([]))
    const shown = (timeZone: string) => {
      vi.stubEnv("TZ", timeZone)
      const { unmount } = renderWidget()
      const text = screen.getByTestId("home-events-start").textContent
      const row = screen.getByTestId("home-events-row")
      const summary = [row.getAttribute("data-live"), row.dataset.type]
      unmount()
      return { text, summary }
    }
    const utc = shown("UTC")
    const honolulu = shown("Pacific/Honolulu")
    expect(utc.text).toContain("8:00")
    expect(honolulu.text).toContain("10:00")
    expect(honolulu.text).not.toBe(utc.text)
    expect(honolulu.summary).toEqual(utc.summary)
  })
})
