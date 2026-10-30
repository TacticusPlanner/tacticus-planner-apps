import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen, within } from "@/test/render"
import userEvent from "@testing-library/user-event"

import { setTestAuth } from "@/test/auth"
import { progressionRulesFixture } from "@workspace/game-catalog/testing"
import { seedGameCatalog, seedPlayerData } from "@/test/seed"

vi.mock("@/shared/tour", () => ({
  useTourPageSteps: () => undefined,
  PageTourButton: () => <button type="button">Tour this page</button>,
}))

// The dialog has its own tests; here only which goal the page hands it and how it closes matter.
vi.mock("@/features/goal-create/ui/goal-edit/goal-edit-dialog", () => ({
  GoalEditDialog: ({
    goalId,
    onOpenChange,
    headerAction,
  }: {
    goalId: string | null
    onOpenChange: (open: boolean) => void
    headerAction?: ReactNode
  }) =>
    goalId ? (
      <div data-testid="goal-edit-dialog">
        {goalId}
        {headerAction}
        <button
          data-testid="goal-edit-close"
          onClick={() => onOpenChange(false)}
        >
          Close
        </button>
      </div>
    ) : null,
}))

vi.mock("@/entities/player-data-override", () => ({
  battleProgressQueries: {
    current: () => ({
      queryKey: ["player-data-overrides", "battle-progress"],
      queryFn: () => Promise.resolve({ battles: [], revision: 1 }),
    }),
  },
  campaignEventProgressQueries: {
    current: () => ({
      queryKey: ["player-data-overrides", "campaign-events"],
      queryFn: () => Promise.resolve({ progress: [], revision: 1 }),
    }),
  },
  buildEffectiveCampaignEventProgress: () => new Map(),
  campaignEventTrackKey: (groupId: string, type: string) =>
    `${groupId}:${type}`,
  onslaughtProgressQueries: {
    current: () => ({
      queryKey: ["player-data-overrides", "onslaught"],
      queryFn: () =>
        Promise.resolve({
          imperial: { sector: "Stone", tier: 1, isSet: true },
          xenos: { sector: "Stone", tier: 1, isSet: true },
          chaos: { sector: "Stone", tier: 1, isSet: true },
          revision: 1,
        }),
    }),
  },
  getOnslaughtProgress: () =>
    Promise.resolve({
      imperial: { sector: "Stone", tier: 1, isSet: true },
      xenos: { sector: "Stone", tier: 1, isSet: true },
      chaos: { sector: "Stone", tier: 1, isSet: true },
      revision: 1,
    }),
  progressForAlliance: (
    progress: Record<string, { isSet?: boolean } | undefined>,
    alliance: string
  ) => {
    const value = progress[alliance.toLowerCase()]
    return value?.isSet ? value : undefined
  },
  onslaughtReward: () => ({ min: 2, max: 3, mythic: false }),
}))

vi.mock("@/entities/planning-setting", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/entities/planning-setting")>()
  return {
    ...actual,
    xpBookRarityOptions: [
      "Common",
      "Uncommon",
      "Rare",
      "Epic",
      "Legendary",
      "Mythic",
    ],
    usePlanningSettings: () => ({
      settings: { dailyEnergy: 288, xpBookRarity: "Legendary", revision: 1 },
      save: vi.fn(),
    }),
  }
})

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

// Catalog record for the one unit every goal here targets.
const catalogCharacters = [
  {
    id: "hero1",
    name: "Hero One",
    faction: "Ultramarines",
    rankUpUpgrades: [{ rank: "Stone1", upgradeIds: ["h1"] }],
  },
]

/** A synced, owned hero1 (so a Rank goal has no missing-Unlock blocker). */
const ownedHero = (overrides: Record<string, unknown> = {}) => ({
  unitId: "hero1",
  rank: "Stone1",
  appliedUpgradeSlots: [],
  progressionIndex: "Mythic:MythicWings",
  xpLevel: 60,
  ...overrides,
})

/**
 * Holds every player-data read pending: an older-version connection that ignores `versionchange`
 * blocks Dexie's open (and so every live query over it) until the returned release closes it.
 */
async function holdPlayerData() {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("tacticus-planner-player-data", 1)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(
        request.error ?? new Error("Could not open the player-data database")
      )
  })
  db.onversionchange = () => undefined
  return () => db.close()
}

const listGoals = vi.fn()
const listProjects = vi.fn()
const createProject = vi.fn()
const updateGoalsStatus = vi.fn()
const deleteGoal = vi.fn()
const updateProjectGoals = vi.fn()

/** Project id → member goal ids. The API carries membership on both sides (each goal's `projectIds`,
 *  each project's `goalIds`), so the reads below join it in. */
let membership: Record<string, string[]> = {}
const projectIdsOf = (goalId: string) =>
  Object.keys(membership).filter((projectId) =>
    membership[projectId]!.includes(goalId)
  )

async function readGoals(archived: boolean) {
  const list = await listGoals({ archived })
  return {
    orderRevision: 0,
    ...list,
    goals: (list.goals as { goalId: string }[]).map((goal) => ({
      projectIds: projectIdsOf(goal.goalId),
      ...goal,
    })),
  }
}

async function readProjects() {
  const list = await listProjects()
  return {
    ...list,
    projects: (list.projects as { projectId: string }[]).map((project) => ({
      goalIds: membership[project.projectId] ?? [],
      ...project,
    })),
  }
}

vi.mock("@/entities/goal", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/goal")>()),
  updateGoalsStatus: (...args: unknown[]) => updateGoalsStatus(...args),
  deleteGoal: (...args: unknown[]) => deleteGoal(...args),
}))

vi.mock("@/entities/project", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/project")>()),
  createProject: (...args: unknown[]) => createProject(...args),
  // Calls the API module directly in the real code, so route it through the mock above.
  changeProjectMembership: async (
    projectId: string,
    current: readonly string[],
    change: (current: readonly string[]) => string[]
  ) => {
    const before = [...current]
    const after = [...new Set(change(before))]
    await updateProjectGoals(projectId, {
      goals: after.map((goalId) => ({ goalId })),
      expectedGoalIds: before,
    })
    return { before, after }
  },
}))

// Reads: the goals and project lists through the typed client.
vi.mock("@/shared/api", async (importOriginal) => {
  const { fakeApiClient } = await import("@/test/fake-api-client")
  return {
    ...(await importOriginal<typeof import("@/shared/api")>()),
    apiClient: fakeApiClient(({ path, params }) =>
      path === "/api/v1/goals"
        ? readGoals(params?.query?.archived === true)
        : path === "/api/v1/projects"
          ? readProjects()
          : { goals: [] }
    ),
  }
})

// The plan run behind estimates is exercised by its own tests; the page only consumes its result.
// A mutable `.value` (not a static object) so a test that needs non-empty level-requirement maps
// (the available/needed book count) can override it before rendering.
const insightsResult = vi.hoisted(() => ({
  emptyResult: {
    estimates: new Map(),
    potentialProgressByGoalId: new Map(),
    levelPotentialProgressByGoalId: new Map(),
    levelChargedXpByGoalId: new Map(),
    levelPoolXpAvailableByGoalId: new Map(),
    rankSlotsByGoalId: new Map(),
  },
  value: {},
}))
insightsResult.value = insightsResult.emptyResult

vi.mock("@/features/goal-planning/model/insights/use-plan-insights", () => ({
  usePlanInsights: () => ({
    loading: false,
    result: insightsResult.value,
  }),
}))
vi.mock(
  "@/features/goal-planning/model/goal-order/use-goal-order-actions",
  async (importOriginal) => ({
    ...(await importOriginal<typeof import("@/features/goal-planning")>()),
    useGoalOrderActions: () => ({
      moveGoal: vi.fn(),
      pending: false,
      conflict: null,
      retry: vi.fn(),
      dismissConflict: vi.fn(),
    }),
  })
)

const mobile = vi.hoisted(() => ({ value: false }))

vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => mobile.value,
}))

import { MemoryRouter, useLocation, useNavigate } from "react-router"

import { GoalsPage } from ".//goals-page"
import { CreateGoalLauncherProvider } from "@/features/goal-create"

const onLaunch = vi.fn()

// Shows where the router is and stands in for the browser's Back button.
function LocationProbe() {
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <>
      <span data-testid="location-path">{location.pathname}</span>
      <span data-testid="location-search">{location.search}</span>
      <button data-testid="history-back" onClick={() => void navigate(-1)}>
        Back
      </button>
    </>
  )
}

// Seeded behind a `/home` entry so a test can tell a replaced scope from a pushed one.
function renderPage(initialEntry = "/plan/goals") {
  return render(
    <MemoryRouter initialEntries={["/home", initialEntry]} initialIndex={1}>
      <CreateGoalLauncherProvider onLaunch={onLaunch}>
        <GoalsPage />
        <LocationProbe />
      </CreateGoalLauncherProvider>
    </MemoryRouter>
  )
}

const activeGoal = {
  goalId: "goal-1",
  entityType: "Character",
  entityId: "hero1",
  goalType: "Rank",
  status: "Active",
  notes: null,
  dependsOn: [],
  config: {
    rank: {
      start: 0,
      startPointFive: false,
      startAppliedUpgrades: 0,
      end: 11,
      endPointFive: false,
      endAppliedUpgrades: 0,
    },
  },
  snapshot: null,
  revision: 1,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
}

const archivedGoal = {
  ...activeGoal,
  goalId: "goal-archived",
  status: "Archived",
}

const pausedGoal = {
  ...activeGoal,
  goalId: "goal-paused",
  status: "Paused",
}

const otherProject = {
  projectId: "proj-2",
  name: "Event Prep",
  description: null,
  color: null,
  status: "Active",
  isDefault: false,
  target: null,
  revision: 0,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
}

const overviewProject = {
  projectId: "proj-1",
  name: "My Goals",
  description: null,
  color: null,
  status: "Active",
  isDefault: true,
  target: null,
  revision: 0,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
}

describe("GoalsPage", () => {
  beforeEach(async () => {
    listGoals.mockReset()
    listProjects.mockReset()
    createProject.mockReset()
    membership = {}
    listProjects.mockResolvedValue({ projects: [] })
    setTestAuth({ authenticated: true })
    await seedGameCatalog({ characters: catalogCharacters })
    updateProjectGoals.mockReset()
    updateGoalsStatus.mockReset()
    mobile.value = false
    onLaunch.mockReset()
    insightsResult.value = insightsResult.emptyResult
  })

  it("does not render page-level creation actions", async () => {
    listGoals.mockResolvedValue({ goals: [] })
    renderPage()

    await screen.findByTestId("goals-page-empty")
    expect(
      screen.queryByTestId("goals-page-create-button")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("goals-page-empty-create-button")
    ).not.toBeInTheDocument()
  })

  it.each([false, true])(
    "renders a Create Goal entry point in the control row that opens creation with no prefill (mobile: %s)",
    async (isMobile) => {
      mobile.value = isMobile
      listGoals.mockResolvedValue({ goals: [] })
      const user = userEvent.setup()
      renderPage()

      await screen.findByTestId("goals-page-empty")
      const button = screen.getByTestId("goals-create-goal")
      expect(button).toHaveAccessibleName("Create goal")
      // Desktop: Create goal leads the actions row. Mobile: it sits in the icon row.
      expect(
        screen.getByTestId(
          isMobile ? "goals-filter-group" : "goals-actions-row"
        )
      ).toContainElement(button)
      if (isMobile) expect(within(button).queryByText("Create goal")).toBeNull()
      else expect(button).toHaveTextContent("Create goal")

      await user.click(button)
      expect(onLaunch).toHaveBeenCalledTimes(1)
      expect(onLaunch).toHaveBeenCalledWith()
    }
  )

  it("renders a Planning Settings entry point that opens the dialog", async () => {
    listGoals.mockResolvedValue({ goals: [] })
    const user = userEvent.setup()
    renderPage()

    await screen.findByTestId("goals-page-empty")
    const settingsButton = screen.getByTestId("goals-planning-settings")
    expect(settingsButton).toHaveAccessibleName("Planning settings")

    await user.click(settingsButton)
    expect(
      await screen.findByTestId("planning-settings-dialog")
    ).toBeInTheDocument()
  })

  it("keeps filter control names stable while exposing the selected value", async () => {
    listGoals.mockResolvedValue({ goals: [] })
    const user = userEvent.setup()
    renderPage()
    await screen.findByTestId("goals-page-empty")

    const group = screen.getByTestId("goals-group-by")
    expect(group).toHaveAccessibleName("Group by")
    expect(
      document.getElementById("goals-group-value")
    ).not.toBeEmptyDOMElement()

    await user.click(group)
    await user.click(screen.getByRole("option", { name: "Group by type" }))
    expect(group).toHaveAccessibleName("Group by")
    expect(document.getElementById("goals-group-value")).toHaveTextContent(
      "Group by type"
    )
  })

  it("has no Sort control and lists Active and Paused goals in global priority order", async () => {
    listGoals.mockResolvedValue({
      goals: [
        { ...activeGoal, goalId: "goal-b", globalPriority: 2 },
        { ...pausedGoal, goalId: "goal-c", globalPriority: 3 },
        { ...activeGoal, goalId: "goal-a", globalPriority: 1 },
      ],
    })
    renderPage()

    await screen.findAllByTestId("goal-row")

    expect(screen.queryByTestId("goals-sort")).not.toBeInTheDocument()
    expect(
      screen
        .getAllByTestId("goal-row")
        .map((row) => row.getAttribute("data-goal-id"))
    ).toEqual(["goal-a", "goal-b", "goal-c"])
  })

  it("shows a row for an active goal with lifecycle actions", async () => {
    listGoals.mockResolvedValue({ goals: [activeGoal] })
    renderPage()

    expect(await screen.findByTestId("goals-list-table")).toBeInTheDocument()
    // The unit name comes from the seeded catalog, read by a live query after mount.
    expect(await screen.findByText("Hero One")).toBeInTheDocument()
    expect(
      screen.getByTestId(`goal-row-menu-${activeGoal.goalId}`)
    ).toBeInTheDocument()
  })

  it("filters out the active goal when switching to the Reached status", async () => {
    listGoals.mockResolvedValue({ goals: [activeGoal] })
    const user = userEvent.setup()
    renderPage()

    await screen.findByTestId("goals-list-table")

    await user.click(screen.getByTestId("goals-status-filter"))
    await user.click(await screen.findByRole("option", { name: "Reached (0)" }))

    expect(
      await screen.findByTestId("goals-page-filtered-empty")
    ).toBeInTheDocument()
  })

  it("filters to only the Paused goal when switching to the Paused status", async () => {
    listGoals.mockResolvedValue({ goals: [activeGoal, pausedGoal] })
    const user = userEvent.setup()
    renderPage()

    await screen.findByTestId("goals-list-table")

    await user.click(screen.getByTestId("goals-status-filter"))
    await user.click(await screen.findByRole("option", { name: /^Paused/ }))

    await screen.findByTestId("goals-list-table")
    expect(screen.getAllByTestId("goal-row")).toHaveLength(1)
    expect(
      screen.getByTestId(`goal-row-menu-${pausedGoal.goalId}`)
    ).toBeInTheDocument()
  })

  it("filters to only the Active goal when switching to the Active status", async () => {
    listGoals.mockResolvedValue({ goals: [activeGoal, pausedGoal] })
    const user = userEvent.setup()
    renderPage()

    await screen.findByTestId("goals-list-table")

    await user.click(screen.getByTestId("goals-status-filter"))
    await user.click(await screen.findByRole("option", { name: /^Active/ }))

    await screen.findByTestId("goals-list-table")
    expect(screen.getAllByTestId("goal-row")).toHaveLength(1)
    expect(
      screen.getByTestId(`goal-row-menu-${activeGoal.goalId}`)
    ).toBeInTheDocument()
  })

  it("selects the Blocked status without a live count and shows the filtered-empty state when nothing is blocked", async () => {
    listGoals.mockResolvedValue({ goals: [activeGoal] })
    // Owned, so the Rank goal has no missing-Unlock blocker.
    await seedPlayerData({ characters: [ownedHero()] })
    const user = userEvent.setup()
    renderPage()

    await screen.findByTestId("goals-list-table")

    await user.click(screen.getByTestId("goals-status-filter"))
    expect(screen.getByRole("option", { name: "Blocked" })).toBeInTheDocument()
    await user.click(screen.getByRole("option", { name: "Blocked" }))

    expect(
      await screen.findByTestId("goals-page-filtered-empty")
    ).toBeInTheDocument()
  })

  it("holds the Unfulfilled list in its loading state until every goal's attainment is known", async () => {
    listGoals.mockResolvedValue({ goals: [activeGoal] })
    const releasePlayerData = await holdPlayerData()
    renderPage()

    // The goals list has loaded, but the player-data read behind attainment has not.
    await vi.waitFor(() => expect(listGoals).toHaveBeenCalled())
    expect(await screen.findByTestId("goals-page-loading")).toBeInTheDocument()
    expect(screen.queryByTestId("goal-row")).toBeNull()
    expect(screen.queryByTestId("goals-page-filtered-empty")).toBeNull()

    await act(async () => {
      releasePlayerData()
      await Promise.resolve()
    })
    await vi.waitFor(() =>
      expect(screen.getAllByTestId("goal-row")).toHaveLength(1)
    )
    expect(screen.queryByTestId("goals-page-loading")).toBeNull()
  })

  it("renders the mobile reorder and select toggles disabled while goals load, so the control row does not shift", async () => {
    mobile.value = true
    listGoals.mockReturnValue(new Promise(() => undefined))
    renderPage()

    expect(await screen.findByTestId("goals-page-loading")).toBeInTheDocument()
    const row = screen.getByTestId("goals-filter-group")
    for (const id of [
      "goals-mobile-reorder-toggle",
      "goals-mobile-select-toggle",
    ]) {
      const toggle = within(row).getByTestId(id)
      expect(toggle).toBeDisabled()
      expect(toggle).toHaveAccessibleName()
    }
  })

  it("wraps the mobile icon row so the Season fit trigger does not push the page wider than a 390px phone", async () => {
    mobile.value = true
    listGoals.mockReturnValue(new Promise(() => undefined))
    renderPage()

    expect(await screen.findByTestId("goals-page-loading")).toBeInTheDocument()
    // jsdom has no layout; the wrap class is what keeps the row inside 358px.
    expect(screen.getByTestId("goals-filter-group")).toHaveClass("flex-wrap")
  })

  it("moves a goal to the Reached tab once its rank target is met", async () => {
    listGoals.mockResolvedValue({
      goals: [
        {
          ...activeGoal,
          config: {
            rank: {
              start: 0,
              startPointFive: false,
              startAppliedUpgrades: 0,
              end: 0,
              endPointFive: false,
              endAppliedUpgrades: 0,
            },
          },
        },
      ],
    })
    await seedPlayerData({ characters: [ownedHero()] })
    const user = userEvent.setup()
    renderPage()

    // Unfulfilled holds its loading state until attainment is known, so the reached goal never
    // flashes there before dropping out: the tab goes straight to its filtered-empty state.
    await screen.findByTestId("goals-page-filtered-empty")
    expect(screen.queryByText("Hero One")).toBeNull()

    await user.click(screen.getByTestId("goals-status-filter"))
    // Attainment may already be resolved by the time the dropdown opens (this test's mocks
    // resolve the goal as already meeting its rank target), so match the option by its status
    // label alone rather than an exact, timing-dependent count.
    await user.click(await screen.findByRole("option", { name: /^Reached/ }))

    expect(await screen.findByText("Hero One")).toBeInTheDocument()
    await vi.waitFor(() => {
      expect(screen.getByTestId("goals-status-filter")).toHaveTextContent("(1)")
    })
  })

  it("shows the available/needed XP-book count on a Rank goal's row from the plan's priority-ordered allocation", async () => {
    listGoals.mockResolvedValue({
      goals: [
        {
          ...activeGoal,
          config: {
            rank: {
              start: 5,
              startPointFive: false,
              startAppliedUpgrades: 0,
              end: 11, // Silver3 — requires level 32 (94,200 XP threshold)
              endPointFive: false,
              endAppliedUpgrades: 0,
            },
          },
        },
      ],
    })
    await seedPlayerData({
      characters: [ownedHero({ xpLevel: 31, xp: 82_000 })],
    })
    await seedGameCatalog({ "progression-rules": [progressionRulesFixture] })
    // 94,200 - 82,000 = 12,200 XP charged; a 100,000-XP pool at the default Legendary rarity
    // (12,500/book) is floor(100,000 / 12,500) = 8 available against ceil(12,200 / 12,500) = 1 needed.
    insightsResult.value = {
      ...insightsResult.emptyResult,
      levelChargedXpByGoalId: new Map([[activeGoal.goalId, 12_200]]),
      levelPoolXpAvailableByGoalId: new Map([[activeGoal.goalId, 100_000]]),
    }
    renderPage()

    const books = await screen.findByTestId("level-requirement-books")
    expect(books).toHaveTextContent("8 of 1")
    expect(screen.queryByTestId("goal-resource-chip")).toBeNull()
  })

  it("offers no Archived option but still fetches archived goals for cascades", async () => {
    listGoals.mockImplementation((options?: { archived?: boolean }) =>
      Promise.resolve({
        goals: options?.archived ? [archivedGoal] : [activeGoal],
      })
    )
    const user = userEvent.setup()
    renderPage()

    await screen.findByTestId("goals-list-table")
    await user.click(screen.getByTestId("goals-status-filter"))
    expect(
      await screen.findByRole("option", { name: "Unfulfilled (1)" })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("option", { name: /^Archived/ })
    ).not.toBeInTheDocument()
    expect(listGoals).toHaveBeenCalledWith({ archived: true })
  })

  it("opens the Edit goal dialog for the goal whose Edit action is activated", async () => {
    listGoals.mockResolvedValue({ goals: [activeGoal] })
    const user = userEvent.setup()
    renderPage()

    await screen.findByTestId("goal-row")
    await user.click(
      screen.getByTestId(`goal-row-actions-trigger-${activeGoal.goalId}`)
    )
    await user.click(
      await screen.findByTestId(`goal-row-edit-${activeGoal.goalId}`)
    )

    expect(await screen.findByTestId("goal-edit-dialog")).toHaveTextContent(
      activeGoal.goalId
    )
    // The page header's tour button sits behind the modal, so the dialog carries its own.
    expect(
      within(screen.getByTestId("goal-edit-dialog")).getByRole("button", {
        name: "Tour this page",
      })
    ).toBeInTheDocument()
  })

  it("opens nothing when the goal name or the row is clicked", async () => {
    listGoals.mockResolvedValue({ goals: [activeGoal] })
    const user = userEvent.setup()
    renderPage()

    const row = await screen.findByTestId("goal-row")
    await user.click(row.querySelector("td span.font-medium") as HTMLElement)
    await user.click(row)

    expect(screen.queryByTestId("goal-edit-dialog")).not.toBeInTheDocument()
  })

  it("does not open the Edit goal dialog when using another row action", async () => {
    listGoals.mockResolvedValue({ goals: [activeGoal] })
    const user = userEvent.setup()
    renderPage()

    await screen.findByTestId("goal-row")
    await user.click(
      screen.getByTestId(`goal-row-actions-trigger-${activeGoal.goalId}`)
    )
    await user.click(
      await screen.findByTestId(`goal-row-delete-${activeGoal.goalId}`)
    )

    expect(screen.queryByTestId("goal-edit-dialog")).not.toBeInTheDocument()
  })

  it("opens ungrouped, unlike project detail", async () => {
    listGoals.mockResolvedValue({
      goals: [
        activeGoal,
        { ...activeGoal, goalId: "goal-2", goalType: "Ability" },
      ],
    })
    renderPage()

    await screen.findByTestId(`goal-row-menu-${activeGoal.goalId}`)
    expect(
      screen.queryByRole("heading", { name: "Rank" })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "Ability" })
    ).not.toBeInTheDocument()
  })

  it("groups goals by goal type", async () => {
    listGoals.mockResolvedValue({
      goals: [
        activeGoal,
        { ...activeGoal, goalId: "goal-2", goalType: "Ability" },
      ],
    })
    renderPage()

    fireEvent.click(await screen.findByTestId("goals-group-by"))
    fireEvent.click(
      await screen.findByRole("option", { name: "Group by type" })
    )

    expect(
      await screen.findByRole("heading", { name: "Rank" })
    ).toBeInTheDocument()
    expect(
      await screen.findByRole("heading", { name: "Ability" })
    ).toBeInTheDocument()
  })

  it("shows project membership without a project switcher", async () => {
    listGoals.mockResolvedValue({ goals: [activeGoal] })
    listProjects.mockResolvedValue({ projects: [overviewProject] })
    membership = { "proj-1": [activeGoal.goalId] }
    renderPage()

    expect(
      within(await screen.findByTestId("goal-project-memberships")).getByText(
        "My Goals"
      )
    ).toBeInTheDocument()
  })

  it("offers no project-removal action, because Overview has no project scope", async () => {
    listGoals.mockResolvedValue({ goals: [activeGoal] })
    listProjects.mockResolvedValue({ projects: [overviewProject] })
    membership = { "proj-1": [activeGoal.goalId] }
    renderPage()

    const user = userEvent.setup()
    await user.click(
      await screen.findByTestId(`goal-row-actions-trigger-${activeGoal.goalId}`)
    )
    await screen.findByTestId(`goal-row-delete-${activeGoal.goalId}`)
    expect(
      screen.queryByTestId(`goal-row-remove-from-project-${activeGoal.goalId}`)
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId(`goal-row-move-to-project-${activeGoal.goalId}`)
    ).not.toBeInTheDocument()
  })
  const goalB = { ...activeGoal, goalId: "goal-b", entityId: "hero2" }
  /** Two projects: proj-1 (Default) holds activeGoal, proj-2 holds goalB. */
  function twoProjects() {
    listGoals.mockResolvedValue({ goals: [activeGoal, goalB] })
    listProjects.mockResolvedValue({
      projects: [overviewProject, otherProject],
    })
    membership = { "proj-1": [activeGoal.goalId], "proj-2": [goalB.goalId] }
  }

  it("applies no project scope initially, listing goals from every project with counts per chip", async () => {
    twoProjects()
    renderPage()

    await screen.findByTestId("goals-list-table")
    await vi.waitFor(() =>
      expect(screen.getAllByTestId("goal-row")).toHaveLength(2)
    )
    expect(screen.getByTestId("goals-project-scope-all")).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    await vi.waitFor(() =>
      expect(
        within(screen.getByTestId("goals-project-scope"))
          .getAllByRole("button")
          .map((chip) => chip.textContent)
      ).toEqual(["All goals2", "My Goals1", "Event Prep1"])
    )
    expect(screen.getByTestId("location-search")).toHaveTextContent("")
  })

  it("narrows the list via a scope chip, replaces the URL in place, and restores on All goals", async () => {
    twoProjects()
    const user = userEvent.setup()
    renderPage()

    await screen.findByTestId("goals-list-table")
    await vi.waitFor(() =>
      expect(screen.getAllByTestId("goal-row")).toHaveLength(2)
    )

    await user.click(screen.getByTestId("goals-project-scope-chip-proj-2"))
    await vi.waitFor(() =>
      expect(screen.getAllByTestId("goal-row")).toHaveLength(1)
    )
    expect(screen.getByTestId("goal-row")).toHaveTextContent("hero2")
    expect(screen.getByTestId("location-search")).toHaveTextContent(
      "?project=proj-2"
    )
    expect(
      screen.getByTestId("goals-project-scope-chip-proj-2")
    ).toHaveAttribute("aria-pressed", "true")
    // Narrowing a list is not selecting a project: nothing is written.
    expect(updateProjectGoals).not.toHaveBeenCalled()
    expect(updateGoalsStatus).not.toHaveBeenCalled()

    await user.click(screen.getByTestId("goals-project-scope-all"))
    await vi.waitFor(() =>
      expect(screen.getAllByTestId("goal-row")).toHaveLength(2)
    )
    expect(screen.getByTestId("location-search")).toHaveTextContent("")
    await vi.waitFor(() =>
      expect(
        screen
          .getAllByTestId("goal-project-memberships")
          .some((node) => within(node).queryByText("My Goals"))
      ).toBe(true)
    )
  })

  it("opens scoped from a ?project= deep link and keeps status, type and group across scopes while counts follow the scope", async () => {
    twoProjects()
    window.localStorage.setItem("goals.overview.group", "type")
    const user = userEvent.setup()
    renderPage("/plan/goals?project=proj-2")

    await screen.findByTestId("goals-list-table")
    await vi.waitFor(() =>
      expect(screen.getAllByTestId("goal-row")).toHaveLength(1)
    )
    expect(screen.getByTestId("goal-row")).toHaveTextContent("hero2")
    expect(screen.getByRole("heading", { name: "Rank" })).toBeInTheDocument()

    await user.click(screen.getByTestId("goals-type-filter"))
    await user.click(await screen.findByRole("option", { name: "Rank" }))
    await user.click(screen.getByTestId("goals-status-filter"))
    expect(
      await screen.findByRole("option", { name: "Unfulfilled (1)" })
    ).toBeInTheDocument()
    await user.keyboard("{Escape}")

    await user.click(screen.getByTestId("goals-project-scope-all"))
    await vi.waitFor(() =>
      expect(screen.getAllByTestId("goal-row")).toHaveLength(2)
    )
    expect(screen.getByRole("heading", { name: "Rank" })).toBeInTheDocument()
    expect(
      document.getElementById("goals-type-filter-value")
    ).toHaveTextContent("Rank")
    await user.click(screen.getByTestId("goals-status-filter"))
    expect(
      await screen.findByRole("option", { name: "Unfulfilled (2)" })
    ).toBeInTheDocument()
    window.localStorage.removeItem("goals.overview.group")
  })

  it.each([
    ["unknown", "nope"],
    ["archived", "proj-old"],
  ])(
    "drops an %s project id from the URL and lists all goals",
    async (_, id) => {
      twoProjects()
      listProjects.mockResolvedValue({
        projects: [
          overviewProject,
          otherProject,
          { ...otherProject, projectId: "proj-old", status: "Archived" },
        ],
      })
      renderPage(`/plan/goals?project=${id}`)

      await screen.findByTestId("goals-list-table")
      await vi.waitFor(() =>
        expect(screen.getAllByTestId("goal-row")).toHaveLength(2)
      )
      await vi.waitFor(() =>
        expect(screen.getByTestId("location-search")).toHaveTextContent(/^$/)
      )
      expect(screen.getByTestId("goals-project-scope-all")).toHaveAttribute(
        "aria-pressed",
        "true"
      )
      expect(
        screen.queryByTestId("goals-project-scope-chip-proj-old")
      ).not.toBeInTheDocument()
    }
  )

  it("keeps the param but lists all goals with only the All goals chip while projects fail to load", async () => {
    listGoals.mockResolvedValue({ goals: [activeGoal, goalB] })
    listProjects.mockRejectedValue(new Error("boom"))
    renderPage("/plan/goals?project=proj-1")

    await screen.findByTestId("goals-list-table")
    await vi.waitFor(() =>
      expect(screen.getAllByTestId("goal-row")).toHaveLength(2)
    )
    expect(screen.getByTestId("location-search")).toHaveTextContent(
      "?project=proj-1"
    )
    await vi.waitFor(() =>
      expect(
        within(screen.getByTestId("goals-project-scope")).getAllByRole("button")
      ).toHaveLength(1)
    )
  })

  it.each([false, true])(
    "renders the scope chips as their own row above the controls, with no project select (mobile: %s)",
    async (isMobile) => {
      mobile.value = isMobile
      twoProjects()
      renderPage()

      await screen.findByTestId("goals-status-filter")
      const chips = screen.getByTestId("goals-project-scope")
      const status = screen.getByTestId("goals-status-filter")
      expect(screen.getByTestId("goals-filter-group")).not.toContainElement(
        chips
      )
      expect(screen.queryByTestId("goals-project-filter")).toBeNull()
      expect(
        chips.compareDocumentPosition(status) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy()
      expect(
        screen.queryByTestId("overview-quicknav-create-project")
      ).toBeNull()
    }
  )

  it("explains the order from a control-row hint that adds the account-wide note only when scoped", async () => {
    twoProjects()
    const user = userEvent.setup()
    const view = renderPage()

    await screen.findByTestId("goals-list-table")
    expect(screen.queryByTestId("goals-order-note")).toBeNull()
    await user.click(await screen.findByTestId("goals-order-hint"))
    const content = await screen.findByTestId("goals-order-hint-content")
    expect(content).toHaveTextContent(
      "Goals are in your priority order. Drag an active or paused goal to move it"
    )
    expect(content).not.toHaveTextContent(
      "position in your account-wide priority order"
    )
    view.unmount()

    renderPage("/plan/goals?project=proj-1")
    await screen.findByTestId("goals-list-table")
    await user.click(await screen.findByTestId("goals-order-hint"))
    expect(
      await screen.findByTestId("goals-order-hint-content")
    ).toHaveTextContent("position in your account-wide priority order")
  })

  it("opens the order hint on keyboard focus and hides it when reordering is unavailable", async () => {
    twoProjects()
    const view = renderPage()
    await screen.findByTestId("goals-list-table")
    act(() => screen.getByTestId("goals-order-hint").focus())
    expect(
      await screen.findByTestId("goals-order-hint-content")
    ).toBeInTheDocument()
    view.unmount()

    listGoals.mockResolvedValue({ goals: [activeGoal] })
    renderPage()
    await screen.findByTestId("goals-list-table")
    expect(screen.queryByTestId("goals-order-hint")).toBeNull()
  })

  it("preselects the scoped project when creating a goal from the control row", async () => {
    twoProjects()
    const user = userEvent.setup()
    renderPage("/plan/goals?project=proj-2")

    await screen.findByTestId("goals-list-table")
    await vi.waitFor(() =>
      expect(screen.getAllByTestId("goal-row")).toHaveLength(1)
    )
    await user.click(screen.getByTestId("goals-create-goal"))
    expect(onLaunch).toHaveBeenCalledWith({ projectIds: ["proj-2"] })
  })

  it("holds the loading state on a deep-linked scope until its projects load, never the filtered-empty line", async () => {
    twoProjects()
    let resolveProjects!: (value: unknown) => void
    listProjects.mockReturnValue(
      new Promise((resolve) => {
        resolveProjects = resolve
      })
    )
    renderPage("/plan/goals?project=proj-2")

    // Goals have loaded, but the project list that validates the scope has not: no unscoped rows.
    await vi.waitFor(() => expect(listGoals).toHaveBeenCalled())
    expect(await screen.findByTestId("goals-page-loading")).toBeInTheDocument()
    expect(screen.queryByTestId("goal-row")).toBeNull()
    expect(screen.queryByTestId("goals-page-filtered-empty")).toBeNull()

    await act(async () => {
      resolveProjects({ projects: [overviewProject, otherProject] })
      await Promise.resolve()
    })
    await vi.waitFor(() =>
      expect(screen.getAllByTestId("goal-row")).toHaveLength(1)
    )
    expect(screen.queryByTestId("goals-page-loading")).toBeNull()
    expect(screen.queryByTestId("goals-page-filtered-empty")).toBeNull()
  })

  it("tells an empty project apart from a filter that matches nothing", async () => {
    listGoals.mockResolvedValue({ goals: [activeGoal] })
    listProjects.mockResolvedValue({
      projects: [overviewProject, otherProject],
    })
    membership = { "proj-1": [activeGoal.goalId] }
    const view = renderPage("/plan/goals?project=proj-2")

    expect(
      await screen.findByTestId("goals-page-empty-project")
    ).toHaveTextContent(
      "Use Manage goals on the Projects page to put existing goals into it"
    )
    expect(screen.queryByTestId("goals-page-filtered-empty")).toBeNull()
    expect(screen.queryByTestId("goals-page-empty")).toBeNull()
    view.unmount()

    const user = userEvent.setup()
    renderPage("/plan/goals?project=proj-1")
    await screen.findByTestId("goals-list-table")
    await user.click(screen.getByTestId("goals-status-filter"))
    await user.click(await screen.findByRole("option", { name: /^Reached/ }))
    expect(
      await screen.findByTestId("goals-page-filtered-empty")
    ).toBeInTheDocument()
    expect(screen.queryByTestId("goals-page-empty-project")).toBeNull()
  })

  describe("Season fit", () => {
    /** Battle Pass is Fixed (35 days from 2 Aug, season 40 there); Guild Raid has no dates. */
    const seasonDefinitions = [
      {
        id: "battle-pass",
        type: "BattlePass",
        recurrence: {
          kind: "Fixed",
          intervalDays: 35,
          durationDays: 34,
          anchorUtc: "2026-08-02T00:00:00Z",
        },
        requiredParameters: [],
        config: { seasonNumberAtAnchor: 40 },
      },
      {
        id: "guild-raid-season",
        type: "GuildRaidSeason",
        recurrence: {
          kind: "None",
          intervalDays: null,
          durationDays: null,
          anchorUtc: null,
        },
        requiredParameters: [],
        config: null,
      },
    ]

    beforeEach(async () => {
      await seedGameCatalog({
        "event-definitions": seasonDefinitions,
        "events-calendar": {},
      })
      vi.useFakeTimers({ toFake: ["Date"] })
      vi.setSystemTime(new Date("2026-10-27T12:00:00Z"))
      // goal-1 is done before Battle Pass season 42 ends on Nov 15, goal-b after it.
      insightsResult.value = {
        ...insightsResult.emptyResult,
        estimates: new Map([
          [
            activeGoal.goalId,
            { days: 14, date: "2026-11-09", energyTotal: 0, raidsTotal: 0 },
          ],
          [
            goalB.goalId,
            { days: 35, date: "2026-11-30", energyTotal: 0, raidsTotal: 0 },
          ],
        ]),
      }
      twoProjects()
    })

    afterEach(() => {
      vi.useRealTimers()
      window.localStorage.removeItem("goals.overview.seasonFit")
      window.localStorage.removeItem("goals.overview.group")
    })

    const fitOf = (goalId: string) =>
      document
        .querySelector(`[data-goal-id="${goalId}"]`)
        ?.getAttribute("data-season-fit")

    it("is off by default and shows no labels or divider", async () => {
      renderPage()

      await vi.waitFor(() =>
        expect(screen.getAllByTestId("goal-row")).toHaveLength(2)
      )
      expect(
        document.getElementById("goals-season-fit-value")
      ).toHaveTextContent("No season fit")
      expect(screen.queryByTestId("goal-season-fit")).toBeNull()
      expect(screen.queryByTestId("goals-season-cutoff")).toBeNull()
    })

    it("labels each goal and marks the cut-off once Battle Pass is chosen, and remembers the choice", async () => {
      const user = userEvent.setup()
      const view = renderPage()
      await vi.waitFor(() =>
        expect(screen.getAllByTestId("goal-row")).toHaveLength(2)
      )

      await user.click(screen.getByTestId("goals-season-fit"))
      expect(
        await screen.findByRole("option", { name: /Guild Raid/ })
      ).toHaveAttribute("aria-disabled", "true")
      expect(
        screen.getByRole("option", { name: /Guild Raid/ })
      ).toHaveTextContent("No season dates available yet")
      await user.click(screen.getByRole("option", { name: "Battle Pass" }))

      await vi.waitFor(() => expect(fitOf(activeGoal.goalId)).toBe("0"))
      expect(fitOf(goalB.goalId)).toBe("1")
      const labels = screen
        .getAllByTestId("goal-season-fit")
        .map((label) => label.textContent)
      expect(labels.toSorted()).toEqual(["Next season", "This season"])
      const cutoff = screen.getByTestId("goals-season-cutoff")
      expect(cutoff).toHaveTextContent(
        "Battle Pass season 42 ends Nov 15. The next goal finishes later."
      )
      expect(cutoff.nextElementSibling).toHaveAttribute(
        "data-goal-id",
        goalB.goalId
      )
      expect(within(cutoff).queryByRole("button")).toBeNull()

      view.unmount()
      renderPage()
      await vi.waitFor(() => expect(fitOf(goalB.goalId)).toBe("1"))
      expect(
        document.getElementById("goals-season-fit-value")
      ).toHaveTextContent("Battle Pass")
    })

    it("keeps the fit in a project scope and places the divider among that project's goals", async () => {
      window.localStorage.setItem("goals.overview.seasonFit", "battlePass")
      renderPage("/plan/goals?project=proj-2")

      await vi.waitFor(() =>
        expect(screen.getAllByTestId("goal-row")).toHaveLength(1)
      )
      await vi.waitFor(() => expect(fitOf(goalB.goalId)).toBe("1"))
      expect(
        screen.getByTestId("goals-season-cutoff").nextElementSibling
      ).toHaveAttribute("data-goal-id", goalB.goalId)
    })

    it("drops the divider but keeps the labels when the list is grouped", async () => {
      window.localStorage.setItem("goals.overview.seasonFit", "battlePass")
      window.localStorage.setItem("goals.overview.group", "type")
      renderPage()

      await vi.waitFor(() => expect(fitOf(goalB.goalId)).toBe("1"))
      expect(screen.getAllByTestId("goal-season-fit")).toHaveLength(2)
      expect(screen.queryByTestId("goals-season-cutoff")).toBeNull()
    })

    it("shows the same labels and divider on mobile cards", async () => {
      mobile.value = true
      window.localStorage.setItem("goals.overview.seasonFit", "battlePass")
      renderPage()

      await vi.waitFor(() =>
        expect(screen.getAllByTestId("goal-season-fit")).toHaveLength(2)
      )
      // Icon-only trigger: the value is announced but not shown.
      expect(
        screen
          .getByRole("combobox", { name: "Season fit" })
          .querySelector('[data-slot="select-value"]')
      ).toBeNull()
      const cutoff = screen.getByTestId("goals-season-cutoff")
      expect(cutoff.tagName).toBe("LI")
      expect(cutoff.nextElementSibling).toHaveAttribute("data-season-fit", "1")
    })
  })

  describe("URL state", () => {
    const search = () => screen.getByTestId("location-search").textContent
    const back = () => fireEvent.click(screen.getByTestId("history-back"))

    it("keeps the status and Type filters across a reload", async () => {
      listGoals.mockResolvedValue({
        goals: [activeGoal, { ...pausedGoal, goalType: "Ability" }],
      })
      const user = userEvent.setup()
      const view = renderPage()
      await screen.findByTestId("goals-list-table")

      await user.click(screen.getByTestId("goals-status-filter"))
      await user.click(await screen.findByRole("option", { name: /^Paused/ }))
      await user.click(screen.getByTestId("goals-type-filter"))
      await user.click(await screen.findByRole("option", { name: "Ability" }))
      const params = new URLSearchParams(search() ?? "")
      expect(params.get("status")).toBe("paused")
      expect(params.get("type")).toBe("Ability")
      view.unmount()

      renderPage(`/plan/goals?${params}`)
      await screen.findByTestId("goals-list-table")
      expect(screen.getByTestId("goals-status-filter")).toHaveTextContent(
        /^Paused/
      )
      expect(
        document.getElementById("goals-type-filter-value")
      ).toHaveTextContent("Ability")
      expect(screen.getAllByTestId("goal-row")).toHaveLength(1)
      expect(
        screen.getByTestId(`goal-row-menu-${pausedGoal.goalId}`)
      ).toBeInTheDocument()
    })

    it("opens a shared project and status link with both applied", async () => {
      const pausedB = { ...pausedGoal, goalId: "goal-p2", entityId: "hero2" }
      listGoals.mockResolvedValue({ goals: [activeGoal, goalB, pausedB] })
      listProjects.mockResolvedValue({
        projects: [overviewProject, otherProject],
      })
      membership = {
        "proj-1": [activeGoal.goalId],
        "proj-2": [goalB.goalId, pausedB.goalId],
      }
      renderPage("/plan/goals?project=proj-2&status=paused")

      await vi.waitFor(() =>
        expect(screen.getAllByTestId("goal-row")).toHaveLength(1)
      )
      expect(screen.getByTestId("goal-row")).toHaveAttribute(
        "data-goal-id",
        pausedB.goalId
      )
      expect(screen.getByTestId("goals-status-filter")).toHaveTextContent(
        /^Paused/
      )
      expect(
        screen.getByTestId("goals-project-scope-chip-proj-2")
      ).toHaveAttribute("aria-pressed", "true")
    })

    it("adds no history entry per filter change, so Back leaves the page", async () => {
      listGoals.mockResolvedValue({ goals: [activeGoal, pausedGoal] })
      const user = userEvent.setup()
      renderPage()
      await screen.findByTestId("goals-list-table")

      await user.click(screen.getByTestId("goals-status-filter"))
      await user.click(await screen.findByRole("option", { name: /^Paused/ }))
      await user.click(screen.getByTestId("goals-status-filter"))
      await user.click(await screen.findByRole("option", { name: /^Active/ }))
      expect(search()).toBe("?status=active")

      back()
      expect(screen.getByTestId("location-path")).toHaveTextContent("/home")
    })

    it("falls back to the defaults and drops unknown filter values from the URL", async () => {
      listGoals.mockResolvedValue({ goals: [activeGoal, pausedGoal] })
      renderPage("/plan/goals?status=nope&type=nope")

      await screen.findByTestId("goals-list-table")
      expect(screen.getByTestId("goals-status-filter")).toHaveTextContent(
        /^Unfulfilled/
      )
      expect(
        document.getElementById("goals-type-filter-value")
      ).toHaveTextContent("All goal types")
      expect(screen.getAllByTestId("goal-row")).toHaveLength(2)
      await vi.waitFor(() => expect(search()).toBe(""))
    })

    it("uses the defaults on a fresh load without parameters", async () => {
      listGoals.mockResolvedValue({ goals: [activeGoal] })
      renderPage()

      await screen.findByTestId("goals-list-table")
      expect(screen.getByTestId("goals-status-filter")).toHaveTextContent(
        /^Unfulfilled/
      )
      expect(
        document.getElementById("goals-type-filter-value")
      ).toHaveTextContent("All goal types")
      expect(search()).toBe("")
    })

    async function openEdit(goalId: string) {
      const user = userEvent.setup()
      await user.click(
        await screen.findByTestId(`goal-row-actions-trigger-${goalId}`)
      )
      await user.click(await screen.findByTestId(`goal-row-edit-${goalId}`))
      await screen.findByTestId("goal-edit-dialog")
    }

    it.each([
      ["Back", back],
      [
        "its close control",
        () => fireEvent.click(screen.getByTestId("goal-edit-close")),
      ],
    ])(
      "pushes ?goal= on Edit and %s closes the dialog keeping the other params",
      async (_, close) => {
        listGoals.mockResolvedValue({ goals: [activeGoal, pausedGoal] })
        renderPage("/plan/goals?status=paused")

        await openEdit(pausedGoal.goalId)
        expect(search()).toBe(`?status=paused&goal=${pausedGoal.goalId}`)

        close()
        await vi.waitFor(() =>
          expect(screen.queryByTestId("goal-edit-dialog")).toBeNull()
        )
        expect(screen.getByTestId("location-path")).toHaveTextContent(
          "/plan/goals"
        )
        expect(search()).toBe("?status=paused")
      }
    )

    it("reopens the dialog from ?goal= once the list has loaded, and its close control stays on the page", async () => {
      // Both the list and the archived (cascade) read wait on the same release.
      const pending: (() => void)[] = []
      const releaseGoals = () => pending.forEach((release) => release())
      listGoals.mockImplementation(
        () =>
          new Promise((resolve) => {
            pending.push(() => resolve({ goals: [activeGoal] }))
          })
      )
      renderPage(`/plan/goals?goal=${activeGoal.goalId}`)

      await vi.waitFor(() => expect(listGoals).toHaveBeenCalled())
      expect(screen.queryByTestId("goal-edit-dialog")).toBeNull()
      expect(search()).toBe(`?goal=${activeGoal.goalId}`)

      await act(async () => releaseGoals())
      expect(await screen.findByTestId("goal-edit-dialog")).toHaveTextContent(
        activeGoal.goalId
      )

      // Restored, not pushed by this page: closing replaces the param away instead of going Back.
      fireEvent.click(screen.getByTestId("goal-edit-close"))
      await vi.waitFor(() =>
        expect(screen.queryByTestId("goal-edit-dialog")).toBeNull()
      )
      expect(screen.getByTestId("location-path")).toHaveTextContent(
        "/plan/goals"
      )
      expect(search()).toBe("")
      back()
      expect(screen.getByTestId("location-path")).toHaveTextContent("/home")
    })

    it("opens nothing for an unknown ?goal= and drops it from the URL", async () => {
      listGoals.mockResolvedValue({ goals: [activeGoal] })
      renderPage("/plan/goals?goal=not-a-goal")

      await screen.findByTestId("goals-list-table")
      expect(screen.getAllByTestId("goal-row")).toHaveLength(1)
      await vi.waitFor(() => expect(search()).toBe(""))
      expect(screen.queryByTestId("goal-edit-dialog")).toBeNull()
    })
  })
})

describe("GoalsPage bulk actions", () => {
  const goalB = { ...activeGoal, goalId: "goal-b", entityId: "hero1" }
  const pausedB = { ...pausedGoal, goalId: "goal-p", entityId: "hero1" }

  beforeEach(async () => {
    listGoals.mockReset()
    listProjects.mockReset()
    membership = {}
    listProjects.mockResolvedValue({ projects: [] })
    setTestAuth({ authenticated: true })
    await seedGameCatalog({ characters: catalogCharacters })
    updateGoalsStatus
      .mockReset()
      .mockResolvedValue({ goals: [], orderRevision: 0 })
    deleteGoal.mockReset().mockResolvedValue({})
    mobile.value = false
    onLaunch.mockReset()
    insightsResult.value = insightsResult.emptyResult
    listGoals.mockResolvedValue({
      goals: [
        { ...activeGoal, globalPriority: 1 },
        { ...goalB, globalPriority: 2 },
        { ...pausedB, globalPriority: 3 },
      ],
    })
  })

  const select = (user: ReturnType<typeof userEvent.setup>, id: string) =>
    user.click(screen.getByTestId(`goal-row-select-${id}`))

  it("lays out an actions row (Create goal first) above a filters row", async () => {
    renderPage()
    await screen.findByTestId("goals-list-table")

    const actions = screen.getByTestId("goals-actions-row")
    const filters = screen.getByTestId("goals-filters-row")
    expect(
      actions.compareDocumentPosition(filters) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(actions.querySelector("button")).toBe(
      screen.getByTestId("goals-create-goal")
    )
    expect(actions).toContainElement(screen.getByTestId("goals-bulk-actions"))
    expect(actions).toContainElement(
      screen.getByTestId("goals-planning-settings")
    )
    expect(filters).toContainElement(screen.getByTestId("goals-status-filter"))
    expect(filters).toContainElement(screen.getByTestId("goals-type-filter"))
  })

  it("disables every bulk action until something is selected, then enables the applicable ones", async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByTestId("goals-list-table")

    for (const key of ["pause", "resume", "addToProject", "delete"])
      expect(screen.getByTestId(`goals-bulk-${key}`)).toBeDisabled()

    await select(user, "goal-p")
    expect(screen.getByTestId("goals-bulk-pause")).toBeDisabled()
    expect(screen.getByTestId("goals-bulk-resume")).toBeEnabled()
    expect(screen.getByTestId("goals-bulk-delete")).toBeEnabled()
  })

  it("bulk pause acts on the selected active goals only, then clears the selection", async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByTestId("goals-list-table")

    await user.click(screen.getByTestId("goals-select-all"))
    await user.click(screen.getByTestId("goals-bulk-pause"))

    // One atomic request for every selected active goal.
    await vi.waitFor(() =>
      expect(updateGoalsStatus).toHaveBeenCalledExactlyOnceWith({
        goalIds: ["goal-1", "goal-b"],
        status: "Paused",
      })
    )
    await vi.waitFor(() =>
      expect(screen.getByTestId("goals-select-all")).not.toBeChecked()
    )
  })

  it("clears the selection when the status filter changes", async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByTestId("goals-list-table")
    await select(user, "goal-p")
    expect(screen.getByTestId("goals-bulk-delete")).toBeEnabled()

    await user.click(screen.getByTestId("goals-status-filter"))
    await user.click(await screen.findByRole("option", { name: /^Paused/ }))

    await vi.waitFor(() =>
      expect(screen.getByTestId("goals-bulk-delete")).toBeDisabled()
    )
    expect(screen.getByTestId("goal-row-select-goal-p")).not.toBeChecked()
  })

  it("confirms bulk delete once, removes the rows before the requests resolve and empties the selection; cancel keeps it", async () => {
    deleteGoal.mockReturnValue(new Promise(() => undefined))
    const user = userEvent.setup()
    renderPage()
    await screen.findByTestId("goals-list-table")
    await user.click(screen.getByTestId("goals-select-all"))

    await user.click(screen.getByTestId("goals-bulk-delete"))
    expect(await screen.findByTestId("delete-goal-dialog")).toBeInTheDocument()
    await user.click(screen.getByText("Cancel"))
    expect(deleteGoal).not.toHaveBeenCalled()
    expect(screen.getByTestId("goal-row-select-goal-1")).toBeChecked()

    await user.click(screen.getByTestId("goals-bulk-delete"))
    await user.click(await screen.findByTestId("delete-goal-confirm"))

    await vi.waitFor(() =>
      expect(screen.queryAllByTestId("goal-row")).toHaveLength(0)
    )
    expect(deleteGoal).toHaveBeenCalledWith("goal-1")
  })

  it("adds the selection to the chosen project keeping existing memberships", async () => {
    listProjects.mockResolvedValue({
      projects: [overviewProject, otherProject],
    })
    membership = { "proj-1": [activeGoal.goalId] }
    const user = userEvent.setup()
    renderPage()
    await screen.findByTestId("goals-list-table")
    await vi.waitFor(() =>
      expect(screen.getByTestId("goal-row-menu-goal-1")).toBeInTheDocument()
    )
    await select(user, "goal-1")

    await user.click(screen.getByTestId("goals-bulk-addToProject"))
    await user.click(await screen.findByTestId("project-picker-option-proj-2"))

    await vi.waitFor(() =>
      expect(updateProjectGoals).toHaveBeenCalledExactlyOnceWith("proj-2", {
        goals: [{ goalId: "goal-1" }],
        expectedGoalIds: [],
      })
    )
  })

  describe("scoped to a project", () => {
    /** proj-1 holds goal-1 (its only project) and goal-b, which is also in proj-2. */
    function scopedMemberships() {
      listProjects.mockResolvedValue({
        projects: [overviewProject, otherProject],
      })
      membership = {
        "proj-1": [activeGoal.goalId, goalB.goalId],
        "proj-2": [goalB.goalId],
      }
      updateProjectGoals.mockReset().mockResolvedValue({ goals: [] })
    }

    it("offers no project removal when the page is not scoped", async () => {
      scopedMemberships()
      const user = userEvent.setup()
      renderPage()
      await screen.findByTestId("goals-list-table")
      await vi.waitFor(() =>
        expect(screen.getAllByTestId("goal-row")).toHaveLength(3)
      )

      expect(screen.queryByTestId("goals-bulk-removeFromProject")).toBeNull()
      await user.click(screen.getByTestId("goal-row-actions-trigger-goal-b"))
      await screen.findByTestId("goal-row-delete-goal-b")
      expect(
        screen.queryByTestId("goal-row-remove-from-project-goal-b")
      ).toBeNull()
    })

    it("removes a row with another project straight from its menu", async () => {
      scopedMemberships()
      const user = userEvent.setup()
      renderPage("/plan/goals?project=proj-1")
      await vi.waitFor(() =>
        expect(screen.getAllByTestId("goal-row")).toHaveLength(2)
      )

      await user.click(screen.getByTestId("goal-row-actions-trigger-goal-b"))
      const item = await screen.findByTestId(
        "goal-row-remove-from-project-goal-b"
      )
      expect(item).toHaveTextContent("Remove from this project")
      await user.click(item)

      await vi.waitFor(() =>
        expect(updateProjectGoals).toHaveBeenCalledExactlyOnceWith("proj-1", {
          goals: [{ goalId: "goal-1" }],
          expectedGoalIds: ["goal-1", "goal-b"],
        })
      )
      expect(screen.queryByTestId("project-picker-dialog")).toBeNull()
    })

    it("asks where to move a row whose only project is the scoped one", async () => {
      scopedMemberships()
      const user = userEvent.setup()
      renderPage("/plan/goals?project=proj-1")
      await vi.waitFor(() =>
        expect(screen.getAllByTestId("goal-row")).toHaveLength(2)
      )

      await user.click(screen.getByTestId("goal-row-actions-trigger-goal-1"))
      const item = await screen.findByTestId(
        "goal-row-remove-from-project-goal-1"
      )
      expect(item).toHaveTextContent("Move to project")
      await user.click(item)
      await user.click(
        await screen.findByTestId("project-picker-option-proj-2")
      )

      await vi.waitFor(() =>
        expect(updateProjectGoals).toHaveBeenCalledTimes(2)
      )
      expect(updateProjectGoals).toHaveBeenNthCalledWith(1, "proj-2", {
        goals: [{ goalId: "goal-b" }, { goalId: "goal-1" }],
        expectedGoalIds: ["goal-b"],
      })
      expect(updateProjectGoals).toHaveBeenNthCalledWith(2, "proj-1", {
        goals: [{ goalId: "goal-b" }],
        expectedGoalIds: ["goal-1", "goal-b"],
      })
    })

    it("bulk-removes the selection, moving only the goals with no other project", async () => {
      scopedMemberships()
      const user = userEvent.setup()
      renderPage("/plan/goals?project=proj-1")
      await vi.waitFor(() =>
        expect(screen.getAllByTestId("goal-row")).toHaveLength(2)
      )
      await select(user, "goal-1")
      await select(user, "goal-b")

      await user.click(screen.getByTestId("goals-bulk-removeFromProject"))
      await user.click(
        await screen.findByTestId("project-picker-option-proj-2")
      )

      await vi.waitFor(() =>
        expect(updateProjectGoals).toHaveBeenCalledTimes(2)
      )
      expect(updateProjectGoals).toHaveBeenNthCalledWith(1, "proj-2", {
        goals: [{ goalId: "goal-b" }, { goalId: "goal-1" }],
        expectedGoalIds: ["goal-b"],
      })
      expect(updateProjectGoals).toHaveBeenNthCalledWith(2, "proj-1", {
        goals: [],
        expectedGoalIds: ["goal-1", "goal-b"],
      })
      // Both goals left the scoped project, so their rows leave its list.
      await vi.waitFor(() =>
        expect(screen.queryAllByTestId("goal-row")).toHaveLength(0)
      )
    })

    it("names removal as the alternative in the delete confirmation", async () => {
      scopedMemberships()
      const user = userEvent.setup()
      renderPage("/plan/goals?project=proj-1")
      await vi.waitFor(() =>
        expect(screen.getAllByTestId("goal-row")).toHaveLength(2)
      )

      await user.click(screen.getByTestId("goal-row-actions-trigger-goal-b"))
      await user.click(await screen.findByTestId("goal-row-delete-goal-b"))

      expect(
        await screen.findByTestId("delete-goal-project-alternative")
      ).toHaveTextContent(
        "To take it out of My Goals only, cancel and use “Remove from this project” instead."
      )
    })
  })

  it("opens project creation instead of a picker when there is no project", async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByTestId("goals-list-table")
    await select(user, "goal-1")

    await user.click(screen.getByTestId("goals-bulk-addToProject"))

    expect(await screen.findByTestId("manage-projects-sheet")).toBeVisible()
    expect(screen.queryByTestId("project-picker-dialog")).toBeNull()
  })

  describe("on mobile", () => {
    beforeEach(() => {
      mobile.value = true
    })

    it("enters select mode with a bar showing zero selected and disabled actions, and Done clears it", async () => {
      const user = userEvent.setup()
      renderPage()
      await screen.findByTestId("goals-list-cards")

      await user.click(screen.getByTestId("goals-mobile-select-toggle"))
      const bar = await screen.findByTestId("mobile-select-bar")
      expect(within(bar).getByTestId("mobile-select-count")).toHaveTextContent(
        "0 selected"
      )
      expect(screen.getByTestId("goals-bulk-delete")).toBeDisabled()

      await user.click(screen.getByTestId("goal-row-select-goal-1"))
      expect(screen.getByTestId("goals-bulk-delete")).toBeEnabled()

      await user.click(screen.getByTestId("mobile-select-done"))
      expect(screen.queryByTestId("mobile-select-bar")).toBeNull()
      expect(screen.queryByTestId("goal-row-select-goal-1")).toBeNull()
    })

    it("leaves select mode when reorder mode is entered", async () => {
      const user = userEvent.setup()
      renderPage()
      await screen.findByTestId("goals-list-cards")
      await user.click(screen.getByTestId("goals-mobile-select-toggle"))
      await screen.findByTestId("mobile-select-bar")

      await user.click(screen.getByTestId("goals-mobile-reorder-toggle"))

      expect(screen.queryByTestId("mobile-select-bar")).toBeNull()
      expect(screen.getByTestId("mobile-reorder-bar")).toBeInTheDocument()
    })
  })
})
