import { useEffect, useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen, within } from "@/test/render"
import userEvent from "@testing-library/user-event"

vi.mock("@/shared/tour", () => ({
  useTourPageSteps: () => undefined,
}))

// The dialog has its own tests; here only which goal the page hands it matters.
vi.mock("../goal-edit/goal-edit-dialog", () => ({
  GoalEditDialog: ({ goalId }: { goalId: string | null }) =>
    goalId ? <div data-testid="goal-edit-dialog">{goalId}</div> : null,
}))

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: (
    querier: () => unknown,
    deps: unknown[] = [],
    defaultResult?: unknown
  ) => {
    const [value, setValue] = useState<unknown>(defaultResult)
    useEffect(() => {
      const result = querier()
      if (result instanceof Promise) {
        let active = true
        void result.then((resolved) => {
          if (active) setValue(resolved)
        })
        return () => {
          active = false
        }
      }
      setValue(result)
      return undefined
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)
    return value
  },
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) =>
      opts?.defaultValue ?? key,
  }),
}))

vi.mock("@/entities/player-data-override", () => ({
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
          imperial: { sector: "Stone", tier: 1 },
          xenos: { sector: "Stone", tier: 1 },
          chaos: { sector: "Stone", tier: 1 },
          revision: 1,
        }),
    }),
  },
  getOnslaughtProgress: () =>
    Promise.resolve({
      imperial: { sector: "Stone", tier: 1 },
      xenos: { sector: "Stone", tier: 1 },
      chaos: { sector: "Stone", tier: 1 },
      revision: 1,
    }),
  progressForAlliance: (progress: Record<string, unknown>, alliance: string) =>
    progress[alliance.toLowerCase()],
  onslaughtReward: () => ({ min: 2, max: 3, mythic: false }),
}))

vi.mock("@/entities/planning-setting", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/entities/planning-setting")>()
  return {
    ...actual,
    dailyEnergyTiers: [288, 378, 438, 538, 638, 738, 838, 938],
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

const account = { homeAccountId: "acc-1", username: "test@example.com" }

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({
    accounts: [account],
    instance: { getActiveAccount: () => account },
  }),
  useIsAuthenticated: () => true,
}))

const characters = new Map([
  [
    "hero1",
    {
      id: "hero1",
      name: "Hero One",
      faction: "Ultramarines",
      rankUpUpgrades: [{ rank: "Stone1", upgradeIds: ["h1"] }],
    },
  ],
])

vi.mock("@workspace/game-catalog/queries", () => ({
  getCharactersMap: () => characters,
  getMowsMap: () => new Map(),
  getUpgrades: () => [],
  getCampaignBattles: () => [],
  getCampaignDefinitions: () => [],
  getAscensionCostsMap: () => new Map(),
  getUnlockShardCostsMap: () => new Map(),
  getMowUpgradeCosts: () => [],
  getCharacterAbilityCosts: () => [],
  getOnslaughtRewards: () => [],
  getShops: () => Promise.resolve([]),
}))

const getPlayerCharacters = vi.fn<() => unknown[]>(() => [])

vi.mock("@workspace/player-data/queries", () => ({
  getCampaignEventProgress: async () => [],
  getCampaignProgress: vi.fn(async () => []),
  getPlayerCharacter: () => Promise.resolve(undefined),
  getPlayerMow: () => Promise.resolve(undefined),
  getPlayerCharacters: (...args: unknown[]) =>
    Promise.resolve(getPlayerCharacters(...(args as []))),
  getPlayerMows: () => Promise.resolve([]),
  getInventoryUpgrades: () => Promise.resolve(undefined),
  getPlayerInventoryItems: () => Promise.resolve([]),
  getInventoryAbilityMaterials: () => Promise.resolve(undefined),
  getInventoryShard: () => Promise.resolve(undefined),
  getLiveProgress: () => undefined,
}))

const listGoals = vi.fn()
const listProjects = vi.fn()
const createProject = vi.fn()
const createGoal = vi.fn()
const updateGoalStatus = vi.fn()
const deleteGoal = vi.fn()
const updateGoalProjects = vi.fn()
const getGoalDetail = vi.fn<(goalId: string) => Promise<unknown>>(() =>
  Promise.resolve(undefined)
)

vi.mock("@/entities/goal", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/goal")>()),
  listGoals: (...args: unknown[]) => listGoals(...args),
  createGoal: (...args: unknown[]) => createGoal(...args),
  updateGoalStatus: (...args: unknown[]) => updateGoalStatus(...args),
  deleteGoal: (...args: unknown[]) => deleteGoal(...args),
  updateGoalProjects: (...args: unknown[]) => updateGoalProjects(...args),
  goalQueries: {
    all: () => ["goals"],
    list: (archived: boolean) => ({
      queryKey: ["goals", "list", { archived }],
      queryFn: () => listGoals({ archived }),
    }),
    detail: (goalId: string) => ({
      queryKey: ["goals", "detail", goalId],
      queryFn: () => getGoalDetail(goalId),
    }),
  },
}))

const listProjectGoals = vi.fn()
const updateProjectGoals = vi.fn()
const updateProjectGoalsStatus = vi.fn()

vi.mock("@/entities/project", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/project")>()),
  listProjects: (...args: unknown[]) => listProjects(...args),
  createProject: (...args: unknown[]) => createProject(...args),
  listProjectGoals: (...args: unknown[]) => listProjectGoals(...args),
  updateProjectGoals: (...args: unknown[]) => updateProjectGoals(...args),
  updateProjectGoalsStatus: (...args: unknown[]) =>
    updateProjectGoalsStatus(...args),
  projectQueries: {
    all: () => ["projects"],
    list: () => ({
      queryKey: ["projects", "list"],
      queryFn: () => listProjects(),
    }),
    goals: (projectId: string) => ({
      queryKey: ["projects", projectId, "goals"],
      queryFn: () => listProjectGoals(projectId),
    }),
  },
}))

// Below 768px the quick-nav's project list is read through the real `listProjects`, so route that one
// endpoint to the same double.
vi.mock("@/shared/api", () => ({
  ApiError: class ApiError extends Error {},
  apiGet: (path: string) =>
    path === "/api/v1/me/projects"
      ? listProjects()
      : Promise.resolve({ goals: [] }),
}))

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
  value: {} as Record<string, unknown>,
}))
insightsResult.value = insightsResult.emptyResult

vi.mock("../../model/insights/use-plan-insights", () => ({
  usePlanInsights: () => ({
    loading: false,
    result: insightsResult.value,
  }),
}))
vi.mock("@/features/goal-order", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/goal-order")>()),
  useGoalOrderActions: () => ({
    moveGoal: vi.fn(),
    pending: false,
    conflict: null,
    retry: vi.fn(),
    dismissConflict: vi.fn(),
  }),
}))

const mobile = vi.hoisted(() => ({ value: false }))

vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => mobile.value,
}))

const navigateMock = vi.hoisted(() => vi.fn())

vi.mock("react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router")>()),
  useNavigate: () => navigateMock,
}))

import { MemoryRouter, useLocation } from "react-router"

import { GoalsPage } from ".//goals-page"
import { CreateGoalLauncherProvider } from "../../model/goal-creation-form/create-goal-launcher"

const onLaunch = vi.fn()

function LocationProbe() {
  return <span data-testid="location-search">{useLocation().search}</span>
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
  aggregateId: null,
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
  revision: 0,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
}

describe("GoalsPage", () => {
  beforeEach(() => {
    listGoals.mockReset()
    listProjects.mockReset()
    createProject.mockReset()
    navigateMock.mockReset()
    listProjectGoals.mockReset()
    listProjectGoals.mockResolvedValue({ goals: [] })
    listProjects.mockResolvedValue({ projects: [] })
    getGoalDetail.mockReset().mockResolvedValue(undefined)
    getPlayerCharacters.mockReset().mockReturnValue([])
    updateProjectGoals.mockReset()
    updateProjectGoalsStatus.mockReset()
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
      expect(button).toHaveAccessibleName("goals.createButton")
      // Desktop: Create goal leads the actions row. Mobile: it sits in the icon row.
      expect(
        screen.getByTestId(
          isMobile ? "goals-filter-group" : "goals-actions-row"
        )
      ).toContainElement(button)
      if (isMobile)
        expect(within(button).queryByText("goals.createButton")).toBeNull()
      else expect(button).toHaveTextContent("goals.createButton")

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
    expect(settingsButton).toHaveAccessibleName("goals.planningSettings.button")

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
    expect(group).toHaveAccessibleName("goals.filters.groupByLabel")
    expect(
      document.getElementById("goals-group-value")
    ).not.toBeEmptyDOMElement()

    await user.click(group)
    await user.click(
      screen.getByRole("option", { name: "goals.filters.groupByType" })
    )
    expect(group).toHaveAccessibleName("goals.filters.groupByLabel")
    expect(document.getElementById("goals-group-value")).toHaveTextContent(
      "goals.filters.groupByType"
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
    expect(screen.getByText("Hero One")).toBeInTheDocument()
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
    await user.click(
      await screen.findByRole("option", { name: "goals.tabs.reached (0)" })
    )

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
    await user.click(
      await screen.findByRole("option", { name: /^goals\.tabs\.paused/ })
    )

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
    await user.click(
      await screen.findByRole("option", { name: /^goals\.tabs\.active/ })
    )

    await screen.findByTestId("goals-list-table")
    expect(screen.getAllByTestId("goal-row")).toHaveLength(1)
    expect(
      screen.getByTestId(`goal-row-menu-${activeGoal.goalId}`)
    ).toBeInTheDocument()
  })

  it("selects the Blocked status without a live count and shows the filtered-empty state when nothing is blocked", async () => {
    listGoals.mockResolvedValue({ goals: [activeGoal] })
    const user = userEvent.setup()
    renderPage()

    await screen.findByTestId("goals-list-table")

    await user.click(screen.getByTestId("goals-status-filter"))
    expect(
      screen.getByRole("option", { name: "goals.tabs.blocked" })
    ).toBeInTheDocument()
    await user.click(screen.getByRole("option", { name: "goals.tabs.blocked" }))

    expect(
      await screen.findByTestId("goals-page-filtered-empty")
    ).toBeInTheDocument()
  })

  it("moves a goal to the Reached tab once its rank target is met", async () => {
    listGoals.mockResolvedValue({ goals: [activeGoal] })
    getGoalDetail.mockResolvedValue({
      goalId: activeGoal.goalId,
      entityType: "Character",
      entityId: "hero1",
      goalType: "Rank",
      status: "Active",
      notes: null,
      projectIds: [],
      dependsOn: [],
      events: [],
      updatedAt: activeGoal.updatedAt,
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
    })
    getPlayerCharacters.mockReturnValue([
      {
        unitId: "hero1",
        rank: "Stone1",
        appliedUpgradeSlots: [],
        progressionIndex: "Mythic:MythicWings",
        xpLevel: 60,
      },
    ])
    const user = userEvent.setup()
    renderPage()

    await screen.findByTestId("goals-list-table")

    await user.click(screen.getByTestId("goals-status-filter"))
    // Attainment may already be resolved by the time the dropdown opens (this test's mocks
    // resolve the goal as already meeting its rank target), so match the option by its status
    // label alone rather than an exact, timing-dependent count.
    await user.click(
      await screen.findByRole("option", { name: /^goals\.tabs\.reached/ })
    )

    expect(await screen.findByText("Hero One")).toBeInTheDocument()
    await vi.waitFor(() => {
      expect(screen.getByTestId("goals-status-filter")).toHaveTextContent("(1)")
    })
  })

  it("shows the available/needed XP-book count on a Rank goal's row from the plan's priority-ordered allocation", async () => {
    listGoals.mockResolvedValue({ goals: [activeGoal] })
    getGoalDetail.mockResolvedValue({
      goalId: activeGoal.goalId,
      entityType: "Character",
      entityId: "hero1",
      goalType: "Rank",
      status: "Active",
      notes: null,
      projectIds: [],
      dependsOn: [],
      events: [],
      updatedAt: activeGoal.updatedAt,
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
    })
    getPlayerCharacters.mockReturnValue([
      {
        unitId: "hero1",
        rank: "Stone1",
        appliedUpgradeSlots: [],
        progressionIndex: "Mythic:MythicWings",
        xpLevel: 31,
        xp: 82_000,
      },
    ])
    // 94,200 - 82,000 = 12,200 XP charged; a 100,000-XP pool at the default Legendary rarity
    // (12,500/book) is floor(100,000 / 12,500) = 8 available against ceil(12,200 / 12,500) = 1 needed.
    insightsResult.value = {
      ...insightsResult.emptyResult,
      levelChargedXpByGoalId: new Map([[activeGoal.goalId, 12_200]]),
      levelPoolXpAvailableByGoalId: new Map([[activeGoal.goalId, 100_000]]),
    }
    renderPage()

    const books = await screen.findByTestId("level-requirement-books")
    expect(books).toHaveTextContent("goals.resourceChips.xpBooksValue")
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
      await screen.findByRole("option", { name: "goals.tabs.toReach (1)" })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("option", { name: /^goals\.tabs\.archived/ })
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
      screen.queryByRole("heading", { name: "goals.create.goalTypes.Rank" })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: "goals.create.goalTypes.Ability" })
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
      await screen.findByRole("option", { name: "goals.filters.groupByType" })
    )

    expect(
      screen.getByRole("heading", { name: "goals.create.goalTypes.Rank" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "goals.create.goalTypes.Ability" })
    ).toBeInTheDocument()
  })

  it("shows project membership without a project switcher", async () => {
    listGoals.mockResolvedValue({ goals: [activeGoal] })
    listProjects.mockResolvedValue({ projects: [overviewProject] })
    listProjectGoals.mockResolvedValue({
      goals: [{ goal: activeGoal, priority: 0 }],
    })
    renderPage()

    expect(
      within(await screen.findByTestId("goal-project-memberships")).getByText(
        "My Goals"
      )
    ).toBeInTheDocument()
    expect(listProjectGoals).toHaveBeenCalledWith("proj-1")
  })

  it("offers no project-removal action, because Overview has no project scope", async () => {
    listGoals.mockResolvedValue({ goals: [activeGoal] })
    listProjects.mockResolvedValue({ projects: [overviewProject] })
    listProjectGoals.mockResolvedValue({
      goals: [{ goal: activeGoal, priority: 0 }],
    })
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
    listProjectGoals.mockImplementation((projectId: string) =>
      Promise.resolve({
        goals:
          projectId === "proj-1"
            ? [{ goal: activeGoal, priority: 0 }]
            : [{ goal: goalB, priority: 0 }],
      })
    )
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
      ).toEqual(["goals.project.scopeAll2", "My Goals1", "Event Prep1"])
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
    expect(updateGoalStatus).not.toHaveBeenCalled()

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
    expect(
      screen.getByRole("heading", { name: "goals.create.goalTypes.Rank" })
    ).toBeInTheDocument()

    await user.click(screen.getByTestId("goals-type-filter"))
    await user.click(
      await screen.findByRole("option", { name: "goals.create.goalTypes.Rank" })
    )
    await user.click(screen.getByTestId("goals-status-filter"))
    expect(
      await screen.findByRole("option", { name: "goals.tabs.toReach (1)" })
    ).toBeInTheDocument()
    await user.keyboard("{Escape}")

    await user.click(screen.getByTestId("goals-project-scope-all"))
    await vi.waitFor(() =>
      expect(screen.getAllByTestId("goal-row")).toHaveLength(2)
    )
    expect(
      screen.getByRole("heading", { name: "goals.create.goalTypes.Rank" })
    ).toBeInTheDocument()
    expect(
      document.getElementById("goals-type-filter-value")
    ).toHaveTextContent("goals.create.goalTypes.Rank")
    await user.click(screen.getByTestId("goals-status-filter"))
    expect(
      await screen.findByRole("option", { name: "goals.tabs.toReach (2)" })
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
    expect(content).toHaveTextContent("goals.order.listNote")
    expect(content).not.toHaveTextContent("goals.order.scopedNote")
    view.unmount()

    renderPage("/plan/goals?project=proj-1")
    await screen.findByTestId("goals-list-table")
    await user.click(await screen.findByTestId("goals-order-hint"))
    expect(
      await screen.findByTestId("goals-order-hint-content")
    ).toHaveTextContent("goals.order.scopedNote")
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

  it("tells an empty project apart from a filter that matches nothing", async () => {
    listGoals.mockResolvedValue({ goals: [activeGoal] })
    listProjects.mockResolvedValue({
      projects: [overviewProject, otherProject],
    })
    listProjectGoals.mockImplementation((projectId: string) =>
      Promise.resolve({
        goals:
          projectId === "proj-1" ? [{ goal: activeGoal, priority: 0 }] : [],
      })
    )
    const view = renderPage("/plan/goals?project=proj-2")

    expect(
      await screen.findByTestId("goals-page-empty-project")
    ).toHaveTextContent("goals.project.emptyProjectDescription")
    expect(screen.queryByTestId("goals-page-filtered-empty")).toBeNull()
    expect(screen.queryByTestId("goals-page-empty")).toBeNull()
    view.unmount()

    const user = userEvent.setup()
    renderPage("/plan/goals?project=proj-1")
    await screen.findByTestId("goals-list-table")
    await user.click(screen.getByTestId("goals-status-filter"))
    await user.click(
      await screen.findByRole("option", { name: /^goals\.tabs\.reached/ })
    )
    expect(
      await screen.findByTestId("goals-page-filtered-empty")
    ).toBeInTheDocument()
    expect(screen.queryByTestId("goals-page-empty-project")).toBeNull()
  })
})

describe("GoalsPage bulk actions", () => {
  const goalB = { ...activeGoal, goalId: "goal-b", entityId: "hero1" }
  const pausedB = { ...pausedGoal, goalId: "goal-p", entityId: "hero1" }

  beforeEach(() => {
    listGoals.mockReset()
    listProjects.mockReset()
    listProjectGoals.mockReset().mockResolvedValue({ goals: [] })
    listProjects.mockResolvedValue({ projects: [] })
    getGoalDetail.mockReset().mockResolvedValue(undefined)
    getPlayerCharacters.mockReset().mockReturnValue([])
    updateGoalStatus.mockReset().mockResolvedValue({})
    deleteGoal.mockReset().mockResolvedValue({})
    updateGoalProjects.mockReset().mockResolvedValue({})
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

    await vi.waitFor(() => expect(updateGoalStatus).toHaveBeenCalledTimes(2))
    expect(updateGoalStatus).toHaveBeenCalledWith("goal-1", "Paused")
    expect(updateGoalStatus).toHaveBeenCalledWith("goal-b", "Paused")
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
    await user.click(
      await screen.findByRole("option", { name: /^goals\.tabs\.paused/ })
    )

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
    await user.click(screen.getByText("goals.delete.cancel"))
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
    listProjectGoals.mockImplementation((projectId: string) =>
      Promise.resolve({
        goals:
          projectId === "proj-1" ? [{ goal: activeGoal, priority: 0 }] : [],
      })
    )
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
      expect(updateGoalProjects).toHaveBeenCalledExactlyOnceWith("goal-1", [
        "proj-1",
        "proj-2",
      ])
    )
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
        "goals.bulk.selected"
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
