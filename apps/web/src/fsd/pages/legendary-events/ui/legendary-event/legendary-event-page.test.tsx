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
// Dante owned, everyone else locked; no synced entry for any event unless a test sets one.
const player = vi.hoisted(() => ({
  roster: [
    {
      unitId: "bloodDante",
      rank: "Diamond1",
      progressionIndex: "Legendary:RedFiveStars",
    },
  ] as unknown[] | undefined,
  progress: undefined as unknown,
}))
vi.mock("@workspace/player-data/queries", () => ({
  getLegendaryEventProgress: async () => player.progress,
  getPlayerCharacters: async () => player.roster,
}))
vi.mock("@workspace/player-data", () => ({
  getPlayerDataMetadata: async () => new Map(),
  getManifestMetadata: () => undefined,
}))
const tour = vi.hoisted(() => ({ steps: undefined as unknown }))
// A synced Lysander entry with Alpha's first battle cleared, so the lane tabs render the grid.
const lysanderProgress = {
  id: "astarLysander",
  alpha: {
    encounters: [
      { objectivesCleared: [0, 2], highScore: 31, encounterPoints: 31 },
    ],
  },
  beta: { encounters: [] },
  gamma: null,
}
// Signed in, with an empty plan per event (the Teams section's own states are covered in
// teams-section.test.tsx).
vi.mock("@azure/msal-react", () => ({ useIsAuthenticated: () => true }))
vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  apiGet: async (path: string) => ({
    eventId: path.split("/").at(-1),
    revision: 0,
    catalogVersion: "1",
    notes: null,
    showPaidOptions: false,
    teams: [],
  }),
}))
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
        onClick={() => void navigate("/legendary-events/votanUthar")}
        type="button"
      >
        Uthar
      </button>
      <button
        data-testid="open-lysander"
        onClick={() => void navigate("/legendary-events/astarLysander")}
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
        <Route element={<div data-testid="hub" />} path="/legendary-events" />
        <Route
          element={<LegendaryEventPage />}
          path="/legendary-events/:eventId"
        />
      </Routes>
    </MemoryRouter>,
    { wrapper: i18nWrapper(i18n) }
  )
}

const selectTab = (tab: string) => {
  const trigger = screen.getByTestId(`legendary-event-tab-${tab}`)
  // Radix tabs activate on mousedown.
  fireEvent.mouseDown(trigger, { button: 0 })
}
const selectedTab = () =>
  within(screen.getByTestId("legendary-event-tab-list")).getByRole("tab", {
    selected: true,
  })
const lanesOf = (testId: string) =>
  screen.getAllByTestId(testId).map((element) => element.dataset.lane)
const laneLabels = () => lanesOf("legendary-event-lane-panel")
const lockedRows = () =>
  screen
    .getAllByTestId("leaderboard-row")
    .filter((row) => row.dataset.ownership === "locked")
const toggleOnlyUnlocked = () =>
  fireEvent.click(screen.getByTestId("leaderboard-only-unlocked"))
const follows = (first: HTMLElement, second: HTMLElement) =>
  Boolean(
    first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING
  )

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
    player.progress = undefined
    setViewportWidth(1280)
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-09-02T12:00:00Z"))
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it("opens a known event on Overview: name, lifecycle badge, the strip, Run status, lane summary, leaderboard", async () => {
    renderPage("/legendary-events/astarLysander")
    const page = await screen.findByTestId("legendary-event-page")

    expect(screen.getByTestId("legendary-event-title")).toHaveTextContent(
      "Lysander"
    )
    expect(screen.getByTestId("legendary-event-lifecycle")).toHaveTextContent(
      "Active"
    )
    expect(selectedTab()).toHaveTextContent("Overview")
    expect(
      within(screen.getByTestId("legendary-event-tab-list"))
        .getAllByRole("tab")
        .map((tab) => tab.textContent)
    ).toEqual(["Overview", "Alpha", "Beta", "Gamma"])
    const tabs = screen.getByTestId("legendary-event-tabs")
    const runStatus = screen.getByTestId("legendary-event-run-status")
    const summary = screen.getByTestId("legendary-event-lane-summary")
    const leaderboard = await screen.findByTestId(
      "legendary-event-overview-leaderboard"
    )
    expect(page).toContainElement(runStatus)
    expect(follows(tabs, runStatus)).toBe(true)
    expect(follows(runStatus, summary)).toBe(true)
    expect(follows(summary, leaderboard)).toBe(true)
    // No lane section renders on Overview.
    expect(screen.queryByTestId("legendary-event-lane-overview")).toBeNull()
    expect(screen.queryByTestId("legendary-event-progress-grid")).toBeNull()
    // No synced entry for this event in this test's chunk.
    expect(screen.getByTestId("run-status-no-entry")).toBeInTheDocument()
  })

  it("replaces an unknown event id with the hub", async () => {
    renderPage("/legendary-events/notAnEvent")

    expect(await screen.findByTestId("hub")).toBeInTheDocument()
    expect(screen.getByTestId("current-path")).toHaveTextContent(
      /^\/legendary-events$/
    )
  })

  it("keeps loading a deep link until the catalog has synced", async () => {
    catalog.synced = false
    renderPage("/legendary-events/notYetSynced")

    // Let every read resolve (only Date is faked), then check nothing redirected.
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)))
    expect(screen.getByTestId("legendary-event-loading")).toBeInTheDocument()
    expect(screen.queryByTestId("hub")).toBeNull()
    expect(screen.getByTestId("current-path")).toHaveTextContent(
      /^\/legendary-events\/notYetSynced$/
    )
  })

  it("shows one lane per tab in the order overview, teams, progress grid, leaderboard", async () => {
    renderPage("/legendary-events/astarLysander")
    await screen.findByTestId("legendary-event-overview-leaderboard")

    act(() => selectTab("beta"))
    expect(selectedTab()).toHaveTextContent("Beta")
    expect(laneLabels()).toEqual(["beta"])
    const overview = screen.getByTestId("legendary-event-lane-overview")
    const teams = screen.getByTestId("legendary-event-teams")
    const grid = screen.getByTestId("legendary-event-progress-grid")
    const leaderboard = await screen.findByTestId("legendary-event-leaderboard")
    expect(teams).toHaveAttribute("data-lane", "beta")
    expect(
      await screen.findByTestId("legendary-event-teams-empty")
    ).toHaveTextContent("No teams on Beta yet.")
    expect(follows(overview, teams)).toBe(true)
    expect(follows(teams, grid)).toBe(true)
    expect(follows(grid, leaderboard)).toBe(true)
    expect(lanesOf("progress-lane")).toEqual(["beta"])
    expect(lanesOf("leaderboard-lane")).toEqual(["beta"])
    expect(screen.getAllByTestId("leaderboard-table")).toHaveLength(1)
    expect(screen.queryByTestId("legendary-event-lane-summary")).toBeNull()
  })

  it("resets the tab to Overview on another event", async () => {
    renderPage("/legendary-events/astarLysander")
    await screen.findByTestId("legendary-event-page")

    act(() => selectTab("gamma"))
    expect(laneLabels()).toEqual(["gamma"])

    fireEvent.click(screen.getByTestId("open-uthar"))
    await screen.findByText("Uthar", { selector: "h1" })
    expect(selectedTab()).toHaveTextContent("Overview")
    expect(screen.queryByTestId("legendary-event-lane-panel")).toBeNull()

    // Back on Lysander, the earlier Gamma choice does not come back either.
    fireEvent.click(screen.getByTestId("open-lysander"))
    await screen.findByText("Lysander", { selector: "h1" })
    expect(selectedTab()).toHaveTextContent("Overview")
  })

  it("jumps from a lane summary row to that lane's progress grid heading", async () => {
    // The setup file stubs scrollIntoView on HTMLElement.prototype, which shadows Element's.
    const scrollIntoView = vi
      .spyOn(HTMLElement.prototype, "scrollIntoView")
      .mockImplementation(() => {})
    renderPage("/legendary-events/astarLysander")
    await screen.findByTestId("legendary-event-overview-leaderboard")

    const betaRow = screen
      .getAllByTestId("lane-summary-row")
      .find((row) => row.dataset.lane === "beta")!
    act(() => fireEvent.click(betaRow))
    expect(selectedTab()).toHaveTextContent("Beta")
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    expect(scrollIntoView.mock.instances[0]).toBe(
      document.getElementById("legendary-event-progress-beta")
    )
    scrollIntoView.mockRestore()
  })

  it("keeps Only unlocked, Deduct scored points and the objective filter across tabs, resetting them on leaving", async () => {
    renderPage("/legendary-events/astarLysander")
    await screen.findByTestId("legendary-event-overview-leaderboard")
    expect(lockedRows().length).toBeGreaterThan(0)
    expect(screen.getByTestId("leaderboard-deduct-scored")).toHaveAttribute(
      "aria-checked",
      "true"
    )

    act(() => toggleOnlyUnlocked())
    act(() => fireEvent.click(screen.getByTestId("leaderboard-deduct-scored")))
    expect(lockedRows()).toHaveLength(0)

    act(() => selectTab("alpha"))
    await screen.findByTestId("legendary-event-leaderboard")
    expect(screen.getByTestId("leaderboard-only-unlocked")).toHaveAttribute(
      "aria-checked",
      "true"
    )
    expect(screen.getByTestId("leaderboard-deduct-scored")).toHaveAttribute(
      "aria-checked",
      "false"
    )
    // Dante is Imperial and owned: the one row on Alpha, per battle.
    expect(lockedRows()).toHaveLength(0)
    expect(screen.getAllByTestId("leaderboard-row")).toHaveLength(1)
    expect(screen.getByTestId("leaderboard-points")).toHaveTextContent("152")

    fireEvent.click(screen.getByTestId("open-uthar"))
    await screen.findByText("Uthar", { selector: "h1" })
    await screen.findByTestId("legendary-event-overview-leaderboard")
    expect(screen.getByTestId("leaderboard-only-unlocked")).toHaveAttribute(
      "aria-checked",
      "false"
    )
    expect(screen.getByTestId("leaderboard-deduct-scored")).toHaveAttribute(
      "aria-checked",
      "true"
    )
    expect(lockedRows().length).toBeGreaterThan(0)
  })

  it("registers the same tour on both forms, lane steps after the tab switch", async () => {
    renderPage("/legendary-events/astarLysander")
    await screen.findByTestId("legendary-event-overview-leaderboard")

    const { desktop, mobile } = tour.steps as {
      desktop: { target: string; before?: () => Promise<void> }[]
      mobile: { target: string }[]
    }
    expect(mobile).toBe(desktop)
    expect(desktop.map((step) => step.target)).toEqual([
      '[data-testid="legendary-event-tabs"]',
      '[data-testid="legendary-event-run-status"]',
      '[data-testid="legendary-event-lane-summary"]',
      '[data-testid="legendary-event-overview-leaderboard"]',
      '[data-testid="legendary-event-lane-overview"]',
      '[data-testid="legendary-event-teams"]',
      '[data-testid="legendary-event-progress-grid"]',
      '[data-testid="legendary-event-leaderboard"]',
    ])
    for (const step of desktop.slice(0, 4)) {
      expect(document.querySelector(step.target)).not.toBeNull()
    }
    // `before` resolves only once the lane section is in the document, which an `act` scope
    // would withhold until it resolves, so it runs as Joyride runs it: outside act.
    const actGlobal = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    const actEnvironment = actGlobal.IS_REACT_ACT_ENVIRONMENT
    actGlobal.IS_REACT_ACT_ENVIRONMENT = false
    try {
      await desktop[4]!.before!()
    } finally {
      actGlobal.IS_REACT_ACT_ENVIRONMENT = actEnvironment
    }
    expect(selectedTab()).toHaveTextContent("Alpha")
    for (const step of desktop.slice(4)) {
      expect(document.querySelector(step.target)).not.toBeNull()
    }
  })

  describe("desktop (1280px)", () => {
    it("renders a static strip, the cross-lane table and the lane table", async () => {
      player.progress = lysanderProgress
      renderPage("/legendary-events/astarLysander")
      await screen.findByTestId("legendary-event-overview-leaderboard")

      expect(screen.getByTestId("legendary-event-tabs")).not.toHaveAttribute(
        "data-sticky"
      )
      expect(screen.getByTestId("cross-lane-table")).toBeInTheDocument()
      act(() => selectTab("alpha"))
      expect(await screen.findByTestId("leaderboard-table")).toBeInTheDocument()
      expect(screen.getByTestId("progress-grid")).toBeInTheDocument()
    })
  })

  describe("mobile (390px)", () => {
    beforeEach(() => setViewportWidth(390))

    it("renders the strip sticky under the header, row cards and compact rows", async () => {
      player.progress = lysanderProgress
      renderPage("/legendary-events/astarLysander")
      await screen.findByTestId("legendary-event-overview-leaderboard")

      const strip = screen.getByTestId("legendary-event-tabs")
      expect(strip).toHaveAttribute("data-sticky", "true")
      expect(strip).toHaveClass("sticky", "top-(--mobile-header-height)")
      expect(screen.getByTestId("cross-lane-list")).toBeInTheDocument()

      act(() => selectTab("alpha"))
      expect(await screen.findByTestId("leaderboard-list")).toBeInTheDocument()
      expect(screen.getByTestId("progress-rows")).toBeInTheDocument()
      expect(screen.queryByTestId("leaderboard-table")).toBeNull()
    })
  })
})
