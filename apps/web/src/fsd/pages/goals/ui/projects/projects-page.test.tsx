import { useEffect, useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, within } from "@/test/render"
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

vi.mock("@workspace/game-catalog/queries", () => ({
  getCharactersMap: () => new Map(),
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
  getPlayerCharacters: () => Promise.resolve([]),
  getPlayerMows: () => Promise.resolve([]),
  getInventoryUpgrades: () => Promise.resolve(undefined),
  getInventoryOrbs: () => Promise.resolve(undefined),
  getPlayerInventoryItems: () => Promise.resolve([]),
  getInventoryShard: () => Promise.resolve(undefined),
  getLiveProgress: () => undefined,
}))

const getGoalDetail = vi.fn<(goalId: string) => Promise<unknown>>(() =>
  Promise.resolve(undefined)
)

vi.mock("@/entities/goal", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/goal")>()),
  goalQueries: {
    all: () => ["goals"],
    list: (archived: boolean) => ({
      queryKey: ["goals", "list", { archived }],
      queryFn: () => Promise.resolve({ goals: [] }),
    }),
    detail: (goalId: string) => ({
      queryKey: ["goals", "detail", goalId],
      queryFn: () => getGoalDetail(goalId),
    }),
  },
}))

const listProjects = vi.fn()
const listProjectGoals = vi.fn()
const activateProject = vi.fn()
const updateProjectGoals = vi.fn()

vi.mock("@/entities/project", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/project")>()),
  listProjects: (...args: unknown[]) => listProjects(...args),
  listProjectGoals: (...args: unknown[]) => listProjectGoals(...args),
  activateProject: (...args: unknown[]) => activateProject(...args),
  updateProjectGoals: (...args: unknown[]) => updateProjectGoals(...args),
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

import { ProjectsPage } from ".//projects-page"
import { CreateGoalLauncherProvider } from "../../model/goal-creation-form/create-goal-launcher"

function renderPage() {
  return render(
    <CreateGoalLauncherProvider onLaunch={vi.fn()}>
      <ProjectsPage />
    </CreateGoalLauncherProvider>
  )
}

function project(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    projectId: "proj-1",
    name: "Project A",
    description: null,
    color: null,
    status: "Active",
    isActivePlan: true,
    isDefault: true,
    revision: 0,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

function goal(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    goalId: "goal-1",
    entityType: "Character",
    entityId: "hero1",
    goalType: "Rank",
    status: "Active",
    notes: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

describe("ProjectsPage", () => {
  beforeEach(() => {
    listProjects.mockReset()
    listProjectGoals.mockReset()
    activateProject.mockReset()
    updateProjectGoals.mockReset()
    getGoalDetail.mockReset().mockResolvedValue(undefined)
  })

  it("shows only the New project affordance when there are no projects yet", async () => {
    listProjects.mockResolvedValue({ projects: [] })
    renderPage()

    expect(await screen.findByTestId("projects-page-empty")).toBeInTheDocument()
    expect(screen.getByTestId("projects-new-project")).toBeInTheDocument()
    expect(screen.queryByTestId("project-list")).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("projects-goal-project-select")
    ).not.toBeInTheDocument()
  })

  it("lists every project, including archived ones", async () => {
    const projectA = project()
    const archived = project({
      projectId: "proj-archived",
      name: "Old plan",
      isActivePlan: false,
      isDefault: false,
      status: "Archived",
    })
    listProjects.mockResolvedValue({ projects: [projectA, archived] })
    listProjectGoals.mockResolvedValue({ goals: [] })
    renderPage()

    expect(await screen.findByText("Project A")).toBeInTheDocument()
    expect(screen.getByText("Old plan")).toBeInTheDocument()
  })

  it("opens a blank Sheet for New project and a pre-filled Sheet for Edit", async () => {
    const projectA = project()
    listProjects.mockResolvedValue({ projects: [projectA] })
    listProjectGoals.mockResolvedValue({ goals: [] })
    const user = userEvent.setup()
    renderPage()

    await screen.findByText("Project A")
    await user.click(screen.getByTestId("projects-new-project"))
    expect(
      await screen.findByText("goals.project.newProjectTitle")
    ).toBeInTheDocument()
    expect(screen.getByLabelText("goals.project.name")).toHaveValue("")
    await user.keyboard("{Escape}")

    await user.click(
      screen.getByTestId(`project-row-actions-trigger-${projectA.projectId}`)
    )
    await user.click(
      await screen.findByTestId(`project-row-edit-${projectA.projectId}`)
    )
    expect(
      await screen.findByText("goals.project.editTitle")
    ).toBeInTheDocument()
    expect(screen.getByLabelText("goals.project.name")).toHaveValue("Project A")
  })

  it("scopes the goal list to the ProjectSelect's choice, unaffected by acting on a different project's row", async () => {
    const projectA = project({ projectId: "proj-a", name: "Project A" })
    const projectB = project({
      projectId: "proj-b",
      name: "Project B",
      isActivePlan: false,
      isDefault: false,
    })
    listProjects.mockResolvedValue({ projects: [projectA, projectB] })
    listProjectGoals.mockImplementation((projectId: string) =>
      Promise.resolve({
        goals:
          projectId === "proj-a"
            ? [{ goal: goal({ goalId: "goal-a" }), priority: 1 }]
            : [
                {
                  goal: goal({ goalId: "goal-b", entityId: "hero2" }),
                  priority: 1,
                },
              ],
      })
    )
    activateProject.mockResolvedValue({})
    const user = userEvent.setup()
    renderPage()

    // Defaults to the active plan, Project A.
    await screen.findByTestId("goals-list-table")
    expect(listProjectGoals).toHaveBeenCalledWith("proj-a")

    // Setting Project B active from its row must not change which project's goals are shown.
    await user.click(
      screen.getByTestId(`project-row-actions-trigger-${projectB.projectId}`)
    )
    await user.click(
      await screen.findByTestId(`project-row-set-active-${projectB.projectId}`)
    )
    await vi.waitFor(() =>
      expect(activateProject).toHaveBeenCalledWith("proj-b")
    )

    const select = screen.getByTestId("projects-goal-project-select")
    expect(within(select).getByText(/Project A/)).toBeInTheDocument()

    // Only the trailing ProjectSelect itself changes the goal list's scope.
    await user.click(select)
    await user.click(await screen.findByRole("option", { name: /Project B/ }))
    await vi.waitFor(() =>
      expect(listProjectGoals).toHaveBeenCalledWith("proj-b")
    )
  })

  it("filters the goal list to only the Paused goal when switching to the Paused status", async () => {
    const projectA = project()
    listProjects.mockResolvedValue({ projects: [projectA] })
    listProjectGoals.mockResolvedValue({
      goals: [
        {
          goal: goal({ goalId: "goal-active", status: "Active" }),
          priority: 1,
        },
        {
          goal: goal({ goalId: "goal-paused", status: "Paused" }),
          priority: 2,
        },
      ],
    })
    const user = userEvent.setup()
    renderPage()

    await screen.findByTestId("goals-list-table")

    await user.click(screen.getByTestId("projects-status-filter"))
    await user.click(
      await screen.findByRole("option", { name: /^goals\.tabs\.paused/ })
    )

    await screen.findByTestId("goals-list-table")
    expect(screen.getAllByTestId("goal-row")).toHaveLength(1)
    expect(
      screen.getByTestId("goal-row-actions-trigger-goal-paused")
    ).toBeInTheDocument()
  })

  it("selects the Blocked status without a live count and shows the filtered-empty state when nothing is blocked", async () => {
    const projectA = project()
    listProjects.mockResolvedValue({ projects: [projectA] })
    listProjectGoals.mockResolvedValue({
      goals: [{ goal: goal({ goalId: "goal-active" }), priority: 1 }],
    })
    const user = userEvent.setup()
    renderPage()

    await screen.findByTestId("goals-list-table")

    await user.click(screen.getByTestId("projects-status-filter"))
    expect(
      screen.getByRole("option", { name: "goals.tabs.blocked" })
    ).toBeInTheDocument()
    await user.click(screen.getByRole("option", { name: "goals.tabs.blocked" }))

    expect(await screen.findByText("goals.empty.filtered")).toBeInTheDocument()
  })
})
