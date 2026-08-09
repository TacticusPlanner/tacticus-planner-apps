import { useEffect, useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"
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

type MockProjectSummary = {
  projectId: string
  isActivePlan: boolean
  isDefault: boolean
  [key: string]: unknown
}

vi.mock("@/entities/project", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/project")>()
  return {
    ...actual,
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
    // `useProjects` lives inside the mocked `@/entities/project` package and imports
    // `projectQueries` from its own barrel, so it doesn't see this factory's override above
    // (a Vitest self-reference quirk with `importOriginal`) - reimplemented here directly
    // against the mocked `listProjects`, mirroring `use-projects.ts`'s real shape.
    useProjects: () => {
      const isAuthenticated = useIsAuthenticated()
      const query = useQuery({
        queryKey: ["projects", "list"],
        queryFn: () => listProjects(),
        enabled: isAuthenticated,
      })
      const projects =
        (query.data as { projects: MockProjectSummary[] } | undefined)
          ?.projects ?? []
      const activeProject = projects.find((project) => project.isActivePlan)
      const defaultProject = projects.find((project) => project.isDefault)
      return {
        fetchState: query.isError
          ? { status: "error" as const, message: "error" }
          : query.data
            ? { status: "success" as const, projects }
            : { status: "idle" as const },
        projects,
        activeProjectId: activeProject?.projectId,
        defaultProjectId: defaultProject?.projectId,
        loading: isAuthenticated && query.isPending,
        retry: () => {
          void query.refetch()
        },
      }
    },
  }
})

vi.mock("@/shared/api", () => ({ ApiError: class ApiError extends Error {} }))

import { ProjectDetailPage } from "./project-detail-page"
import { CreateGoalLauncherProvider } from "../../model/goal-creation-form/create-goal-launcher"

function renderPage(projectId = "proj-a") {
  return render(
    <MemoryRouter initialEntries={[`/goals/projects/${projectId}`]}>
      <Routes>
        <Route
          path="/goals/projects/:projectId"
          element={
            <CreateGoalLauncherProvider onLaunch={vi.fn()}>
              <ProjectDetailPage />
            </CreateGoalLauncherProvider>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

function project(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    projectId: "proj-a",
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

describe("ProjectDetailPage", () => {
  beforeEach(() => {
    listProjects.mockReset()
    listProjectGoals.mockReset()
    activateProject.mockReset()
    updateProjectGoals.mockReset()
    getGoalDetail.mockReset().mockResolvedValue(undefined)
  })

  it("shows a not-found state for a project id that doesn't match any of the user's projects", async () => {
    listProjects.mockResolvedValue({ projects: [project()] })
    renderPage("nonexistent")

    expect(
      await screen.findByTestId("project-detail-page-not-found")
    ).toBeInTheDocument()
  })

  it("shows a semantic header for the current project", async () => {
    listProjects.mockResolvedValue({ projects: [project()] })
    listProjectGoals.mockResolvedValue({ goals: [] })
    renderPage("proj-a")

    expect(await screen.findByText("Project A")).toBeInTheDocument()
    expect(screen.getByText("goals.project.currentPlan")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "goals.project.edit" })
    ).toBeInTheDocument()
  })

  it("shows an archived project's own name in the ProjectSelect instead of falling back to the placeholder", async () => {
    listProjects.mockResolvedValue({
      projects: [
        project({
          projectId: "proj-archived",
          name: "Old Plan",
          status: "Archived",
          isActivePlan: false,
          isDefault: false,
        }),
      ],
    })
    listProjectGoals.mockResolvedValue({ goals: [] })
    renderPage("proj-archived")

    await screen.findByTestId("project-detail-page")
    expect(
      within(screen.getByTestId("projects-goal-project-select")).getByText(
        /Old Plan/
      )
    ).toBeInTheDocument()
  })

  it("shows the goals for the project id in the route, driven by the route param rather than local state", async () => {
    listProjects.mockResolvedValue({
      projects: [
        project(),
        project({ projectId: "proj-b", name: "Project B" }),
      ],
    })
    listProjectGoals.mockResolvedValue({ goals: [] })
    renderPage("proj-b")

    await screen.findByText("Project B")
    expect(listProjectGoals).toHaveBeenCalledWith("proj-b")
  })

  it("changing the ProjectSelect navigates to the newly-selected project's own detail route", async () => {
    const projectA = project()
    const projectB = project({
      projectId: "proj-b",
      name: "Project B",
      isActivePlan: false,
      isDefault: false,
    })
    listProjects.mockResolvedValue({ projects: [projectA, projectB] })
    listProjectGoals.mockResolvedValue({ goals: [] })
    const user = userEvent.setup()
    renderPage("proj-a")

    await screen.findByTestId("project-detail-page")
    const select = screen.getByTestId("projects-goal-project-select")
    expect(within(select).getByText(/Project A/)).toBeInTheDocument()

    await user.click(select)
    await user.click(await screen.findByRole("option", { name: /Project B/ }))

    await vi.waitFor(() =>
      expect(listProjectGoals).toHaveBeenCalledWith("proj-b")
    )
    expect(screen.getByTestId("project-detail-page")).toHaveAttribute(
      "data-project-id",
      "proj-b"
    )
  })

  it("acting on the current project's own row does not change the route", async () => {
    listProjects.mockResolvedValue({ projects: [project()] })
    listProjectGoals.mockResolvedValue({ goals: [] })
    activateProject.mockResolvedValue({})
    const user = userEvent.setup()
    renderPage("proj-a")

    await screen.findByTestId("project-detail-page")
    await user.click(screen.getByRole("button", { name: "goals.project.edit" }))
    expect(
      await screen.findByText("goals.project.editTitle")
    ).toBeInTheDocument()
    expect(screen.getByTestId("project-detail-page")).toHaveAttribute(
      "data-project-id",
      "proj-a"
    )
  })

  it("filters the goal list to only the Paused goal when switching to the Paused status", async () => {
    listProjects.mockResolvedValue({ projects: [project()] })
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
    renderPage("proj-a")

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
    listProjects.mockResolvedValue({ projects: [project()] })
    listProjectGoals.mockResolvedValue({
      goals: [{ goal: goal({ goalId: "goal-active" }), priority: 1 }],
    })
    const user = userEvent.setup()
    renderPage("proj-a")

    await screen.findByTestId("goals-list-table")

    await user.click(screen.getByTestId("projects-status-filter"))
    expect(
      screen.getByRole("option", { name: "goals.tabs.blocked" })
    ).toBeInTheDocument()
    await user.click(screen.getByRole("option", { name: "goals.tabs.blocked" }))

    expect(await screen.findByText("goals.empty.filtered")).toBeInTheDocument()
  })

  it("offers the same Type/Sort/Group filters as Overview", async () => {
    listProjects.mockResolvedValue({ projects: [project()] })
    listProjectGoals.mockResolvedValue({ goals: [] })
    renderPage("proj-a")

    await screen.findByTestId("project-detail-page")
    expect(screen.getByTestId("goals-type-filter")).toBeInTheDocument()
    expect(screen.getByTestId("goals-sort")).toBeInTheDocument()
    expect(screen.getByTestId("goals-group-by")).toBeInTheDocument()
  })

  it("keeps unit reprioritization separate from goal-list sorting", async () => {
    listProjects.mockResolvedValue({ projects: [project()] })
    listProjectGoals.mockResolvedValue({
      goals: [
        { goal: goal({ goalId: "goal-1" }), priority: 1 },
        { goal: goal({ goalId: "goal-2", entityId: "hero2" }), priority: 2 },
      ],
    })
    const user = userEvent.setup()
    renderPage("proj-a")

    await screen.findByTestId("goals-list-table")
    expect(
      screen.getByRole("button", { name: "goals.project.reprioritizeUnits" })
    ).toBeInTheDocument()

    await user.click(screen.getByTestId("goals-sort"))
    await user.click(
      await screen.findByRole("option", { name: "goals.filters.sort.entity" })
    )

    await screen.findByTestId("goals-list-table")
    expect(
      screen.getByRole("button", { name: "goals.project.reprioritizeUnits" })
    ).toBeInTheDocument()
  })
})
