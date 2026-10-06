import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen, within } from "@/test/render"

import { HomeEventsWidget } from "./home-events-widget"

const { navigateMock, hseMock, legendaryMock, progressMock } = vi.hoisted(
  () => ({
    navigateMock: vi.fn(),
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
vi.mock("react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router")>()),
  useNavigate: () => navigateMock,
}))
vi.mock("@/features/daily-raids", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/daily-raids")>()
  return { ...actual, useActiveHomeScreenEvent: () => hseMock() }
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
  finished: false,
  eventStageStartDatesUtc: ["2026-09-29T00:00:00Z"],
}
const uthar = {
  id: "votanUthar",
  finished: false,
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

function renderWidget() {
  return render(
    <MemoryRouter>
      <HomeEventsWidget />
    </MemoryRouter>
  )
}

describe("HomeEventsWidget", () => {
  beforeEach(() => {
    navigateMock.mockReset()
    hseMock.mockReturnValue(hseReady(hunt, [rush]))
    legendaryMock.mockReturnValue(legendaryReady([lysander, uthar]))
    progressMock.mockReturnValue(
      progressReady([
        { id: "astarLysander", currentEventRun: 2, currentPoints: 3410 },
      ])
    )
  })
  afterEach(() => vi.unstubAllEnvs())

  it("lists the live HSE, the live Legendary Event with run and points, then the next upcoming event", () => {
    renderWidget()

    const rows = screen.getAllByTestId("home-events-row")
    expect(rows).toHaveLength(3)
    expect(rows[0]).toHaveTextContent("events:definitions.hse-machine-hunt")
    expect(rows[0]).toHaveAttribute("data-type", "homeScreen")
    expect(
      within(rows[0]!).getByTestId("home-events-live-badge")
    ).toBeInTheDocument()
    expect(rows[1]).toHaveTextContent("Lysander")
    expect(rows[1]).toHaveAttribute("data-type", "legendaryEvent")
    expect(
      within(rows[1]!).getByTestId("home-events-live-badge")
    ).toBeInTheDocument()
    expect(
      within(rows[1]!).getByTestId("home-events-synced")
    ).toHaveTextContent("common:home.events.run:2")
    expect(
      within(rows[1]!).getByTestId("home-events-synced")
    ).toHaveTextContent("common:home.events.points:3,410")
    expect(rows[2]).toHaveTextContent("events:definitions.hse-training-rush")
    expect(rows[2]).toHaveTextContent("common:home.events.startsIn:6 days")
    expect(within(rows[2]!).queryByTestId("home-events-live-badge")).toBeNull()
    expect(screen.queryByText("Uthar")).toBeNull()
  })

  it("omits run and points for a live Legendary Event without a synced entry", () => {
    progressMock.mockReturnValue(progressReady([]))
    renderWidget()

    const lysanderRow = screen.getAllByTestId("home-events-row")[1]!
    expect(lysanderRow).toHaveTextContent("Lysander")
    expect(within(lysanderRow).queryByTestId("home-events-synced")).toBeNull()
  })

  it("orders only-upcoming events across both types by start", () => {
    hseMock.mockReturnValue(hseReady(null, [rush]))
    legendaryMock.mockReturnValue(legendaryReady([uthar]))
    renderWidget()

    const rows = screen.getAllByTestId("home-events-row")
    expect(rows.map((row) => row.dataset.type)).toEqual([
      "homeScreen",
      "legendaryEvent",
    ])
    expect(screen.queryByTestId("home-events-live-badge")).toBeNull()
  })

  it.each([
    ["the calendar", "loading", "ready"],
    ["the catalog", "ready", "loading"],
  ])("shows the loading body while %s read is pending", (_name, hse, le) => {
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
  })

  it("shows the error body only when both reads fail", () => {
    hseMock.mockReturnValue({ status: "error" })
    legendaryMock.mockReturnValue({ status: "error", nowMs: NOW, retry })
    renderWidget()

    expect(screen.getByTestId("home-events-error")).toBeInTheDocument()
    expect(screen.queryByTestId("home-events-row")).toBeNull()
  })

  it("keeps Legendary Event rows and notes the failed calendar read", () => {
    hseMock.mockReturnValue({ status: "error" })
    legendaryMock.mockReturnValue(legendaryReady([uthar]))
    renderWidget()

    expect(screen.getByTestId("home-events-source-failed")).toHaveTextContent(
      "common:home.events.sourceFailed:common:home.events.openHse"
    )
    expect(screen.getAllByTestId("home-events-row")).toHaveLength(1)
    expect(screen.getByTestId("home-events-row")).toHaveTextContent("Uthar")
  })

  it("keeps Home Screen Event rows and notes the failed catalog read", () => {
    legendaryMock.mockReturnValue({ status: "error", nowMs: NOW, retry })
    renderWidget()

    expect(screen.getByTestId("home-events-source-failed")).toHaveTextContent(
      "common:home.events.openLegendaryEvents"
    )
    expect(
      screen.getAllByTestId("home-events-row").map((row) => row.dataset.type)
    ).toEqual(["homeScreen", "homeScreen"])
  })

  it("shows the empty body with links to both destinations when nothing is scheduled", () => {
    hseMock.mockReturnValue(hseReady(null, []))
    legendaryMock.mockReturnValue(legendaryReady([]))
    renderWidget()

    const empty = screen.getByTestId("home-events-empty")
    expect(empty).toHaveTextContent("common:home.events.empty")
    expect(
      within(empty).getByRole("link", { name: "common:home.events.openHse" })
    ).toHaveAttribute("href", "/dailies/hse")
    expect(
      within(empty).getByRole("link", {
        name: "common:home.events.openLegendaryEvents",
      })
    ).toHaveAttribute("href", "/events/legendary-events")
  })

  it("is titled Events, not the calendar, and the card itself is not a button", () => {
    renderWidget()

    const card = screen.getByTestId("home-events-widget")
    expect(screen.getByText("common:home.events.title")).toBeInTheDocument()
    expect(screen.queryByText("common:home.calendar.title")).toBeNull()
    expect(card).not.toHaveAttribute("role")
    expect(card).not.toHaveAttribute("tabindex")
  })

  it("opens each row's own destination on click", async () => {
    const user = userEvent.setup()
    renderWidget()
    const rows = screen.getAllByTestId("home-events-row")

    await user.click(rows[0]!)
    expect(navigateMock).toHaveBeenLastCalledWith("/dailies/hse")
    await user.click(rows[1]!)
    expect(navigateMock).toHaveBeenLastCalledWith(
      "/events/legendary-events/astarLysander"
    )
    // Clicking the card outside a row navigates nowhere.
    navigateMock.mockReset()
    await user.click(screen.getByText("common:home.events.title"))
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it("activates a focused row with Enter and Space", async () => {
    const user = userEvent.setup()
    renderWidget()
    const lysanderRow = screen.getAllByTestId("home-events-row")[1]!

    expect(lysanderRow.tagName).toBe("BUTTON")
    lysanderRow.focus()
    await user.keyboard("{Enter}")
    expect(navigateMock).toHaveBeenCalledTimes(1)
    await user.keyboard(" ")
    expect(navigateMock).toHaveBeenCalledTimes(2)
    expect(navigateMock).toHaveBeenLastCalledWith(
      "/events/legendary-events/astarLysander"
    )
  })

  it("changes only the displayed local start with the device timezone", () => {
    hseMock.mockReturnValue(hseReady(null, [rush]))
    legendaryMock.mockReturnValue(legendaryReady([]))
    const shown = (timeZone: string) => {
      vi.stubEnv("TZ", timeZone)
      const { unmount } = renderWidget()
      const text = screen.getByTestId("home-events-start").textContent
      const row = screen.getByTestId("home-events-row")
      const summary = [
        row.getAttribute("data-live"),
        row.textContent?.includes("startsIn"),
      ]
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
