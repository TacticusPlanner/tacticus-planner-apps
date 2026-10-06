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

import { legendaryEventCharacters } from "@/test/fixtures/legendary-event-characters"
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
const catalog = vi.hoisted(() => ({ synced: true }))
vi.mock("@workspace/game-catalog/queries", () => ({
  hasLegendaryEventsSynced: async () => catalog.synced,
  getLegendaryEvent: async (id: string) =>
    events.find((event) => event.id === id),
  getLegendaryEventCommon: async () => legendaryEventCommon,
  getCharactersMap: async () => new Map(),
  getMowsMap: async () => new Map(),
  getCharacters: async () => legendaryEventCharacters,
}))
// Dante owned, everyone else locked; Lysander's Alpha has two synced battles.
const player = vi.hoisted(() => ({
  roster: [
    {
      unitId: "bloodDante",
      rank: "Diamond1",
      progressionIndex: "Legendary:RedFiveStars",
    },
  ] as unknown[] | undefined,
}))
vi.mock("@workspace/player-data/queries", () => ({
  getLegendaryEventProgress: async () => undefined,
  getPlayerCharacters: async () => player.roster,
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
const lanesOf = (testId: string) =>
  screen.getAllByTestId(testId).map((element) => element.dataset.lane)
const laneLabels = () => lanesOf("legendary-event-lane-panel")
const lockedRows = () =>
  screen
    .getAllByTestId("leaderboard-row")
    .filter((row) => row.dataset.ownership === "locked")
const toggleOnlyUnlocked = () =>
  fireEvent.click(screen.getByTestId("leaderboard-only-unlocked"))

describe("LegendaryEventPage", () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })
  beforeEach(() => {
    catalog.synced = true
    player.roster = [
      {
        unitId: "bloodDante",
        rank: "Diamond1",
        progressionIndex: "Legendary:RedFiveStars",
      },
    ]
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

  it("keeps loading a deep link until the catalog has synced", async () => {
    catalog.synced = false
    renderPage("/events/legendary-events/notYetSynced")

    // Let every read resolve (only Date is faked), then check nothing redirected.
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)))
    expect(screen.getByTestId("legendary-event-loading")).toBeInTheDocument()
    expect(screen.queryByTestId("hub")).toBeNull()
    expect(screen.getByTestId("current-path")).toHaveTextContent(
      /^\/events\/legendary-events\/notYetSynced$/
    )
  })

  describe("desktop (1280px)", () => {
    it("shows all three lane panels and no selector", async () => {
      renderPage("/events/legendary-events/astarLysander")
      await screen.findByTestId("legendary-event-page")

      expect(laneLabels()).toEqual(["alpha", "beta", "gamma"])
      expect(screen.queryByTestId("legendary-event-lane-selector")).toBeNull()
    })

    it("renders the leaderboard and progress sections after Lane overview, three lanes each", async () => {
      renderPage("/events/legendary-events/astarLysander")
      await screen.findAllByTestId("leaderboard-lane")

      const laneOverview = screen.getByTestId("legendary-event-lane-overview")
      const leaderboard = screen.getByTestId("legendary-event-leaderboard")
      const progress = screen.getByTestId("legendary-event-progress-grid")
      expect(
        laneOverview.compareDocumentPosition(leaderboard) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy()
      expect(
        leaderboard.compareDocumentPosition(progress) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy()
      expect(lanesOf("leaderboard-lane")).toEqual(["alpha", "beta", "gamma"])
      expect(lanesOf("progress-lane")).toEqual(["alpha", "beta", "gamma"])
      expect(screen.getAllByTestId("leaderboard-table")).toHaveLength(3)
    })

    it("applies Only unlocked to all three lanes at once", async () => {
      renderPage("/events/legendary-events/astarLysander")
      await screen.findAllByTestId("leaderboard-lane")
      expect(lockedRows().length).toBeGreaterThan(0)

      act(() => toggleOnlyUnlocked())
      expect(lockedRows()).toHaveLength(0)
      // Dante is Imperial: allowed on Alpha and Gamma, not on Beta (No Imperial).
      const lanes = screen.getAllByTestId("leaderboard-lane")
      expect(
        lanes.map(
          (lane) => within(lane).queryAllByTestId("leaderboard-row").length
        )
      ).toEqual([1, 0, 1])
    })

    it("has every desktop tour target on the page", async () => {
      renderPage("/events/legendary-events/astarLysander")
      await screen.findByTestId("legendary-event-page")

      const { desktop } = tour.steps as { desktop: { target: string }[] }
      expect(desktop.map((step) => step.target)).toEqual([
        '[data-testid="legendary-event-run-status"]',
        '[data-testid="legendary-event-lane-overview"]',
        '[data-testid="legendary-event-leaderboard"]',
        '[data-testid="legendary-event-progress-grid"]',
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

    it("renders the leaderboard and progress for the selected lane only", async () => {
      renderPage("/events/legendary-events/astarLysander")
      await screen.findAllByTestId("leaderboard-lane")

      expect(lanesOf("leaderboard-lane")).toEqual(["alpha"])
      expect(lanesOf("progress-lane")).toEqual(["alpha"])
      expect(screen.getByTestId("leaderboard-list")).toBeInTheDocument()

      act(() => selectLane("beta"))
      expect(lanesOf("leaderboard-lane")).toEqual(["beta"])
      expect(lanesOf("progress-lane")).toEqual(["beta"])
    })

    it("keeps Only unlocked across lanes and resets it on leaving the page", async () => {
      renderPage("/events/legendary-events/astarLysander")
      await screen.findAllByTestId("leaderboard-lane")

      act(() => toggleOnlyUnlocked())
      expect(lockedRows()).toHaveLength(0)
      act(() => selectLane("gamma"))
      expect(screen.getByTestId("leaderboard-only-unlocked")).toHaveAttribute(
        "aria-checked",
        "true"
      )
      expect(lockedRows()).toHaveLength(0)

      fireEvent.click(screen.getByTestId("open-uthar"))
      await screen.findByText("Uthar", { selector: "h1" })
      await screen.findAllByTestId("leaderboard-lane")
      expect(screen.getByTestId("leaderboard-only-unlocked")).toHaveAttribute(
        "aria-checked",
        "false"
      )
      expect(lockedRows().length).toBeGreaterThan(0)
    })

    it("has every mobile tour target on the page, the selector first", async () => {
      renderPage("/events/legendary-events/astarLysander")
      await screen.findByTestId("legendary-event-page")

      const { mobile } = tour.steps as { mobile: { target: string }[] }
      expect(mobile.map((step) => step.target)).toEqual([
        '[data-testid="legendary-event-lane-selector"]',
        '[data-testid="legendary-event-run-status"]',
        '[data-testid="legendary-event-lane-overview"]',
        '[data-testid="legendary-event-leaderboard"]',
        '[data-testid="legendary-event-progress-grid"]',
      ])
      for (const step of mobile) {
        expect(document.querySelector(step.target)).not.toBeNull()
      }
    })
  })
})
