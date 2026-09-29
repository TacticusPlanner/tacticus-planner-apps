import { useEffect, useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@/test/render"
import userEvent from "@testing-library/user-event"

vi.mock("@/shared/tour", () => ({
  useTourPageSteps: () => undefined,
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
  getOnslaughtRewards: () => [],
  getShops: () => Promise.resolve([]),
}))

const getPlayerCharacters = vi.fn<() => unknown[]>(() => [])

vi.mock("@workspace/player-data/queries", () => ({
  getPlayerCharacter: () => Promise.resolve(undefined),
  getPlayerMow: () => Promise.resolve(undefined),
  getPlayerCharacters: (...args: unknown[]) =>
    Promise.resolve(getPlayerCharacters(...(args as []))),
  getPlayerMows: () => Promise.resolve([]),
  getInventoryUpgrades: () => Promise.resolve(undefined),
  getPlayerInventoryItems: () => Promise.resolve([]),
  getInventoryShard: () => Promise.resolve(undefined),
  getLiveProgress: () => undefined,
}))

const listGoals = vi.fn()
const listProjects = vi.fn()
const createProject = vi.fn()
const createGoal = vi.fn()
const updateGoalStatus = vi.fn()
const deleteGoal = vi.fn()
const getGoalDetail = vi.fn<(goalId: string) => Promise<unknown>>(() =>
  Promise.resolve(undefined)
)

vi.mock("@/entities/goal", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/goal")>()),
  listGoals: (...args: unknown[]) => listGoals(...args),
  createGoal: (...args: unknown[]) => createGoal(...args),
  updateGoalStatus: (...args: unknown[]) => updateGoalStatus(...args),
  deleteGoal: (...args: unknown[]) => deleteGoal(...args),
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
vi.mock("../../model/insights/use-plan-insights", () => ({
  usePlanInsights: () => ({
    loading: false,
    result: {
      estimates: new Map(),
      potentialProgressByGoalId: new Map(),
      levelPotentialProgressByGoalId: new Map(),
      levelXpRemainingByGoalId: new Map(),
      rankSlotsByGoalId: new Map(),
    },
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

import { GoalsPage } from ".//goals-page"
import { CreateGoalLauncherProvider } from "../../model/goal-creation-form/create-goal-launcher"

const onLaunch = vi.fn()

function renderPage() {
  return render(
    <CreateGoalLauncherProvider onLaunch={onLaunch}>
      <GoalsPage />
    </CreateGoalLauncherProvider>
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
      expect(screen.getByTestId("goals-filter-group")).toContainElement(button)
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
      screen.getByTestId(`goal-row-delete-${activeGoal.goalId}`)
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
      screen.getByTestId(`goal-row-delete-${pausedGoal.goalId}`)
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
      screen.getByTestId(`goal-row-delete-${activeGoal.goalId}`)
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

  it("retains non-archived status counts while Archived is selected", async () => {
    listGoals.mockImplementation((options?: { archived?: boolean }) =>
      Promise.resolve({
        goals: options?.archived ? [archivedGoal] : [activeGoal],
      })
    )
    const user = userEvent.setup()
    renderPage()

    await screen.findByTestId("goals-list-table")
    await user.click(screen.getByTestId("goals-status-filter"))
    await user.click(
      await screen.findByRole("option", { name: "goals.tabs.archived (1)" })
    )

    await user.click(screen.getByTestId("goals-status-filter"))
    expect(
      await screen.findByRole("option", { name: "goals.tabs.toReach (1)" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("option", { name: "goals.tabs.archived (1)" })
    ).toBeInTheDocument()
  })

  it("opens the goal detail sheet when clicking anywhere on the row", async () => {
    listGoals.mockResolvedValue({ goals: [activeGoal] })
    const user = userEvent.setup()
    renderPage()

    const row = await screen.findByTestId("goal-row")
    await user.click(row)

    expect(await screen.findByTestId("goal-detail-sheet")).toBeInTheDocument()
  })

  it("does not open the goal detail sheet when using a row action", async () => {
    listGoals.mockResolvedValue({ goals: [activeGoal] })
    const user = userEvent.setup()
    renderPage()

    await screen.findByTestId("goal-row")
    await user.click(screen.getByTestId(`goal-row-delete-${activeGoal.goalId}`))

    expect(screen.queryByTestId("goal-detail-sheet")).not.toBeInTheDocument()
  })

  it("opens ungrouped, unlike project detail", async () => {
    listGoals.mockResolvedValue({
      goals: [
        activeGoal,
        { ...activeGoal, goalId: "goal-2", goalType: "Ability" },
      ],
    })
    renderPage()

    await screen.findByTestId(`goal-row-delete-${activeGoal.goalId}`)
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

  it("carries project membership onto archived rows too", async () => {
    listGoals.mockImplementation((options?: { archived?: boolean }) =>
      Promise.resolve({
        goals: options?.archived ? [archivedGoal] : [activeGoal],
      })
    )
    listProjects.mockResolvedValue({ projects: [overviewProject] })
    listProjectGoals.mockResolvedValue({
      goals: [
        { goal: activeGoal, priority: 0 },
        { goal: archivedGoal, priority: 1 },
      ],
    })
    const user = userEvent.setup()
    renderPage()

    await screen.findByTestId("goals-list-table")
    await user.click(screen.getByTestId("goals-status-filter"))
    await user.click(
      await screen.findByRole("option", { name: "goals.tabs.archived (1)" })
    )

    const row = await screen.findByTestId("goal-row")
    expect(
      within(row).getByTestId("goal-project-memberships")
    ).toHaveTextContent("My Goals")
  })

  it("offers no project-removal action, because Overview has no project scope", async () => {
    listGoals.mockResolvedValue({ goals: [activeGoal] })
    listProjects.mockResolvedValue({ projects: [overviewProject] })
    listProjectGoals.mockResolvedValue({
      goals: [{ goal: activeGoal, priority: 0 }],
    })
    renderPage()

    await screen.findByTestId(`goal-row-delete-${activeGoal.goalId}`)
    expect(
      screen.queryByTestId(`goal-row-remove-from-project-${activeGoal.goalId}`)
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId(`goal-row-move-to-project-${activeGoal.goalId}`)
    ).not.toBeInTheDocument()
  })
  it("applies no project filter initially, listing goals from every project", async () => {
    listGoals.mockResolvedValue({
      goals: [
        activeGoal,
        { ...activeGoal, goalId: "goal-b", entityId: "hero2" },
      ],
    })
    listProjects.mockResolvedValue({
      projects: [overviewProject, otherProject],
    })
    listProjectGoals.mockImplementation((projectId: string) =>
      Promise.resolve({
        goals:
          projectId === "proj-1"
            ? [{ goal: activeGoal, priority: 0 }]
            : [
                {
                  goal: { ...activeGoal, goalId: "goal-b", entityId: "hero2" },
                  priority: 0,
                },
              ],
      })
    )
    renderPage()

    await screen.findByTestId("goals-list-table")
    await vi.waitFor(() =>
      expect(screen.getAllByTestId("goal-row")).toHaveLength(2)
    )
    expect(
      document.getElementById("goals-project-filter-value")
    ).toHaveTextContent("goals.project.filterAll")
  })

  it("narrows the list to one project's goals without mutating anything", async () => {
    listGoals.mockResolvedValue({
      goals: [
        activeGoal,
        { ...activeGoal, goalId: "goal-b", entityId: "hero2" },
      ],
    })
    listProjects.mockResolvedValue({
      projects: [overviewProject, otherProject],
    })
    listProjectGoals.mockImplementation((projectId: string) =>
      Promise.resolve({
        goals:
          projectId === "proj-1"
            ? [{ goal: activeGoal, priority: 0 }]
            : [
                {
                  goal: { ...activeGoal, goalId: "goal-b", entityId: "hero2" },
                  priority: 0,
                },
              ],
      })
    )
    const user = userEvent.setup()
    renderPage()

    await screen.findByTestId("goals-list-table")
    await vi.waitFor(() =>
      expect(screen.getAllByTestId("goal-row")).toHaveLength(2)
    )

    await user.click(screen.getByTestId("goals-project-filter"))
    await user.click(await screen.findByRole("option", { name: "Event Prep" }))

    await vi.waitFor(() =>
      expect(screen.getAllByTestId("goal-row")).toHaveLength(1)
    )
    expect(screen.getByTestId("goal-row")).toHaveTextContent("hero2")
    // Narrowing a list is not selecting a project: nothing is written.
    expect(updateProjectGoals).not.toHaveBeenCalled()
    expect(updateProjectGoalsStatus).not.toHaveBeenCalled()
    expect(updateGoalStatus).not.toHaveBeenCalled()

    // Clearing the filter brings the other project's goal back with its membership intact.
    await user.click(screen.getByTestId("goals-project-filter"))
    await user.click(
      await screen.findByRole("option", { name: "goals.project.filterAll" })
    )
    await vi.waitFor(() =>
      expect(
        screen
          .getAllByTestId("goal-project-memberships")
          .some((node) => within(node).queryByText("My Goals"))
      ).toBe(true)
    )
  })

  it("narrows the Archived tab by project too, rather than emptying it", async () => {
    listGoals.mockImplementation((options?: { archived?: boolean }) =>
      Promise.resolve({
        goals: options?.archived
          ? [archivedGoal, { ...archivedGoal, goalId: "goal-archived-b" }]
          : [activeGoal],
      })
    )
    listProjects.mockResolvedValue({
      projects: [overviewProject, otherProject],
    })
    listProjectGoals.mockImplementation((projectId: string) =>
      Promise.resolve({
        goals:
          projectId === "proj-1"
            ? [{ goal: archivedGoal, priority: 0 }]
            : [
                {
                  goal: { ...archivedGoal, goalId: "goal-archived-b" },
                  priority: 0,
                },
              ],
      })
    )
    const user = userEvent.setup()
    renderPage()

    await screen.findByTestId("goals-list-table")
    await user.click(screen.getByTestId("goals-status-filter"))
    await user.click(
      await screen.findByRole("option", { name: /^goals\.tabs\.archived/ })
    )
    await vi.waitFor(() =>
      expect(screen.getAllByTestId("goal-row")).toHaveLength(2)
    )

    await user.click(screen.getByTestId("goals-project-filter"))
    await user.click(await screen.findByRole("option", { name: "Event Prep" }))

    await vi.waitFor(() =>
      expect(screen.getAllByTestId("goal-row")).toHaveLength(1)
    )
  })

  it("renders the project filter with the other filters, not in the status row", async () => {
    listGoals.mockResolvedValue({ goals: [] })
    renderPage()

    await screen.findByTestId("goals-page-empty")
    const group = screen.getByTestId("goals-filter-group")
    expect(group).toContainElement(screen.getByTestId("goals-project-filter"))
    expect(group).toContainElement(screen.getByTestId("goals-type-filter"))
    expect(group).not.toContainElement(
      screen.getByTestId("goals-status-filter")
    )
    expect(screen.getByTestId("goals-project-filter")).toHaveAccessibleName(
      "goals.project.filterLabel"
    )
  })

  it("compresses the project filter to an icon with an accessible name below 768px", async () => {
    mobile.value = true
    listGoals.mockResolvedValue({ goals: [] })
    listProjects.mockResolvedValue({ projects: [overviewProject] })
    renderPage()

    await screen.findByTestId("goals-page-empty")
    const trigger = screen.getByTestId("goals-project-filter")
    expect(trigger).toHaveAccessibleName("goals.project.filterLabel")
    expect(screen.getByTestId("goals-filter-group")).toContainElement(trigger)
    expect(within(trigger).getByText("goals.project.filterAll")).toHaveClass(
      "sr-only"
    )
  })

  describe("project quick-nav Create project", () => {
    const newProject = {
      ...otherProject,
      projectId: "proj-3",
      name: "Fresh start",
    }

    it.each([false, true])(
      "opens the blank sheet, creates a project and keeps the route and membership filter (mobile: %s)",
      async (isMobile) => {
        mobile.value = isMobile
        listGoals.mockResolvedValue({ goals: [activeGoal] })
        listProjects.mockResolvedValue({
          projects: [overviewProject, otherProject],
        })
        createProject.mockImplementation(() => {
          listProjects.mockResolvedValue({
            projects: [overviewProject, otherProject, newProject],
          })
          return Promise.resolve(newProject)
        })
        const user = userEvent.setup()
        renderPage()

        await user.click(await screen.findByTestId("goals-project-filter"))
        await user.click(
          await screen.findByRole("option", { name: "Event Prep" })
        )
        expect(
          screen.getByTestId("goals-project-filter")
        ).toHaveAccessibleDescription("Event Prep")

        await user.click(
          await screen.findByTestId("overview-quicknav-create-project")
        )
        const sheet = await screen.findByTestId("manage-projects-sheet")
        expect(
          within(sheet).getByText("goals.project.newProjectTitle")
        ).toBeInTheDocument()
        expect(within(sheet).getByLabelText("goals.project.name")).toHaveValue(
          ""
        )

        await user.type(
          within(sheet).getByLabelText("goals.project.name"),
          "Fresh start"
        )
        await user.click(
          within(sheet).getByRole("button", { name: "goals.project.create" })
        )

        await vi.waitFor(() =>
          expect(createProject).toHaveBeenCalledWith({
            name: "Fresh start",
            description: null,
            color: null,
          })
        )
        await vi.waitFor(() =>
          expect(
            screen.queryByTestId("manage-projects-sheet")
          ).not.toBeInTheDocument()
        )
        expect(listProjects.mock.calls.length).toBeGreaterThan(1)
        if (!isMobile)
          expect(
            await screen.findByTestId("overview-quicknav-chip-proj-3")
          ).toBeInTheDocument()
        expect(
          screen.getByTestId("goals-project-filter")
        ).toHaveAccessibleDescription("Event Prep")
        expect(navigateMock).not.toHaveBeenCalled()
      }
    )

    it.each([false, true])(
      "keeps the sheet open with the entered fields when saving fails (mobile: %s)",
      async (isMobile) => {
        mobile.value = isMobile
        listGoals.mockResolvedValue({ goals: [] })
        listProjects.mockResolvedValue({ projects: [overviewProject] })
        createProject.mockRejectedValue(new Error("boom"))
        const user = userEvent.setup()
        renderPage()

        // Wait for the loaded state so the click lands on the control that stays mounted.
        await screen.findByTestId(
          isMobile ? "overview-quicknav-mobile" : "overview-quicknav-desktop"
        )
        await user.click(
          await screen.findByTestId("overview-quicknav-create-project")
        )
        const sheet = await screen.findByTestId("manage-projects-sheet")
        await user.type(
          within(sheet).getByLabelText("goals.project.name"),
          "Retry me"
        )
        await user.type(
          within(sheet).getByLabelText("goals.project.description"),
          "Some notes"
        )
        await user.click(
          within(sheet).getByRole("button", { name: "goals.project.create" })
        )

        await vi.waitFor(() => expect(createProject).toHaveBeenCalledTimes(1))
        expect(screen.getByTestId("manage-projects-sheet")).toBeInTheDocument()
        expect(within(sheet).getByLabelText("goals.project.name")).toHaveValue(
          "Retry me"
        )
        expect(
          within(sheet).getByLabelText("goals.project.description")
        ).toHaveValue("Some notes")
        expect(navigateMock).not.toHaveBeenCalled()
      }
    )

    it.each([false, true])(
      "still offers Create project when there are no projects (mobile: %s)",
      async (isMobile) => {
        mobile.value = isMobile
        listGoals.mockResolvedValue({ goals: [] })
        listProjects.mockResolvedValue({ projects: [] })
        createProject.mockResolvedValue(newProject)
        const user = userEvent.setup()
        renderPage()

        await screen.findByTestId("goals-page-empty")
        await screen.findByTestId(
          isMobile ? "overview-quicknav-empty" : "overview-quicknav-create-only"
        )
        if (isMobile) {
          expect(
            screen.getByTestId("overview-quicknav-empty")
          ).toBeInTheDocument()
          expect(
            screen.queryByText("home.projects.emptyAction")
          ).not.toBeInTheDocument()
        }
        await user.click(
          await screen.findByTestId("overview-quicknav-create-project")
        )
        const sheet = await screen.findByTestId("manage-projects-sheet")
        await user.type(
          within(sheet).getByLabelText("goals.project.name"),
          "Fresh start"
        )
        await user.click(
          within(sheet).getByRole("button", { name: "goals.project.create" })
        )

        await vi.waitFor(() =>
          expect(createProject).toHaveBeenCalledWith({
            name: "Fresh start",
            description: null,
            color: null,
          })
        )
        await vi.waitFor(() =>
          expect(
            screen.queryByTestId("manage-projects-sheet")
          ).not.toBeInTheDocument()
        )
        expect(navigateMock).not.toHaveBeenCalled()
      }
    )
  })
})
