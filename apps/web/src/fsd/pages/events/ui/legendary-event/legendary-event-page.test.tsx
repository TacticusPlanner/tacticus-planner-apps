import { useEffect, useState } from "react"
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router"
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
  legendaryEventCommon,
  lysanderEvent,
  utharEvent,
} from "@/test/fixtures/legendary-events"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { act, fireEvent, render, screen, within } from "@/test/render"
import { setViewportWidth } from "@/test/viewport"

import { LegendaryEventPage } from "./legendary-event-page"

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

const events = [lysanderEvent, utharEvent]
vi.mock("@workspace/game-catalog/queries", () => ({
  getLegendaryEvent: async (id: string) =>
    events.find((event) => event.id === id),
  getLegendaryEventCommon: async () => legendaryEventCommon,
  getCharactersMap: async () => new Map(),
  getMowsMap: async () => new Map(),
}))
vi.mock("@workspace/player-data/queries", () => ({
  getLegendaryEventProgress: async () => undefined,
}))
vi.mock("@workspace/player-data", () => ({
  getPlayerDataMetadata: async () => new Map(),
  getManifestMetadata: () => undefined,
}))
const tour = vi.hoisted(() => ({ steps: undefined as unknown }))
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => {
    tour.steps = steps
  },
}))

let i18n: I18n

function Controls() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  return (
    <>
      <span data-testid="current-path">{pathname}</span>
      <button
        data-testid="open-uthar"
        onClick={() => void navigate("/events/legendary-events/votanUthar")}
        type="button"
      >
        Uthar
      </button>
      <button
        data-testid="open-lysander"
        onClick={() => void navigate("/events/legendary-events/astarLysander")}
        type="button"
      >
        Lysander
      </button>
    </>
  )
}

function renderPage(path: string) {
  return render(
    <MemoryRouter initialEntries={["/home", path]} initialIndex={1}>
      <Controls />
      <Routes>
        <Route element={<div data-testid="home" />} path="/home" />
        <Route
          element={<div data-testid="hub" />}
          path="/events/legendary-events"
        />
        <Route
          element={<LegendaryEventPage />}
          path="/events/legendary-events/:eventId"
        />
      </Routes>
    </MemoryRouter>,
    { wrapper: i18nWrapper(i18n) }
  )
}

const selectLane = (lane: string) => {
  const tab = screen.getByTestId(`legendary-event-lane-tab-${lane}`)
  // Radix tabs activate on mousedown.
  fireEvent.mouseDown(tab, { button: 0 })
}
const laneLabels = () =>
  screen
    .getAllByTestId("legendary-event-lane-panel")
    .map((panel) => panel.dataset.lane)

describe("LegendaryEventPage", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })
  beforeEach(() => {
    setViewportWidth(1280)
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-09-02T12:00:00Z"))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it("renders a known event with its name, lifecycle badge, then Run status and Lane overview", async () => {
    renderPage("/events/legendary-events/astarLysander")
    const page = await screen.findByTestId("legendary-event-page")

    expect(screen.getByTestId("legendary-event-title")).toHaveTextContent(
      "Lysander"
    )
    expect(screen.getByTestId("legendary-event-lifecycle")).toHaveTextContent(
      "Active"
    )
    const runStatus = screen.getByTestId("legendary-event-run-status")
    const laneOverview = screen.getByTestId("legendary-event-lane-overview")
    expect(page).toContainElement(runStatus)
    expect(
      runStatus.compareDocumentPosition(laneOverview) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    // No synced entry for this event in this test's chunk.
    expect(screen.getByTestId("run-status-no-entry")).toBeInTheDocument()
  })

  it("replaces an unknown event id with the hub", async () => {
    renderPage("/events/legendary-events/notAnEvent")

    expect(await screen.findByTestId("hub")).toBeInTheDocument()
    expect(screen.getByTestId("current-path")).toHaveTextContent(
      /^\/events\/legendary-events$/
    )
  })

  describe("desktop (1280px)", () => {
    it("shows all three lane panels and no selector", async () => {
      renderPage("/events/legendary-events/astarLysander")
      await screen.findByTestId("legendary-event-page")

      expect(laneLabels()).toEqual(["alpha", "beta", "gamma"])
      expect(screen.queryByTestId("legendary-event-lane-selector")).toBeNull()
    })

    it("has every desktop tour target on the page", async () => {
      renderPage("/events/legendary-events/astarLysander")
      await screen.findByTestId("legendary-event-page")

      const { desktop } = tour.steps as { desktop: { target: string }[] }
      expect(desktop.map((step) => step.target)).toEqual([
        '[data-testid="legendary-event-run-status"]',
        '[data-testid="legendary-event-lane-overview"]',
      ])
      for (const step of desktop) {
        expect(document.querySelector(step.target)).not.toBeNull()
      }
    })
  })

  describe("mobile (390px)", () => {
    beforeEach(() => setViewportWidth(390))

    it("shows the selector defaulting to Alpha and a single lane", async () => {
      renderPage("/events/legendary-events/astarLysander")
      await screen.findByTestId("legendary-event-page")

      const selector = screen.getByTestId("legendary-event-lane-selector")
      expect(
        within(selector).getByRole("tab", { selected: true })
      ).toHaveTextContent("Alpha")
      expect(laneLabels()).toEqual(["alpha"])
    })

    it("drives the lane overview from the selector and resets it on another event", async () => {
      renderPage("/events/legendary-events/astarLysander")
      await screen.findByTestId("legendary-event-page")

      act(() => selectLane("gamma"))
      expect(laneLabels()).toEqual(["gamma"])

      fireEvent.click(screen.getByTestId("open-uthar"))
      await screen.findByText("Uthar", { selector: "h1" })
      expect(laneLabels()).toEqual(["alpha"])
      expect(
        within(screen.getByTestId("legendary-event-lane-selector")).getByRole(
          "tab",
          { selected: true }
        )
      ).toHaveTextContent("Alpha")

      // Back on Lysander, the earlier Gamma choice does not come back either.
      fireEvent.click(screen.getByTestId("open-lysander"))
      await screen.findByText("Lysander", { selector: "h1" })
      expect(laneLabels()).toEqual(["alpha"])
    })

    it("has every mobile tour target on the page, the selector first", async () => {
      renderPage("/events/legendary-events/astarLysander")
      await screen.findByTestId("legendary-event-page")

      const { mobile } = tour.steps as { mobile: { target: string }[] }
      expect(mobile.map((step) => step.target)).toEqual([
        '[data-testid="legendary-event-lane-selector"]',
        '[data-testid="legendary-event-run-status"]',
        '[data-testid="legendary-event-lane-overview"]',
      ])
      for (const step of mobile) {
        expect(document.querySelector(step.target)).not.toBeNull()
      }
    })
  })
})
