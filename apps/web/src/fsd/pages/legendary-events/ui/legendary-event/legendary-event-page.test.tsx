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

import { CreateGoalLauncherContext } from "@/entities/goal"
import { legendaryEventCharacters } from "@/test/fixtures/legendary-event-characters"
import { utharRun1Record } from "@/test/fixtures/legendary-event-run-records"
import { lysanderEvent, utharEvent } from "@/test/fixtures/legendary-events"
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

const events = [
  lysanderEvent,
  utharEvent,
  {
    ...lysanderEvent,
    id: "archivedLysander",
    finished: true,
    eventStageStartDatesUtc: ["2026-01-01T00:00:00Z"],
  },
]
const catalog = vi.hoisted(() => ({ synced: true }))
vi.mock("@workspace/game-catalog/queries", () => ({
  hasLegendaryEventsSynced: async () => catalog.synced,
  getLegendaryEvent: async (id: string) =>
    events.find((event) => event.id === id),
  getCharactersMap: async () => new Map(),
  getMowsMap: async () => new Map(),
  getCharacters: async () => legendaryEventCharacters,
  getLegendaryEventBattles: async () => [],
  getHordeModeTiers: async () => null,
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
vi.mock("@azure/msal-react", () => ({ useIsAuthenticated: () => true }))
vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  apiGet: async (path: string) => {
    if (path === "/api/v1/me/goals")
      return { goals: goals.summaries, orderRevision: 0 }
    if (path.startsWith("/api/v1/me/goals/"))
      return goals.details.get(path.split("/").at(-1)!)
    if (path.endsWith("/run-records")) {
      if (history.failRecords) throw new Error("run records unavailable")
      return { eventId: path.split("/").at(-2), records: history.records }
    }
    return {
      eventId: path.split("/").at(-1),
      revision: 0,
      catalogVersion: "1",
      notes: null,
      showPaidOptions: false,
      teams: planApi.teams,
    }
  },
  apiPut: planApi.put,
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

// Whole-page renders (three lanes of progress grid, each not-cleared cell a mark menu) run close to
// the 5s default under coverage instrumentation in CI.
describe("LegendaryEventPage", { timeout: 15_000 }, () => {
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

  it("shows one lane per tab in the order overview, teams, upgrade impact, progress grid, leaderboard", async () => {
    renderPage("/legendary-events/astarLysander")
    await screen.findByTestId("legendary-event-overview-leaderboard")

    act(() => selectTab("beta"))
    expect(selectedTab()).toHaveTextContent("Beta")
    expect(laneLabels()).toEqual(["beta"])
    const overview = screen.getByTestId("legendary-event-lane-overview")
    const teams = screen.getByTestId("legendary-event-teams")
    const impact = screen.getByTestId("legendary-event-upgrade-impact")
    const grid = screen.getByTestId("legendary-event-progress-grid")
    const leaderboard = await screen.findByTestId("legendary-event-leaderboard")
    expect(teams).toHaveAttribute("data-lane", "beta")
    expect(
      await screen.findByTestId("legendary-event-teams-empty")
    ).toHaveTextContent("No teams on Beta yet.")
    expect(follows(overview, teams)).toBe(true)
    expect(follows(teams, impact)).toBe(true)
    expect(follows(impact, grid)).toBe(true)
    expect(follows(grid, leaderboard)).toBe(true)
    expect(lanesOf("progress-lane")).toEqual(["beta"])
    expect(lanesOf("leaderboard-lane")).toEqual(["beta"])
    expect(screen.getAllByTestId("leaderboard-table")).toHaveLength(1)
    expect(screen.queryByTestId("legendary-event-lane-summary")).toBeNull()
  })

  // Three full page renders, each with the Stage 6 goal reads; under coverage instrumentation in CI
  // this exceeds the suite's 15s.
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
  }, 30_000)

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

  // Two full page renders with goal reads; slow under coverage instrumentation in CI.
  it("previews goal targets on the leaderboards, shared across tabs and reset on leaving", async () => {
    giveCyrusUnlockGoal()
    renderPage("/legendary-events/astarLysander")
    await screen.findByTestId("legendary-event-overview-leaderboard")
    const previewSwitch = await screen.findByTestId("leaderboard-goals-preview")
    await vi.waitFor(() => expect(previewSwitch).toBeEnabled())
    act(() => toggleOnlyUnlocked())
    act(() => selectTab("alpha"))
    await screen.findByTestId("legendary-event-leaderboard")
    expect(screen.getAllByTestId("leaderboard-row")).toHaveLength(1)

    act(() => fireEvent.click(screen.getByTestId("leaderboard-goals-preview")))
    // Cyrus's Unlock goal makes him owned in the preview, so Only unlocked keeps his row.
    const rows = screen.getAllByTestId("leaderboard-row")
    expect(rows).toHaveLength(2)
    expect(screen.getAllByTestId("leaderboard-preview-marker")).toHaveLength(1)

    act(() => selectTab("overview"))
    expect(screen.getByTestId("leaderboard-goals-preview")).toHaveAttribute(
      "aria-checked",
      "true"
    )

    fireEvent.click(screen.getByTestId("open-uthar"))
    await screen.findByText("Uthar", { selector: "h1" })
    await screen.findByTestId("legendary-event-overview-leaderboard")
    expect(screen.getByTestId("leaderboard-goals-preview")).toHaveAttribute(
      "aria-checked",
      "false"
    )
  }, 30_000)

  it("launches goal creation from a leaderboard row with the unit prefilled", async () => {
    renderPage("/legendary-events/astarLysander")
    await screen.findByTestId("legendary-event-overview-leaderboard")
    act(() => toggleOnlyUnlocked())
    act(() => selectTab("alpha"))
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
        .getAllByTestId("team-picker-selected-unit")
        .map((element) => element.dataset.unit)

    it("opens the editor from the Overview leaderboard on the chosen lane", async () => {
      renderPage("/legendary-events/astarLysander")
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
      expect(screen.getByTestId("legendary-event-overview")).toBeInTheDocument()
    })

    it("opens the editor from a lane leaderboard with the unit's objectives ticked", async () => {
      renderPage("/legendary-events/astarLysander")
      await screen.findByTestId("legendary-event-overview-leaderboard")
      act(() => selectTab("alpha"))
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
          .getAllByTestId("team-editor-objective")
          .map((chip) => [
            chip.dataset.index,
            chip.getAttribute("aria-pressed"),
          ])
      ).toEqual([
        ["2", "true"],
        ["4", "true"],
      ])
    })
  })

  it("names Add to new team in the lane leaderboard tour step", async () => {
    renderPage("/legendary-events/astarLysander")
    await screen.findByTestId("legendary-event-overview-leaderboard")
    const { desktop } = tour.steps as {
      desktop: { target: string; content: string }[]
    }
    const step = desktop.find(
      (entry) => entry.target === '[data-testid="legendary-event-leaderboard"]'
    )!
    expect(step.content).toContain("Create goal")
    expect(step.content).toContain("Add to new team")
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
      '[data-testid="legendary-event-next-token"]',
      '[data-testid="legendary-event-run-status"]',
      '[data-testid="legendary-event-run-inputs"]',
      '[data-testid="legendary-event-token-plan-header"]',
      '[data-testid="legendary-event-lane-summary"]',
      '[data-testid="legendary-event-overview-leaderboard"]',
      '[data-testid="legendary-event-lane-overview"]',
      '[data-testid="legendary-event-teams"]',
      '[data-testid="legendary-event-upgrade-impact"]',
      '[data-testid="legendary-event-progress-grid"]',
      '[data-testid="legendary-event-leaderboard"]',
    ])
    // With no teams the plan is empty, so the Token plan step's target is absent (Joyride skips it).
    for (const step of desktop.slice(0, 7)) {
      if (step.target.includes("legendary-event-token-plan")) {
        expect(document.querySelector(step.target)).toBeNull()
        continue
      }
      expect(document.querySelector(step.target)).not.toBeNull()
    }
    // `before` resolves only once the lane section is in the document, which an `act` scope
    // would withhold until it resolves, so it runs as Joyride runs it: outside act.
    const actGlobal = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    const actEnvironment = actGlobal.IS_REACT_ACT_ENVIRONMENT
    actGlobal.IS_REACT_ACT_ENVIRONMENT = false
    try {
      await desktop[7]!.before!()
    } finally {
      actGlobal.IS_REACT_ACT_ENVIRONMENT = actEnvironment
    }
    expect(selectedTab()).toHaveTextContent("Alpha")
    for (const step of desktop.slice(7)) {
      expect(document.querySelector(step.target)).not.toBeNull()
    }
  })

  describe("run history", () => {
    // Lysander is active and synced in run 2, so its run 1 record is the previous run.
    const lastRunRecord = { ...utharRun1Record, teams: [] }
    const runTwoProgress = { ...lysanderProgress, currentEventRun: 2 }

    it("hides the card on an active event with no synced progress (the newest record may be the current run)", async () => {
      history.records = [utharRun1Record]
      renderPage("/legendary-events/astarLysander")
      await screen.findByTestId("legendary-event-overview-leaderboard")
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
      "%s: the Last run card follows Run status, the tour highlights it next, and it is reported once",
      async (_form, width) => {
        setViewportWidth(width)
        history.records = [lastRunRecord]
        player.progress = runTwoProgress
        renderPage("/legendary-events/astarLysander")
        const lastRun = await screen.findByTestId("legendary-event-last-run")
        await within(lastRun).findByTestId("last-run-run")
        expect(
          follows(screen.getByTestId("legendary-event-run-status"), lastRun)
        ).toBe(true)

        const { desktop, mobile } = tour.steps as {
          desktop: { target: string }[]
          mobile: { target: string }[]
        }
        for (const steps of [desktop, mobile]) {
          const targets = steps.map((step) => step.target)
          const runStatus = targets.indexOf(
            '[data-testid="legendary-event-run-status"]'
          )
          expect(targets[runStatus + 1]).toBe(
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
        // Leaving the Overview and coming back is the same page view.
        selectTab("alpha")
        await screen.findByTestId("legendary-event-lane")
        selectTab("overview")
        await screen.findByTestId("legendary-event-last-run")
        expect(viewed()).toHaveLength(1)
      }
    )

    it("shows History unavailable with Retry when the read fails, the rest of the Overview intact", async () => {
      history.failRecords = true
      renderPage("/legendary-events/astarLysander")
      expect(await screen.findByTestId("last-run-error")).toHaveTextContent(
        "History unavailable"
      )
      expect(
        screen.getByTestId("legendary-event-run-status")
      ).toBeInTheDocument()
      expect(
        await screen.findByTestId("legendary-event-overview-leaderboard")
      ).toBeInTheDocument()
      expect(
        screen.getByTestId("legendary-event-lane-summary")
      ).toBeInTheDocument()
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
      player.progress = runTwoProgress
      renderPage("/legendary-events/astarLysander")
      await screen.findByTestId("legendary-event-last-run")
      selectTab("alpha")
      const line = await screen.findByTestId("team-card-last-run")
      expect(line).toHaveTextContent("Last run: cleared up to battle 3")
      expect(screen.getAllByTestId("team-card-last-run")).toHaveLength(1)
    })
  })

  describe("token plan on Overview", () => {
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

    it("orders the Overview: Next token, Run status, Token plan, Run forecast, lane summary, leaderboard", async () => {
      player.progress = runOneProgress
      planApi.teams = [deepTeam]
      renderPage("/legendary-events/astarLysander")
      const card = await screen.findByTestId("next-token-view")
      const leaderboard = await screen.findByTestId(
        "legendary-event-overview-leaderboard"
      )

      const order = [
        screen.getByTestId("legendary-event-next-token"),
        screen.getByTestId("legendary-event-run-status"),
        screen.getByTestId("legendary-event-token-plan"),
        screen.getByTestId("legendary-event-run-forecast"),
        screen.getByTestId("legendary-event-lane-summary"),
        leaderboard,
      ]
      for (const [index, element] of order.slice(1).entries()) {
        expect(follows(order[index]!, element)).toBe(true)
      }
      expect(card).toHaveAttribute("data-lane", "alpha")
      expect(card).toHaveAttribute("data-battle", "1")
      expect(screen.getByTestId("token-plan-summary")).toHaveTextContent(
        /^3 tokens/
      )
      // The tour's Token plan step highlights this header row, not the whole card.
      expect(
        within(screen.getByTestId("legendary-event-token-plan")).getByTestId(
          "legendary-event-token-plan-header"
        )
      ).toContainElement(screen.getByTestId("token-plan-toggle"))
    })

    it("re-plans at once when a card action marks the token", async () => {
      player.progress = runOneProgress
      planApi.teams = [deepTeam]
      planApi.put.mockReturnValue(new Promise(() => {}))
      renderPage("/legendary-events/astarLysander")
      await screen.findByTestId("next-token-view")

      act(() => fireEvent.click(screen.getByTestId("next-token-could-not")))

      await vi.waitFor(() => expect(planApi.put).toHaveBeenCalledTimes(1))
      expect(planApi.put).toHaveBeenCalledWith(
        "/api/v1/me/legendary-event-plans/astarLysander/annotations",
        {
          body: {
            expectedRevision: 0,
            laneId: "alpha",
            battleIndex: 1,
            objectiveIds: [0],
            status: "stopHere",
          },
        }
      )
      // Battle 2's defeat-all is Stop here: Alpha stops there, leaving battle 1's kill score.
      const card = await screen.findByTestId("next-token-view")
      await vi.waitFor(() => expect(card).toHaveAttribute("data-battle", "0"))
      expect(screen.getByTestId("token-plan-summary")).toHaveTextContent(
        /^1 token /
      )
    })

    it("names the lane to add a team on when there are no teams", async () => {
      player.progress = runOneProgress
      renderPage("/legendary-events/astarLysander")

      expect(await screen.findByTestId("next-token-noTeams")).toHaveTextContent(
        "Add a team on Alpha to get a plan"
      )
    })

    it("renders no token sections on an archived event", async () => {
      renderPage("/legendary-events/archivedLysander")
      await screen.findByTestId("legendary-event-overview-leaderboard")

      expect(screen.queryByTestId("legendary-event-next-token")).toBeNull()
      expect(screen.queryByTestId("legendary-event-token-plan")).toBeNull()
      expect(screen.queryByTestId("legendary-event-run-forecast")).toBeNull()
    })
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
