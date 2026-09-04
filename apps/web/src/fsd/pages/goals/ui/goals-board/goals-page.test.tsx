import { useEffect, useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@/test/render"
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

vi.mock("@/entities/planning-setting", () => ({
  dailyEnergyTiers: [288, 378, 438, 538, 638, 738, 838, 938],
  usePlanningSettings: () => ({
    settings: { dailyEnergy: 288, revision: 1 },
    save: vi.fn(),
  }),
}))

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
const activateProject = vi.fn()
const updateProjectGoals = vi.fn()
const updateProjectGoalsStatus = vi.fn()

vi.mock("@/entities/project", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/project")>()),
  listProjects: (...args: unknown[]) => listProjects(...args),
  listProjectGoals: (...args: unknown[]) => listProjectGoals(...args),
  activateProject: (...args: unknown[]) => activateProject(...args),
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

vi.mock("@/shared/api", () => ({ ApiError: class ApiError extends Error {} }))

import { GoalsPage } from ".//goals-page"
import { CreateGoalLauncherProvider } from "../../model/goal-creation-form/create-goal-launcher"

function renderPage() {
  return render(
    <CreateGoalLauncherProvider onLaunch={vi.fn()}>
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

describe("GoalsPage", () => {
  beforeEach(() => {
    listGoals.mockReset()
    listProjects.mockReset()
    listProjectGoals.mockReset()
    listProjectGoals.mockResolvedValue({ goals: [] })
    listProjects.mockResolvedValue({ projects: [] })
    getGoalDetail.mockReset().mockResolvedValue(undefined)
    getPlayerCharacters.mockReset().mockReturnValue([])
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

    const sort = screen.getByTestId("goals-sort")
    expect(sort).toHaveAccessibleName("goals.filters.sortByLabel")
    expect(
      document.getElementById("goals-sort-value")
    ).not.toBeEmptyDOMElement()

    await user.click(sort)
    await user.click(
      screen.getByRole("option", { name: "goals.filters.sort.status" })
    )
    expect(sort).toHaveAccessibleName("goals.filters.sortByLabel")
    expect(document.getElementById("goals-sort-value")).toHaveTextContent(
      "goals.filters.sort.status"
    )
  })

  it("shows a row for an active goal with lifecycle actions", async () => {
    listGoals.mockResolvedValue({ goals: [activeGoal] })
    renderPage()

    expect(await screen.findByTestId("goals-list-table")).toBeInTheDocument()
    expect(screen.getByText("Hero One")).toBeInTheDocument()
    expect(
      screen.getByTestId(`goal-row-actions-trigger-${activeGoal.goalId}`)
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
      screen.getByTestId(`goal-row-actions-trigger-${pausedGoal.goalId}`)
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
      screen.getByTestId(`goal-row-actions-trigger-${activeGoal.goalId}`)
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
      { unitId: "hero1", rank: "Stone1", appliedUpgradeSlots: [] },
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

  it("does not open the goal detail sheet when using the row actions menu", async () => {
    listGoals.mockResolvedValue({ goals: [activeGoal] })
    const user = userEvent.setup()
    renderPage()

    await screen.findByTestId("goal-row")
    await user.click(
      screen.getByTestId(`goal-row-actions-trigger-${activeGoal.goalId}`)
    )

    expect(screen.queryByTestId("goal-detail-sheet")).not.toBeInTheDocument()
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
    listProjects.mockResolvedValue({
      projects: [
        {
          projectId: "proj-1",
          name: "My Goals",
          description: null,
          color: null,
          status: "Active",
          isActivePlan: true,
          isDefault: true,
          revision: 0,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ],
    })
    listProjectGoals.mockResolvedValue({
      goals: [{ goal: activeGoal, priority: 0 }],
    })
    renderPage()

    expect(
      await screen.findByText("My Goals · goals.project.currentPlan")
    ).toBeInTheDocument()
    expect(screen.queryByTestId("goals-project-filter")).not.toBeInTheDocument()
    expect(listProjectGoals).toHaveBeenCalledWith("proj-1")
  })
})
