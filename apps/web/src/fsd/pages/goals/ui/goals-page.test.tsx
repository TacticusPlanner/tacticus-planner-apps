import { useEffect, useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"

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
}))

vi.mock("@workspace/player-data/queries", () => ({
  getPlayerCharacter: () => Promise.resolve(undefined),
  getPlayerMow: () => Promise.resolve(undefined),
  getInventoryUpgrades: () => undefined,
  getInventoryShard: () => Promise.resolve(undefined),
  getLiveProgress: () => undefined,
}))

const listGoals = vi.fn()
const listProjects = vi.fn()
const createGoal = vi.fn()
const updateGoalStatus = vi.fn()
const deleteGoal = vi.fn()

vi.mock("@/entities/goal", () => ({
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
      queryFn: () => Promise.resolve(undefined),
    }),
  },
  useGoalRefresh: () => ({
    revision: 0,
    refreshGoals: vi.fn(),
    registerGoalRefetch: vi.fn(() => () => undefined),
  }),
}))

const listProjectGoals = vi.fn()
const activateProject = vi.fn()
const updateProjectGoals = vi.fn()
const updateProjectGoalsStatus = vi.fn()

vi.mock("@/entities/project", () => ({
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

import { GoalsPage } from "./goals-page"

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

describe("GoalsPage", () => {
  beforeEach(() => {
    listGoals.mockReset()
    listProjects.mockReset()
    listProjectGoals.mockReset()
    listProjectGoals.mockResolvedValue({ goals: [] })
    listProjects.mockResolvedValue({ projects: [] })
  })

  it("does not render page-level creation actions", async () => {
    listGoals.mockResolvedValue({ goals: [] })
    render(<GoalsPage />)

    await screen.findByTestId("goals-page-empty")
    expect(
      screen.queryByTestId("goals-page-create-button")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("goals-page-empty-create-button")
    ).not.toBeInTheDocument()
  })

  it("shows a row for an active goal with lifecycle actions", async () => {
    listGoals.mockResolvedValue({ goals: [activeGoal] })
    render(<GoalsPage />)

    expect(await screen.findByTestId("goals-list-table")).toBeInTheDocument()
    expect(screen.getByText("Hero One")).toBeInTheDocument()
    expect(
      screen.getByTestId(`goal-row-actions-trigger-${activeGoal.goalId}`)
    ).toBeInTheDocument()
  })

  it("filters out the active goal when switching to the Completed tab", async () => {
    listGoals.mockResolvedValue({ goals: [activeGoal] })
    const user = userEvent.setup()
    render(<GoalsPage />)

    await screen.findByTestId("goals-list-table")

    await user.click(screen.getByTestId("goals-tab-completed"))

    expect(
      await screen.findByTestId("goals-page-filtered-empty")
    ).toBeInTheDocument()
  })

  it("retains non-archived tab counts while the Archived tab is selected", async () => {
    listGoals.mockImplementation((options?: { archived?: boolean }) =>
      Promise.resolve({
        goals: options?.archived ? [archivedGoal] : [activeGoal],
      })
    )
    const user = userEvent.setup()
    render(<GoalsPage />)

    await screen.findByTestId("goals-list-table")
    await user.click(screen.getByTestId("goals-tab-archived"))

    expect(screen.getByTestId("goals-tab-active")).toHaveTextContent("(1)")
    expect(screen.getByTestId("goals-tab-archived")).toHaveTextContent("(1)")
  })

  it("switches to grid view", async () => {
    listGoals.mockResolvedValue({ goals: [activeGoal] })
    render(<GoalsPage />)

    await screen.findByTestId("goals-list-table")

    fireEvent.click(screen.getByTestId("goals-view-grid"))

    expect(await screen.findByTestId("goals-grid")).toBeInTheDocument()
  })

  it("selecting a project filter fetches that project's goals", async () => {
    listGoals.mockResolvedValue({ goals: [] })
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
    render(<GoalsPage />)

    fireEvent.click(await screen.findByTestId("goals-project-filter"))
    fireEvent.click(
      await screen.findByRole("option", {
        name: "My Goals (goals.project.active)",
      })
    )

    await vi.waitFor(() => {
      expect(listProjectGoals).toHaveBeenCalledWith("proj-1")
    })
  })
})
