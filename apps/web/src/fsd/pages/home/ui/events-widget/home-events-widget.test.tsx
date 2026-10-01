import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { fireEvent, render, screen, within } from "@/test/render"

import { HomeEventsWidget } from "./home-events-widget"

const { navigateMock, stateMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  stateMock: vi.fn(),
}))

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({
    i18n: { language: "en" },
    t: (key: string, values?: Record<string, unknown>) =>
      values && "when" in values ? `${key}:${values.when}` : key,
  }),
}))
vi.mock("react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router")>()),
  useNavigate: () => navigateMock,
}))
vi.mock("@/features/daily-raids", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/daily-raids")>()
  return { ...actual, useActiveHomeScreenEvent: () => stateMock() }
})

const NOW = Date.parse("2026-10-03T08:00:00Z")
const entry = (definitionId: string, startUtc: string, endUtc: string) => ({
  definitionId,
  startUtc,
  endUtc,
})
const hunt = entry(
  "hse-machine-hunt",
  "2026-10-02T08:00:00Z",
  "2026-10-06T08:00:00Z"
)
const rush = entry(
  "hse-training-rush",
  "2026-10-09T08:00:00Z",
  "2026-10-12T08:00:00Z"
)
const warp = entry(
  "hse-warp-surge",
  "2026-10-20T00:00:00Z",
  "2026-10-23T00:00:00Z"
)
const ready = (active: typeof hunt | null, upcoming: (typeof hunt)[]) => ({
  status: "ready",
  active,
  next: upcoming[0] ?? null,
  upcoming,
  nowMs: NOW,
})

describe("HomeEventsWidget", () => {
  beforeEach(() => navigateMock.mockReset())
  afterEach(() => vi.unstubAllEnvs())

  it("lists the live event first with LIVE and 'ends in', then the next upcoming one", () => {
    stateMock.mockReturnValue(ready(hunt, [rush, warp]))
    render(<HomeEventsWidget />)

    const rows = screen.getAllByTestId("home-events-row")
    expect(rows).toHaveLength(2)
    expect(
      within(rows[0]!).getByText("events:definitions.hse-machine-hunt")
    ).toBeInTheDocument()
    expect(
      within(rows[0]!).getByTestId("home-events-live-badge")
    ).toHaveTextContent("common:home.events.live")
    expect(rows[0]).toHaveTextContent("common:home.events.endsIn:3 days")
    expect(within(rows[1]!).queryByTestId("home-events-live-badge")).toBeNull()
    expect(rows[1]).toHaveTextContent("events:definitions.hse-training-rush")
    expect(rows[1]).toHaveTextContent("common:home.events.startsIn:6 days")
    expect(screen.queryByText(/hse-warp-surge/)).toBeNull()
  })

  it("shows the two earliest upcoming events when nothing is live", () => {
    stateMock.mockReturnValue(ready(null, [hunt, rush, warp]))
    render(<HomeEventsWidget />)

    const rows = screen.getAllByTestId("home-events-row")
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent("hse-machine-hunt")
    expect(rows[1]).toHaveTextContent("hse-training-rush")
    expect(screen.queryByTestId("home-events-live-badge")).toBeNull()
  })

  it("has an empty body when nothing is scheduled", () => {
    stateMock.mockReturnValue(ready(null, []))
    render(<HomeEventsWidget />)
    expect(screen.getByTestId("home-events-empty")).toHaveTextContent(
      "common:home.events.empty"
    )
  })

  it("has distinct error and loading bodies", () => {
    stateMock.mockReturnValue({ status: "error" })
    const { unmount } = render(<HomeEventsWidget />)
    expect(screen.getByTestId("home-events-error")).toBeInTheDocument()
    unmount()
    stateMock.mockReturnValue({ status: "loading" })
    render(<HomeEventsWidget />)
    expect(screen.getByTestId("home-events-loading")).toBeInTheDocument()
  })

  it("is titled Home Screen Events, not the calendar", () => {
    stateMock.mockReturnValue(ready(null, []))
    render(<HomeEventsWidget />)
    expect(screen.getByText("common:home.events.title")).toBeInTheDocument()
    expect(screen.queryByText("common:home.calendar.title")).toBeNull()
  })

  it.each([
    ["ready", ready(hunt, [rush])],
    ["empty", ready(null, [])],
    ["error", { status: "error" }],
    ["loading", { status: "loading" }],
  ])("opens /dailies/hse on click, Enter and Space (%s)", (_name, state) => {
    stateMock.mockReturnValue(state)
    render(<HomeEventsWidget />)
    const card = screen.getByTestId("home-events-widget")

    expect(card).toHaveAttribute("role", "button")
    expect(card).toHaveAttribute("tabindex", "0")
    fireEvent.click(card)
    fireEvent.keyDown(card, { key: "Enter" })
    fireEvent.keyDown(card, { key: " " })
    fireEvent.keyDown(card, { key: "a" })

    expect(navigateMock).toHaveBeenCalledTimes(3)
    expect(navigateMock).toHaveBeenCalledWith("/dailies/hse")
  })

  it("changes only the displayed local start with the device timezone", () => {
    stateMock.mockReturnValue(ready(null, [rush]))
    const shown = (timeZone: string) => {
      vi.stubEnv("TZ", timeZone)
      const { unmount } = render(<HomeEventsWidget />)
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
