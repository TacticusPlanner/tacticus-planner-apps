import { useSyncExternalStore } from "react"
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

import { catalogManifestMetadataKey } from "@workspace/game-catalog"
import { replaceGameCatalogDataset } from "@workspace/game-catalog/testing"

import { CreateGoalLauncherContext } from "@/entities/goal"
import { safeStorage } from "@/shared/lib"
import { setTestAuth } from "@/test/auth"
import { spyOnIndexedDbReads } from "@/test/fixtures/indexeddb-failure"
import { legendaryEventCharacters } from "@/test/fixtures/legendary-event-characters"
import {
  utharRun1Record,
  utharRun1Snapshot,
} from "@/test/fixtures/legendary-event-run-records"
import { lysanderEvent, utharEvent } from "@/test/fixtures/legendary-events"
import {
  lysanderBattleNpcs,
  lysanderBattles,
} from "@/test/fixtures/lysander-battles"
import { createTestI18n, i18nWrapper } from "@/test/i18n"
import { act, fireEvent, render, screen, within } from "@/test/render"
import {
  resetTestDatabases,
  seedGameCatalog,
  seedPlayerData,
} from "@/test/seed"
import { setViewportWidth } from "@/test/viewport"

import { LegendaryEventPage } from "./legendary-event-page"

const events = [
  lysanderEvent,
  utharEvent,
  {
    ...lysanderEvent,
    id: "archivedLysander",
    eventStageStartDatesUtc: [
      "2025-05-04T00:00:00Z",
      "2025-09-07T00:00:00Z",
      "2026-01-01T00:00:00Z",
    ],
  },
]
const tour = vi.hoisted(() => ({ steps: undefined as unknown }))
// Dante owned, everyone else locked; no synced entry for any event unless a test seeds one.
const roster = [
  {
    unitId: "bloodDante",
    rank: "Diamond1",
    progressionIndex: "Legendary:RedFiveStars",
  },
]
/** Seeds the catalog the page reads: the events (unless `lres` is false), every character, the
 *  battles' enemies, and the served `lre-battles` (none unless given). With the events it also
 *  completes the first sync, without a served `unit-power` dataset (no clear estimate shows). */
async function seedCatalog({
  lres = true,
  battles = [] as unknown[],
}: { lres?: boolean; battles?: unknown[] } = {}) {
  await seedGameCatalog({
    ...(lres ? { lres: events } : {}),
    characters: legendaryEventCharacters,
    npcs: lysanderBattleNpcs,
    "lre-battles": battles,
  })
  if (!lres) return
  // A real sync writes the manifest row last; the dataset writer stores whichever row it is handed.
  await replaceGameCatalogDataset("unit-power", [], {
    key: catalogManifestMetadataKey,
    hash: "manifest-test",
    catalogVersion: "test",
    gameVersion: "test",
    schemaHash: "test",
    updatedAt: "2026-01-01T00:00:00Z",
  })
}
const seedProgress = (progress: unknown) =>
  seedPlayerData({ "lre-progress": [progress] })
// While held, the battles read reports loading: a real IndexedDB read cannot be paused.
const battlesHold = vi.hoisted(() => {
  let held = false
  const listeners = new Set<() => void>()
  return {
    held: () => held,
    set(value: boolean) {
      held = value
      listeners.forEach((listener) => listener())
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
})
vi.mock("@/entities/legendary-event", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/entities/legendary-event")>()
  return {
    ...actual,
    useLegendaryEventBattles: (eventId: string) => {
      const held = useSyncExternalStore(battlesHold.subscribe, battlesHold.held)
      const read = actual.useLegendaryEventBattles(eventId)
      return held ? { status: "loading" as const, retry: read.retry } : read
    },
  }
})
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
// The goal list is empty unless a test sets Active goals (summaries and details by goal id).
const goals = vi.hoisted(() => ({
  summaries: [] as unknown[],
  details: new Map<string, unknown>(),
}))
const launchCreateGoal = vi.hoisted(() => vi.fn())
const planApi = vi.hoisted(() => ({
  teams: [] as unknown[],
  put: vi.fn(),
}))
// The event's run records (newest first); `failRecords` makes the read fail.
const history = vi.hoisted(() => ({
  records: [] as unknown[],
  failRecords: false,
}))
const analytics = vi.hoisted(() => ({ capture: vi.fn() }))
vi.mock("@/shared/analytics", () => ({
  useAnalyticsActions: () => ({ captureEvent: analytics.capture }),
}))
vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  apiClient: (await import("@/test/fake-api-client")).fakeApiClient(
    ({ method, path, params, body }) => {
      const eventId = params?.path?.eventId ?? ""
      switch (path) {
        case "/api/v1/goals":
          return { goals: goals.summaries, orderRevision: 0 }
        case "/api/v1/goals/{goalId}":
          return goals.details.get(params?.path?.goalId ?? "")
        case "/api/v1/legendary-event-plans/{eventId}/run-records":
          if (history.failRecords) throw new Error("run records unavailable")
          return { eventId, records: history.records, nextAfter: null }
        case "/api/v1/legendary-event-plans/{eventId}/run-records/{recordId}/roster":
          return utharRun1Snapshot
      }
      if (method === "PUT") return planApi.put({ path, params, body })
      return {
        eventId,
        revision: 0,
        catalogVersion: "1",
        notes: null,
        showPaidOptions: false,
        teams: planApi.teams,
        runs: [],
        annotations: [],
      }
    }
  ),
}))
// An Active Unlock goal for Cyrus, an Alpha unit the roster does not own.
function giveCyrusUnlockGoal() {
  goals.summaries = [
    {
      goalId: "goal-cyrus",
      entityId: "astarCyrus",
      entityType: "Character",
      goalType: "Unlock",
      status: "Active",
      globalPriority: 1,
    },
  ]
  goals.details.set("goal-cyrus", {
    goalId: "goal-cyrus",
    entityId: "astarCyrus",
    entityType: "Character",
    goalType: "Unlock",
    status: "Active",
    config: { rank: null, progression: null, ability: null },
  })
}
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => {
    tour.steps = steps
  },
}))

let i18n: I18n
let reads: ReturnType<typeof spyOnIndexedDbReads>

function Controls() {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  return (
    <>
      <span data-testid="current-path">{pathname}</span>
      <span data-testid="current-search">{search}</span>
      <button
        data-testid="back"
        onClick={() => void navigate(-1)}
        type="button"
      >
        Back
      </button>
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
          path="/legendary-events/:eventId/:tab?"
        />
      </Routes>
    </MemoryRouter>,
    {
      wrapper: ({ children }) => {
        const I18nWrapper = i18nWrapper(i18n)
        return (
          <CreateGoalLauncherContext.Provider value={launchCreateGoal}>
            <I18nWrapper>{children}</I18nWrapper>
          </CreateGoalLauncherContext.Provider>
        )
      },
    }
  )
}

const selectTab = (tab: string) => {
  const trigger = screen.getByTestId(`legendary-event-tab-${tab}`)
  // Radix tabs activate on mousedown.
  fireEvent.mouseDown(trigger, { button: 0 })
}
// Mobile's lane picker.
const pickLane = (lane: string) => {
  fireEvent.click(screen.getByTestId(`legendary-event-lane-pick-${lane}`))
}
// Desktop's lane toggles.
const laneSwitch = (lane: string) =>
  screen
    .getAllByTestId("legendary-event-lane-switch")
    .find((element) => element.dataset.lane === lane)!
const switchLane = (lane: string) => fireEvent.click(laneSwitch(lane))
// Each switch is its own act: a toggle reads the selection the previous one left.
const showOnlyLane = (lane: string) => {
  if (laneSwitch(lane).getAttribute("aria-pressed") !== "true") switchLane(lane)
  for (const other of ["alpha", "beta", "gamma"]) {
    if (
      other !== lane &&
      laneSwitch(other).getAttribute("aria-pressed") === "true"
    )
      switchLane(other)
  }
}
// Plan's Battles lane dropdown.
const pickBattlesLane = (lane: string) => {
  fireEvent.click(screen.getByTestId("battles-lane-select"))
  fireEvent.click(
    screen.getByRole("option", {
      name: lane.charAt(0).toUpperCase() + lane.slice(1),
    })
  )
}
const selectedTab = () =>
  within(screen.getByTestId("legendary-event-tab-list")).getByRole("tab", {
    selected: true,
  })
const pickedLane = () =>
  within(screen.getByTestId("legendary-event-lane-picker")).getByRole("radio", {
    checked: true,
  })
// The Overview's lane summary renders once the event has loaded.
const overviewReady = () => screen.findAllByTestId("lane-summary-row")
// The run tab (an active event's default) shows its progress grid once the event has loaded.
const runReady = () => screen.findAllByTestId("progress-lane")
const lanesOf = (testId: string) =>
  screen.getAllByTestId(testId).map((element) => element.dataset.lane)
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

// Whole-page renders (three lanes of progress grid, each not-cleared cell a mark menu) run close to
// the 5s default under coverage instrumentation in CI.
describe("LegendaryEventPage", { timeout: 15_000 }, () => {
  beforeAll(async () => {
    i18n = await createTestI18n("en")
  })
  beforeEach(async () => {
    await seedCatalog()
    await seedPlayerData({ characters: roster })
    reads = spyOnIndexedDbReads()
    battlesHold.set(false)
    safeStorage.remove("legendaryEvents.eventBoard.lanes")
    // Signed in, with an empty plan per event.
    setTestAuth({ authenticated: true })
    goals.summaries = []
    goals.details.clear()
    launchCreateGoal.mockReset()
    planApi.teams = []
    planApi.put.mockReset()
    history.records = []
    history.failRecords = false
    analytics.capture.mockReset()
    setViewportWidth(1280)
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-09-02T12:00:00Z"))
  })
  afterEach(() => {
    reads.restore()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it("opens an active event on Current run: name, lifecycle badge, the strip, Run status, progress grid", async () => {
    renderPage("/legendary-events/astarLysander")
    const page = await screen.findByTestId("legendary-event-page")

    expect(screen.getByTestId("legendary-event-title")).toHaveTextContent(
      "Lysander"
    )
    expect(screen.getByTestId("legendary-event-lifecycle")).toHaveTextContent(
      "Active"
    )
    // The run timing sits in the header, so it shows on every tab.
    expect(screen.getByTestId("event-timing-countdown")).toHaveTextContent(
      /^Ends in /
    )
    expect(selectedTab()).toHaveTextContent("Current run")
    expect(
      within(screen.getByTestId("legendary-event-tab-list"))
        .getAllByRole("tab")
        .map((tab) => tab.textContent)
    ).toEqual(["Overview", "Teams", "Plan", "Current run"])
    await runReady()
    const tabs = screen.getByTestId("legendary-event-tabs")
    const runStatus = screen.getByTestId("legendary-event-run-status")
    const grid = screen.getByTestId("legendary-event-progress-grid")
    expect(page).toContainElement(runStatus)
    const disclaimer = screen.getByTestId(
      "legendary-event-estimates-disclaimer"
    )
    expect(disclaimer).toHaveTextContent(/raw power/i)
    expect(follows(tabs, disclaimer)).toBe(true)
    expect(follows(disclaimer, runStatus)).toBe(true)
    expect(follows(runStatus, grid)).toBe(true)
    expect(lanesOf("progress-lane")).toEqual(["alpha", "beta", "gamma"])
    // The other tabs' sections do not render on the run tab.
    expect(screen.queryByTestId("legendary-event-lane-summary")).toBeNull()
    expect(screen.queryByTestId("legendary-event-board")).toBeNull()
    expect(screen.queryByTestId("legendary-event-token-plan")).toBeNull()
    expect(screen.queryByTestId("legendary-event-battles")).toBeNull()
    // No synced entry for this event in this test's chunk.
    expect(screen.getByTestId("run-status-no-entry")).toBeInTheDocument()
  })

  it("opens an upcoming event on Overview, with the lane summary and a Next run tab", async () => {
    renderPage("/legendary-events/votanUthar")
    await overviewReady()

    expect(selectedTab()).toHaveTextContent("Overview")
    expect(screen.getByTestId("legendary-event-tab-run")).toHaveTextContent(
      "Next run"
    )
    expect(
      screen.getByTestId("legendary-event-lane-summary")
    ).toBeInTheDocument()
    // Overview repeats the Run status card, with a jump to the next run.
    expect(screen.getByTestId("legendary-event-run-status")).toBeInTheDocument()
    expect(screen.getByTestId("run-status-go-to-run")).toHaveTextContent(
      "Go to next run"
    )
  })

  it("replaces an unknown event id with the hub", async () => {
    renderPage("/legendary-events/notAnEvent")

    expect(await screen.findByTestId("hub")).toBeInTheDocument()
    expect(screen.getByTestId("current-path")).toHaveTextContent(
      /^\/legendary-events$/
    )
  })

  it("keeps loading a deep link until the catalog has synced", async () => {
    // No `lres` dataset has synced yet.
    await resetTestDatabases()
    await seedCatalog({ lres: false })
    renderPage("/legendary-events/notYetSynced")

    // Let every read resolve (only Date is faked), then check nothing redirected.
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)))
    expect(screen.getByTestId("legendary-event-loading")).toBeInTheDocument()
    expect(screen.queryByTestId("hub")).toBeNull()
    expect(screen.getByTestId("current-path")).toHaveTextContent(
      /^\/legendary-events\/notYetSynced$/
    )
  })

  it("shows the Event board on Teams, each lane with its figures and Teams section, then one leaderboard", async () => {
    renderPage("/legendary-events/astarLysander")
    await runReady()

    act(() => selectTab("teams"))
    const board = await screen.findByTestId("legendary-event-board")
    expect(lanesOf("event-board-lane")).toEqual(["alpha", "beta", "gamma"])
    expect(lanesOf("legendary-event-lane-figures")).toEqual([
      "alpha",
      "beta",
      "gamma",
    ])
    expect(lanesOf("legendary-event-teams")).toEqual(["alpha", "beta", "gamma"])
    expect(
      await screen.findAllByTestId("legendary-event-teams-empty")
    ).toHaveLength(3)
    const crossLane = await screen.findByTestId(
      "legendary-event-overview-leaderboard"
    )
    expect(follows(board, crossLane)).toBe(true)
    expect(screen.queryByTestId("legendary-event-lane-summary")).toBeNull()

    // Two lanes still compare across lanes; one lane shows its own leaderboard.
    switchLane("gamma")
    expect(lanesOf("event-board-lane")).toEqual(["alpha", "beta"])
    expect(
      screen.getByTestId("legendary-event-overview-leaderboard")
    ).toBeInTheDocument()
    switchLane("alpha")
    expect(lanesOf("event-board-lane")).toEqual(["beta"])
    await screen.findByTestId("legendary-event-leaderboard")
    expect(lanesOf("leaderboard-lane")).toEqual(["beta"])
    expect(
      screen.queryByTestId("legendary-event-overview-leaderboard")
    ).toBeNull()
    // The last shown lane cannot be switched off.
    switchLane("beta")
    expect(lanesOf("event-board-lane")).toEqual(["beta"])
    expect(laneSwitch("beta")).toHaveAttribute("aria-pressed", "true")
  })

  it("shows Plan's Run forecast, every lane's Upgrade impact (the Token plan, empty here, between), then one lane's Battles", async () => {
    renderPage("/legendary-events/astarLysander")
    await runReady()
    showOnlyLane("beta")

    act(() => selectTab("plan"))
    expect(screen.getByTestId("legendary-event-plan-tab")).toBeInTheDocument()
    // Plan has no lane toggles: Battles picks its lane in the battle row.
    expect(screen.queryByTestId("legendary-event-lane-switches")).toBeNull()
    expect(lanesOf("legendary-event-battles-section")).toEqual(["alpha"])
    expect(
      screen.getAllByTestId("legendary-event-battles").map((h) => h.textContent)
    ).toEqual(["Battles"])
    const impacts = await screen.findAllByTestId(
      "legendary-event-upgrade-impact-section"
    )
    expect(impacts.map((section) => section.dataset.lane)).toEqual([
      "alpha",
      "beta",
      "gamma",
    ])
    expect(
      follows(screen.getByTestId("legendary-event-run-forecast"), impacts[0]!)
    ).toBe(true)
    expect(
      follows(impacts[2]!, screen.getAllByTestId("legendary-event-battles")[0]!)
    ).toBe(true)
    // No served battle in this test's catalog.
    expect(await screen.findAllByTestId("battles-empty")).toHaveLength(1)

    pickBattlesLane("gamma")
    expect(lanesOf("legendary-event-battles-section")).toEqual(["gamma"])
    expect(screen.queryByTestId("legendary-event-next-token")).toBeNull()
  })

  it("keeps the shown lanes across tabs and page views", async () => {
    const view = renderPage("/legendary-events/astarLysander")
    await runReady()
    switchLane("beta")
    expect(lanesOf("progress-lane")).toEqual(["alpha", "gamma"])

    act(() => selectTab("teams"))
    expect(lanesOf("event-board-lane")).toEqual(["alpha", "gamma"])
    view.unmount()

    renderPage("/legendary-events/astarLysander")
    await runReady()
    expect(lanesOf("progress-lane")).toEqual(["alpha", "gamma"])
  })

  // Three full page renders, each with the Stage 6 goal reads; under coverage instrumentation in CI
  // this exceeds the suite's 15s.
  it("resets the tab to the event's default on another event", async () => {
    renderPage("/legendary-events/astarLysander")
    await screen.findByTestId("legendary-event-page")
    act(() => selectTab("plan"))

    fireEvent.click(screen.getByTestId("open-uthar"))
    await screen.findByText("Ûthar", { selector: "h1" })
    expect(selectedTab()).toHaveTextContent("Overview")

    fireEvent.click(screen.getByTestId("open-lysander"))
    await screen.findByText("Lysander", { selector: "h1" })
    expect(selectedTab()).toHaveTextContent("Current run")
  }, 30_000)

  describe("tab path segment", () => {
    const currentPath = () => screen.getByTestId("current-path")

    it("writes the selected tab to the path so a reload keeps it", async () => {
      renderPage("/legendary-events/astarLysander")
      await runReady()

      act(() => selectTab("teams"))
      expect(currentPath()).toHaveTextContent(
        /^\/legendary-events\/astarLysander\/teams$/
      )
      act(() => selectTab("plan"))
      expect(currentPath()).toHaveTextContent(
        /^\/legendary-events\/astarLysander\/plan$/
      )
      act(() => selectTab("run"))
      expect(currentPath()).toHaveTextContent(
        /^\/legendary-events\/astarLysander\/run$/
      )
    })

    it("restores the tab from the path on reload", async () => {
      renderPage("/legendary-events/astarLysander/plan")
      await screen.findByTestId("legendary-event-page")

      expect(selectedTab()).toHaveTextContent("Plan")
    })

    it("keeps the query string when switching tabs", async () => {
      renderPage("/legendary-events/astarLysander?keep=1")
      await runReady()

      act(() => selectTab("teams"))
      expect(screen.getByTestId("current-search")).toHaveTextContent(
        /^\?keep=1$/
      )
    })

    it("shows the default tab on an unknown segment", async () => {
      renderPage("/legendary-events/astarLysander/delta")
      await screen.findByTestId("legendary-event-page")

      expect(selectedTab()).toHaveTextContent("Current run")
    })

    it("adds no history entry when switching tabs", async () => {
      renderPage("/legendary-events/astarLysander")
      await runReady()

      act(() => selectTab("teams"))
      act(() => selectTab("plan"))
      act(() => {
        fireEvent.click(screen.getByTestId("back"))
      })

      expect(await screen.findByTestId("home")).toBeInTheDocument()
    })
  })

  describe("battles", () => {
    const sectionOf = (lane: string) =>
      within(
        screen
          .getAllByTestId("legendary-event-battles-section")
          .find((section) => section.dataset.lane === lane)!
      )
    const battleTitle = (lane: string) =>
      sectionOf(lane).getByTestId("battle-title").textContent
    const pickBattle = (lane: string, number: number) =>
      fireEvent.click(
        sectionOf(lane).getAllByTestId("battle-selector-item")[number - 1]!
      )

    it("keeps each lane's battle selection while the lane is switched, starting on battle 1 without progress", async () => {
      await seedCatalog({ battles: lysanderBattles })
      renderPage("/legendary-events/astarLysander")
      await runReady()

      act(() => selectTab("plan"))
      await screen.findByTestId("battle-preview")
      expect(battleTitle("alpha")).toBe("Battle 1")
      expect(
        sectionOf("alpha").getAllByTestId("battle-selector-item")
      ).toHaveLength(18)
      expect(sectionOf("alpha").getByTestId("battle-power")).toHaveTextContent(
        "994"
      )
      expect(
        sectionOf("alpha").getByTestId("battle-map-image")
      ).toHaveAttribute("alt", "Map of Alpha battle 1")
      act(() => {
        pickBattle("alpha", 12)
      })
      expect(battleTitle("alpha")).toBe("Battle 12")

      pickBattlesLane("beta")
      expect(battleTitle("beta")).toBe("Battle 1")
      act(() => {
        pickBattle("beta", 3)
      })

      pickBattlesLane("alpha")
      expect(battleTitle("alpha")).toBe("Battle 12")
      pickBattlesLane("beta")
      expect(battleTitle("beta")).toBe("Battle 3")
    })

    it("shows a skeleton and no selector while the battles read is pending", async () => {
      battlesHold.set(true)
      renderPage("/legendary-events/astarLysander")
      await runReady()

      act(() => selectTab("plan"))
      expect(screen.getAllByTestId("battles-loading")).toHaveLength(1)
      expect(screen.getByTestId("battles-lane-select")).toBeInTheDocument()
      expect(screen.queryByTestId("battle-selector")).toBeNull()
    })

    it("shows an error with Retry that re-runs the read, keeping the lane dropdown", async () => {
      reads.fail("lre-battles")
      renderPage("/legendary-events/astarLysander")
      await runReady()

      act(() => selectTab("plan"))
      const error = await screen.findByTestId("battles-error")
      expect(screen.getByTestId("battles-lane-select")).toBeInTheDocument()

      // Served while the read still fails: only Retry reads them.
      await seedCatalog({ battles: lysanderBattles })
      expect(screen.getByTestId("battles-error")).toBeInTheDocument()
      reads.fail(false)
      fireEvent.click(within(error).getByRole("button", { name: "Retry" }))
      await screen.findByTestId("battle-preview")
      expect(battleTitle("alpha")).toBe("Battle 1")
    })
  })

  it("opens a board lane's battle count in the battle info dialog at its first open battle", async () => {
    renderPage("/legendary-events/astarLysander")
    await runReady()
    act(() => selectTab("teams"))

    const betaBattles = screen
      .getAllByTestId("legendary-event-lane-battles")
      .find((link) => link.closest("[data-lane='beta']"))!
    act(() => {
      fireEvent.click(betaBattles)
    })
    // With no synced progress the first battle not fully cleared is Beta's first.
    const dialog = await screen.findByTestId("battle-info-dialog")
    expect(within(dialog).getByRole("heading")).toHaveTextContent(
      "Beta · Battle 1"
    )
    // The dialog opens over Teams rather than switching to Plan.
    expect(screen.getByTestId("legendary-event-tab-teams")).toHaveAttribute(
      "aria-selected",
      "true"
    )
  })

  it("jumps from a lane summary row to the run tab with that lane shown, at its grid heading", async () => {
    // The setup file stubs scrollIntoView on HTMLElement.prototype, which shadows Element's.
    const scrollIntoView = vi
      .spyOn(HTMLElement.prototype, "scrollIntoView")
      .mockImplementation(() => {})
    renderPage("/legendary-events/astarLysander")
    await runReady()
    switchLane("beta")
    act(() => selectTab("overview"))
    await overviewReady()

    const betaRow = screen
      .getAllByTestId("lane-summary-row")
      .find((row) => row.dataset.lane === "beta")!
    act(() => {
      fireEvent.click(betaRow)
    })
    expect(selectedTab()).toHaveTextContent("Current run")
    expect(lanesOf("progress-lane")).toEqual(["alpha", "beta", "gamma"])
    // Earlier tests' open selects can still scroll their options, so only headings count here.
    const headings = scrollIntoView.mock.instances.filter(
      (element) => (element as HTMLElement).tagName === "H3"
    )
    expect(headings).toEqual([
      document.getElementById("legendary-event-progress-beta"),
    ])
    scrollIntoView.mockRestore()
  })

  it("keeps Only unlocked, Deduct scored points and the objective filter across lane selections, resetting them on leaving", async () => {
    renderPage("/legendary-events/astarLysander")
    await runReady()
    act(() => selectTab("teams"))
    await screen.findByTestId("legendary-event-overview-leaderboard")
    expect(lockedRows().length).toBeGreaterThan(0)
    expect(screen.getByTestId("leaderboard-deduct-scored")).toHaveAttribute(
      "aria-checked",
      "true"
    )

    act(() => {
      toggleOnlyUnlocked()
    })
    act(() => {
      fireEvent.click(screen.getByTestId("leaderboard-deduct-scored"))
    })
    expect(lockedRows()).toHaveLength(0)

    showOnlyLane("alpha")
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
    await screen.findByText("Ûthar", { selector: "h1" })
    await overviewReady()
    act(() => selectTab("teams"))
    await screen.findByTestId("legendary-event-leaderboard")
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

  // Two full page renders with goal reads; slow under coverage instrumentation in CI.
  it("previews goal targets on the leaderboards, shared across lane selections and reset on leaving", async () => {
    giveCyrusUnlockGoal()
    renderPage("/legendary-events/astarLysander")
    await runReady()
    act(() => selectTab("teams"))
    const previewSwitch = await screen.findByTestId("leaderboard-goals-preview")
    await vi.waitFor(() => expect(previewSwitch).toBeEnabled())
    act(() => {
      toggleOnlyUnlocked()
    })
    showOnlyLane("alpha")
    await screen.findByTestId("legendary-event-leaderboard")
    expect(screen.getAllByTestId("leaderboard-row")).toHaveLength(1)

    act(() => {
      fireEvent.click(screen.getByTestId("leaderboard-goals-preview"))
    })
    // Cyrus's Unlock goal makes him owned in the preview, so Only unlocked keeps his row.
    const rows = screen.getAllByTestId("leaderboard-row")
    expect(rows).toHaveLength(2)
    expect(screen.getAllByTestId("leaderboard-preview-marker")).toHaveLength(1)

    switchLane("beta")
    await screen.findByTestId("legendary-event-overview-leaderboard")
    expect(screen.getByTestId("leaderboard-goals-preview")).toHaveAttribute(
      "aria-checked",
      "true"
    )

    fireEvent.click(screen.getByTestId("open-uthar"))
    await screen.findByText("Ûthar", { selector: "h1" })
    await overviewReady()
    act(() => selectTab("teams"))
    await screen.findByTestId("legendary-event-overview-leaderboard")
    expect(screen.getByTestId("leaderboard-goals-preview")).toHaveAttribute(
      "aria-checked",
      "false"
    )
  }, 30_000)

  it("launches goal creation from a leaderboard row with the unit prefilled", async () => {
    renderPage("/legendary-events/astarLysander")
    await runReady()
    act(() => selectTab("teams"))
    await screen.findByTestId("legendary-event-overview-leaderboard")
    act(() => {
      toggleOnlyUnlocked()
    })
    showOnlyLane("alpha")
    await screen.findByTestId("legendary-event-leaderboard")

    const menu = screen.getByTestId("leaderboard-row-menu")
    fireEvent.pointerDown(menu, { button: 0, ctrlKey: false })
    fireEvent.click(await screen.findByTestId("leaderboard-create-goal"))
    expect(launchCreateGoal).toHaveBeenCalledWith({
      entityType: "Character",
      entityId: "bloodDante",
    })
  })

  describe("Add to new team (design D4: one editor for the page)", () => {
    const openDanteMenu = async () => {
      const dante = screen
        .getAllByTestId("leaderboard-row")
        .find((row) => row.dataset.unit === "bloodDante")!
      fireEvent.pointerDown(within(dante).getByTestId("leaderboard-row-menu"), {
        button: 0,
        ctrlKey: false,
      })
      await screen.findByTestId("leaderboard-create-goal")
    }
    const editorMembers = () =>
      within(screen.getByTestId("team-editor"))
        .getAllByTestId("team-picker-tile")
        .filter((element) => element.dataset.selected === "true")
        .map((element) => element.dataset.unit)

    it("opens the editor from the cross-lane leaderboard on the chosen lane", async () => {
      renderPage("/legendary-events/astarLysander")
      await runReady()
      act(() => selectTab("teams"))
      await screen.findByTestId("legendary-event-overview-leaderboard")
      await openDanteMenu()
      const items = await screen.findAllByTestId("leaderboard-add-to-team")
      expect(items.map((item) => item.textContent)).toEqual([
        "Add to new team on Alpha",
        "Add to new team on Gamma",
      ])
      fireEvent.click(items[1]!)

      const editor = await screen.findByTestId("team-editor")
      expect(
        within(editor).getByRole("heading", { level: 2 })
      ).toHaveTextContent("Add a team to Gamma")
      expect(editorMembers()).toEqual(["bloodDante"])
      expect(
        screen.getByTestId("legendary-event-teams-tab")
      ).toBeInTheDocument()
    })

    it("opens the editor from a lane leaderboard covering the unit's objectives", async () => {
      renderPage("/legendary-events/astarLysander")
      await runReady()
      act(() => selectTab("teams"))
      showOnlyLane("alpha")
      await screen.findByTestId("legendary-event-leaderboard")
      await openDanteMenu()
      fireEvent.click(await screen.findByTestId("leaderboard-add-to-team"))

      const editor = await screen.findByTestId("team-editor")
      expect(
        within(editor).getByRole("heading", { level: 2 })
      ).toHaveTextContent("Add a team to Alpha")
      expect(editorMembers()).toEqual(["bloodDante"])
      expect(
        within(editor)
          .getAllByTestId("team-editor-summary-objective")
          .map((chip) => chip.dataset.index)
      ).toEqual(["2", "4"])
    })
  })

  it("names Create goal and Add to new team in the eligibility tour step", async () => {
    renderPage("/legendary-events/astarLysander")
    await runReady()
    const { desktop } = tour.steps as {
      desktop: { target: string; content: string }[]
    }
    const step = desktop.find((entry) =>
      entry.target.includes('[data-testid="legendary-event-leaderboard"]')
    )!
    expect(step.content).toContain("Create goal")
    expect(step.content).toContain("Add to new team")
  })

  it("registers the same tour on both forms, each step on its tab", async () => {
    renderPage("/legendary-events/astarLysander")
    await runReady()

    const { desktop, mobile } = tour.steps as {
      desktop: { target: string; before?: () => Promise<void> }[]
      mobile: { target: string }[]
    }
    expect(mobile).toBe(desktop)
    expect(desktop.map((step) => step.target)).toEqual([
      '[data-testid="legendary-event-tabs"]',
      '[data-testid="legendary-event-lane-summary"]',
      '[data-testid="legendary-event-board"]',
      '[data-testid="legendary-event-teams"]',
      '[data-testid="legendary-event-overview-leaderboard"], [data-testid="legendary-event-leaderboard"]',
      '[data-testid="legendary-event-token-plan-header"]',
      '[data-testid="legendary-event-upgrade-impact"]',
      '[data-testid="legendary-event-battles"]',
      '[data-testid="legendary-event-next-token"]',
      '[data-testid="legendary-event-run-status"]',
      '[data-testid="legendary-event-run-inputs"]',
      '[data-testid="legendary-event-progress-grid"]',
    ])
    // `before` resolves only once the step's section is in the document, which an `act` scope
    // would withhold until it resolves, so it runs as Joyride runs it: outside act.
    const actGlobal = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    const actEnvironment = actGlobal.IS_REACT_ACT_ENVIRONMENT
    actGlobal.IS_REACT_ACT_ENVIRONMENT = false
    try {
      for (const step of desktop) {
        // With no teams the plan is empty, so the Token plan step's target is absent (Joyride
        // skips it): its wait ends at its timeout, which the faked clock is moved past.
        if (step.target.includes("legendary-event-token-plan")) {
          const opening = step.before!()
          // Plan renders three lanes' Upgrade impact and Battles: slow under instrumentation.
          await screen.findByTestId("legendary-event-plan-tab", undefined, {
            timeout: 5000,
          })
          vi.setSystemTime(Date.now() + 2000)
          await opening
          expect(document.querySelector(step.target)).toBeNull()
          continue
        }
        await step.before!()
        expect(document.querySelector(step.target), step.target).not.toBeNull()
      }
    } finally {
      actGlobal.IS_REACT_ACT_ENVIRONMENT = actEnvironment
    }
    expect(selectedTab()).toHaveTextContent("Current run")
  })

  describe("run history", () => {
    // Lysander is active and synced in run 2, so its run 1 record is the previous run.
    const lastRunRecord = { ...utharRun1Record, teams: [] }
    const runTwoProgress = { ...lysanderProgress, currentEventRun: 2 }

    it("hides the card on an active event with no synced progress (the newest record may be the current run)", async () => {
      history.records = [utharRun1Record]
      renderPage("/legendary-events/astarLysander")
      await runReady()
      expect(screen.queryByTestId("legendary-event-last-run")).toBeNull()
      expect(screen.queryByTestId("legendary-event-history-note")).toBeNull()
    })

    it("shows the one-line note where the card would be when there are no records, and no tour step", async () => {
      renderPage("/legendary-events/astarLysander")
      expect(
        await screen.findByTestId("legendary-event-history-note")
      ).toHaveTextContent("History starts with your next synced run")
      expect(screen.queryByTestId("legendary-event-last-run")).toBeNull()
      const { desktop } = tour.steps as { desktop: { target: string }[] }
      expect(
        desktop.some((step) => step.target.includes("legendary-event-last-run"))
      ).toBe(false)
    })

    it.each([
      ["desktop", 1280],
      ["mobile", 390],
    ])(
      "%s: the Last run card closes the run tab, the tour highlights it last, and it is reported once",
      async (_form, width) => {
        setViewportWidth(width)
        history.records = [lastRunRecord]
        await seedProgress(runTwoProgress)
        renderPage("/legendary-events/astarLysander")
        // The card mounts loading and is replaced once its reads settle.
        await screen.findByTestId("last-run-run")
        const lastRun = screen.getByTestId("legendary-event-last-run")
        expect(within(lastRun).getByTestId("last-run-run")).toBeInTheDocument()
        expect(
          follows(screen.getByTestId("legendary-event-run-status"), lastRun)
        ).toBe(true)
        expect(
          follows(screen.getByTestId("legendary-event-progress-grid"), lastRun)
        ).toBe(true)

        const { desktop, mobile } = tour.steps as {
          desktop: { target: string }[]
          mobile: { target: string }[]
        }
        for (const steps of [desktop, mobile]) {
          expect(steps.at(-1)?.target).toBe(
            '[data-testid="legendary-event-last-run"]'
          )
        }

        const viewed = () =>
          analytics.capture.mock.calls.filter(
            ([event]) => event.type === "legendary_event_last_run_viewed"
          )
        expect(viewed()).toEqual([
          [
            {
              type: "legendary_event_last_run_viewed",
              eventId: "astarLysander",
              run: 1,
              teamCount: 0,
              deltaCount: 0,
            },
          ],
        ])
        // Leaving the run tab and coming back is the same page view.
        selectTab("teams")
        await screen.findByTestId("legendary-event-teams-tab")
        selectTab("run")
        await screen.findByTestId("legendary-event-last-run")
        expect(viewed()).toHaveLength(1)
      }
    )

    it("shows History unavailable with Retry when the read fails, the rest of the run tab intact", async () => {
      history.failRecords = true
      renderPage("/legendary-events/astarLysander")
      expect(await screen.findByTestId("last-run-error")).toHaveTextContent(
        "History unavailable"
      )
      expect(
        screen.getByTestId("legendary-event-run-status")
      ).toBeInTheDocument()
      expect(await runReady()).toHaveLength(3)
    })

    it("shows each lane team's last-run clear on its card", async () => {
      planApi.teams = [
        {
          id: "team-melee",
          laneId: "alpha",
          name: "Melee",
          sortOrder: 0,
          memberUnitIds: ["bloodDante"],
          reserveUnitId: null,
          objectiveIndexes: [3],
          runDepths: [],
        },
        {
          id: "team-new",
          laneId: "alpha",
          name: "New",
          sortOrder: 1,
          memberUnitIds: ["bloodDante"],
          reserveUnitId: null,
          objectiveIndexes: [],
          runDepths: [],
        },
      ]
      history.records = [utharRun1Record]
      await seedProgress(runTwoProgress)
      renderPage("/legendary-events/astarLysander")
      await screen.findByTestId("legendary-event-last-run")
      selectTab("teams")
      const line = await screen.findByTestId("team-card-last-run")
      expect(line).toHaveTextContent("Last run: cleared up to battle 3")
      expect(screen.getAllByTestId("team-card-last-run")).toHaveLength(1)
    })
  })

  describe("Next token on the run tab, Token plan on Plan", () => {
    // Lysander run 1: Alpha battle 1 won, one Alpha team that clears defeat-all three battles
    // deep, so the plan is Alpha battle 2, battle 3, then battle 1's remaining kill score.
    const runOneProgress = {
      ...lysanderProgress,
      currentEventRun: 1,
      currentEventTokens: {
        current: 3,
        max: 12,
        nextTokenInSeconds: 5400,
        regenDelayInSeconds: 10_800,
      },
      hasUsedAdForExtraTokenToday: false,
      extraCurrencyPerPayout: null,
      currentPoints: 100,
      currentCurrency: 0,
      currentClaimedChestIndex: 0,
      currentShards: 0,
    }
    const deepTeam = {
      id: "deep",
      laneId: "alpha",
      name: "Deep",
      sortOrder: 0,
      // A team needs three characters for the plan to play it.
      memberUnitIds: ["bloodDante", "bloodMephiston", "bloodTerminator"],
      reserveUnitId: null,
      objectiveIndexes: [],
      runDepths: [
        {
          run: 1,
          expectedBattleClears: 3,
          expectedBattleClearsSource: "manual",
          recordedAt: "2026-09-01T00:00:00Z",
        },
      ],
    }

    it("orders the run tab (Next token with the tokens up next, Run status, progress grid) and Plan (Run forecast, Token plan)", async () => {
      const scrollIntoView = vi
        .spyOn(HTMLElement.prototype, "scrollIntoView")
        .mockImplementation(() => {})
      await seedProgress(runOneProgress)
      planApi.teams = [deepTeam]
      renderPage("/legendary-events/astarLysander")
      const card = await screen.findByTestId("next-token-view")
      await runReady()

      const order = [
        screen.getByTestId("legendary-event-next-token"),
        screen.getByTestId("legendary-event-run-status"),
        screen.getByTestId("legendary-event-progress-grid"),
      ]
      for (const [index, element] of order.slice(1).entries()) {
        expect(follows(order[index]!, element)).toBe(true)
      }
      expect(card).toHaveAttribute("data-lane", "alpha")
      expect(card).toHaveAttribute("data-battle", "1")
      const upNext = screen.getByTestId("next-token-up-next")
      expect(within(upNext).getAllByTestId("token-plan-row")).toHaveLength(2)

      act(() => {
        fireEvent.click(within(upNext).getByTestId("next-token-view-plan"))
      })
      expect(selectedTab()).toHaveTextContent("Plan")
      const tokenPlan = screen.getByTestId("legendary-event-token-plan")
      expect(scrollIntoView.mock.instances.at(-1)).toBe(tokenPlan)
      expect(
        follows(screen.getByTestId("legendary-event-run-forecast"), tokenPlan)
      ).toBe(true)
      expect(screen.getByTestId("token-plan-summary")).toHaveTextContent(
        /^3 tokens/
      )
      // The tour's Token plan step highlights this header row, not the whole card.
      expect(
        within(tokenPlan).getByTestId("legendary-event-token-plan-header")
      ).toContainElement(screen.getByTestId("token-plan-toggle"))
      scrollIntoView.mockRestore()
    })

    it("opens a token's battle in the battle info dialog", async () => {
      await seedCatalog({ battles: lysanderBattles })
      await seedProgress(runOneProgress)
      planApi.teams = [deepTeam]
      renderPage("/legendary-events/astarLysander")
      const card = await screen.findByTestId("next-token-view")

      act(() => {
        fireEvent.click(
          within(card).getByRole("button", {
            name: "Battle info: Alpha battle 2",
          })
        )
      })
      const dialog = await screen.findByTestId("battle-info-dialog")
      expect(
        within(dialog).getByRole("heading", { name: "Alpha · Battle 2" })
      ).toBeInTheDocument()
      expect(
        await within(dialog).findByTestId("battle-title")
      ).toHaveTextContent("Battle 2")
      expect(within(dialog).getByTestId("battle-map-image")).toHaveAttribute(
        "alt",
        "Map of Alpha battle 2"
      )
    })

    it("re-plans at once when a card action lowers the token's team depth", async () => {
      await seedProgress(runOneProgress)
      planApi.teams = [deepTeam]
      planApi.put.mockReturnValue(new Promise(() => {}))
      renderPage("/legendary-events/astarLysander")
      await screen.findByTestId("next-token-view")

      act(() => {
        fireEvent.click(screen.getByTestId("next-token-could-not"))
      })

      // Deep fell short on battle 2 and no other Alpha team reaches it: its depth drops to 1 (the
      // battles before), then the cells are marked; the first write is still in flight.
      await vi.waitFor(() => expect(planApi.put).toHaveBeenCalledTimes(1))
      expect(planApi.put).toHaveBeenCalledWith(
        expect.objectContaining({
          path: "/api/v1/legendary-event-plans/{eventId}/teams/{teamId}",
          params: { path: { eventId: "astarLysander", teamId: "deep" } },
          body: expect.objectContaining({ expectedBattleClears: 1 }),
        })
      )
      expect(analytics.capture).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "legendary_event_token_result",
          eventId: "astarLysander",
          laneId: "alpha",
          battleIndex: 1,
          outcome: "couldNotClear",
          depthBefore: 3,
          depthBeforeManual: true,
          depthAfter: 1,
          otherTeamReaches: false,
          memberCount: 3,
          curveVersion: expect.any(String),
        })
      )
      // Alpha now stops at battle 1, leaving battle 1's kill score.
      const card = await screen.findByTestId("next-token-view")
      await vi.waitFor(() => expect(card).toHaveAttribute("data-battle", "0"))
      act(() => selectTab("plan"))
      expect(screen.getByTestId("token-plan-summary")).toHaveTextContent(
        /^1 token /
      )
    })

    it("names the lane to add a team on when there are no teams", async () => {
      await seedProgress(runOneProgress)
      renderPage("/legendary-events/astarLysander")

      expect(await screen.findByTestId("next-token-noTeams")).toHaveTextContent(
        "Add a team on Alpha to get a plan"
      )
    })

    it("opens an archived event on Overview, with a Last run tab and no token sections", async () => {
      renderPage("/legendary-events/archivedLysander")
      await overviewReady()

      expect(selectedTab()).toHaveTextContent("Overview")
      act(() => selectTab("run"))
      expect(selectedTab()).toHaveTextContent("Last run")
      expect(screen.queryByTestId("legendary-event-next-token")).toBeNull()
      act(() => selectTab("plan"))
      expect(screen.queryByTestId("legendary-event-token-plan")).toBeNull()
      expect(screen.queryByTestId("legendary-event-run-forecast")).toBeNull()
    })
  })

  describe("desktop (1280px)", () => {
    it("renders a static strip, lane switches, the cross-lane table and the lane table", async () => {
      await seedProgress(lysanderProgress)
      renderPage("/legendary-events/astarLysander")
      await runReady()

      expect(screen.getByTestId("legendary-event-tabs")).not.toHaveAttribute(
        "data-sticky"
      )
      expect(screen.getAllByTestId("progress-grid").length).toBeGreaterThan(0)
      expect(screen.queryByTestId("legendary-event-lane-picker")).toBeNull()
      act(() => selectTab("teams"))
      expect(await screen.findByTestId("cross-lane-table")).toBeInTheDocument()
      showOnlyLane("alpha")
      expect(await screen.findByTestId("leaderboard-table")).toBeInTheDocument()
    })
  })

  describe("mobile (390px)", () => {
    beforeEach(() => setViewportWidth(390))

    it("renders the strip sticky under the header, one lane at a time, row cards and compact rows", async () => {
      await seedProgress(lysanderProgress)
      renderPage("/legendary-events/astarLysander")
      await runReady()

      const strip = screen.getByTestId("legendary-event-tabs")
      expect(strip).toHaveAttribute("data-sticky", "true")
      expect(strip).toHaveClass("sticky", "top-(--mobile-header-height)")
      expect(screen.getByTestId("progress-rows")).toBeInTheDocument()
      expect(lanesOf("progress-lane")).toEqual(["alpha"])
      expect(screen.queryByTestId("legendary-event-lane-switches")).toBeNull()

      act(() => selectTab("teams"))
      expect(await screen.findByTestId("leaderboard-list")).toBeInTheDocument()
      expect(screen.queryByTestId("leaderboard-table")).toBeNull()
      expect(lanesOf("event-board-lane")).toEqual(["alpha"])
      // The lane picker sticks under the tab strip, so a lane can be switched far down the tab.
      expect(
        screen.getByTestId("legendary-event-lane-picker-bar")
      ).toHaveAttribute("data-sticky", "true")
      expect(screen.getByTestId("legendary-event-lane-picker-bar")).toHaveClass(
        "sticky"
      )
      act(() => pickLane("beta"))
      expect(pickedLane()).toHaveTextContent("Beta")
      expect(lanesOf("event-board-lane")).toEqual(["beta"])
      expect(lanesOf("leaderboard-lane")).toEqual(["beta"])
    })
  })
})
