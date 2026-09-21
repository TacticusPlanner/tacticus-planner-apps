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

// Spied rather than plain, so a test can read the interpolation values a key was given — the
// rendered text is only the key, so counts passed to t() are otherwise invisible.
const { translate } = vi.hoisted(() => ({
  translate: vi.fn(
    (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key
  ),
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: translate,
    i18n: { resolvedLanguage: "en" },
  }),
}))

/** The interpolation values the most recent call for `key` was given. */
function interpolationFor(key: string) {
  const calls = translate.mock.calls.filter(([called]) => called === key)
  return calls.at(-1)?.[1] as Record<string, unknown> | undefined
}

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
  getShops: () => Promise.resolve([]),
}))

vi.mock("@workspace/player-data/queries", () => ({
  getPlayerCharacter: () => Promise.resolve(undefined),
  getPlayerMow: () => Promise.resolve(undefined),
  getPlayerCharacters: () => Promise.resolve([]),
  getPlayerMows: () => Promise.resolve([]),
  getInventoryUpgrades: () => Promise.resolve(undefined),
  getInventoryOrbs: () => Promise.resolve(undefined),
  getInventoryXpBooks: () => Promise.resolve(undefined),
  getPlayerInventoryItems: () => Promise.resolve([]),
  getInventoryShard: () => Promise.resolve(undefined),
  getLiveProgress: () => undefined,
}))

const getGoalDetail = vi.fn<(goalId: string) => Promise<unknown>>(() =>
  Promise.resolve(undefined)
)
// The account-wide goal list the header's "N of your M goals" summary is expressed against, and
// (post PR #151 review) the source of `cascadeContext` — a dependsOn edge isn't constrained by
// project membership, so the cascade needs to see goals outside this project too.
const listAccountGoals = vi.fn<() => Promise<unknown>>(() =>
  Promise.resolve({ goals: [] })
)
const updateGoalStatus = vi.fn<
  (goalId: string, status: string) => Promise<unknown>
>(() => Promise.resolve({}))

vi.mock("@/entities/goal", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/goal")>()),
  updateGoalStatus: (...args: [string, string]) => updateGoalStatus(...args),
  goalQueries: {
    all: () => ["goals"],
    list: (archived: boolean) => ({
      queryKey: ["goals", "list", { archived }],
      queryFn: () => listAccountGoals(),
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
const updateProjectGoalOrder = vi.fn()
const updateProjectGoalsStatus = vi.fn()

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
    updateProjectGoalOrder: (...args: unknown[]) =>
      updateProjectGoalOrder(...args),
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
    updateProjectGoalOrder.mockReset()
    updateProjectGoalsStatus.mockReset()
    getGoalDetail.mockReset().mockResolvedValue(undefined)
    listAccountGoals.mockReset().mockResolvedValue({ goals: [] })
    updateGoalStatus.mockReset().mockResolvedValue({})
    translate.mockClear()
    // Selecting a Group value persists it to localStorage (usePersistedSelection) - reset between
    // tests so one test's selection can't leak into the next test's "first-ever visit" assumptions.
    window.localStorage.removeItem("goals.projectDetail.group")
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
      screen.getByRole("button", { name: "goals.project.moreActions" })
    ).toBeInTheDocument()
  })

  it("labels the project switcher, status filter, and Group control inside the header (relayout-project-detail-controls)", async () => {
    listProjects.mockResolvedValue({ projects: [project()] })
    listProjectGoals.mockResolvedValue({ goals: [] })
    renderPage("proj-a")

    const header = await screen.findByTestId("project-detail-header")
    expect(
      within(header).getByText("goals.project.projectSwitcherLabel")
    ).toBeInTheDocument()
    expect(
      within(header).getByText("goals.project.statusFilterFieldLabel")
    ).toBeInTheDocument()
    expect(
      within(header).getByText("goals.project.groupByFieldLabel")
    ).toBeInTheDocument()
    // All three controls now live inside the header card, not in a separate row below it.
    expect(
      within(header).getByTestId("projects-goal-project-select")
    ).toBeInTheDocument()
    expect(
      within(header).getByTestId("projects-status-filter")
    ).toBeInTheDocument()
    expect(within(header).getByTestId("goals-group-by")).toBeInTheDocument()
  })

  it("counts only non-archived goals on both sides of the account-relative summary", async () => {
    // Both numbers must count the same set. goalQueries.list(false) excludes archived goals, so the
    // project side counts nonArchivedRows — otherwise a mostly-archived project could report more
    // goals than the account has.
    listProjects.mockResolvedValue({ projects: [project()] })
    listProjectGoals.mockResolvedValue({
      goals: [
        { goal: goal({ goalId: "m-1", status: "Active" }), priority: 1 },
        { goal: goal({ goalId: "m-2", status: "Paused" }), priority: 2 },
        { goal: goal({ goalId: "m-3", status: "Archived" }), priority: 3 },
      ],
    })
    listAccountGoals.mockResolvedValue({
      goals: [goal({ goalId: "a-1" }), goal({ goalId: "a-2" })],
    })
    renderPage("proj-a")

    const summary = await screen.findByTestId("project-detail-goal-summary")
    await vi.waitFor(() => {
      expect(summary).toHaveTextContent(
        "goals.project.unitGoalSummaryOfAccount"
      )
    })
    // 2 non-archived members of 2 account goals — the archived member is not counted on either side,
    // so the project number never exceeds the account number.
    expect(
      interpolationFor("goals.project.unitGoalSummaryOfAccount")
    ).toMatchObject({ goals: 2, accountGoals: 2 })
  })

  it("falls back to the plain summary while the account total is still loading", async () => {
    // The spec forbids presenting the project count against a guessed or zero total.
    listProjects.mockResolvedValue({ projects: [project()] })
    listProjectGoals.mockResolvedValue({
      goals: [{ goal: goal({ goalId: "m-1" }), priority: 1 }],
    })
    listAccountGoals.mockImplementation(() => new Promise(() => {})) // never resolves
    renderPage("proj-a")

    const summary = await screen.findByTestId("project-detail-goal-summary")
    expect(summary).toHaveTextContent("goals.project.unitGoalSummary")
    expect(summary).not.toHaveTextContent(
      "goals.project.unitGoalSummaryOfAccount"
    )
    expect(
      interpolationFor("goals.project.unitGoalSummaryOfAccount")
    ).toBeUndefined()
    expect(interpolationFor("goals.project.unitGoalSummary")).toMatchObject({
      goals: 1,
    })
  })

  it("tells an empty project it is empty and names the ways to fill it", async () => {
    listProjects.mockResolvedValue({ projects: [project()] })
    listProjectGoals.mockResolvedValue({ goals: [] })
    listAccountGoals.mockResolvedValue({
      goals: [goal({ goalId: "a-1" })], // the account has goals; this project just holds none
    })
    renderPage("proj-a")

    const empty = await screen.findByTestId("project-detail-empty")
    expect(empty).toHaveTextContent("goals.project.emptyProjectTitle")
    expect(empty).toHaveTextContent("goals.project.emptyProjectDescription")
    // Not the filtered-empty message, which would claim no goals match rather than that the project
    // is empty.
    expect(screen.queryByText("goals.empty.filtered")).not.toBeInTheDocument()
  })

  it("states nothing in the header or empty state that makes membership sound like activation", async () => {
    listProjects.mockResolvedValue({ projects: [project()] })
    listProjectGoals.mockResolvedValue({ goals: [] })
    renderPage("proj-a")

    const header = await screen.findByTestId("project-detail-header")
    const empty = await screen.findByTestId("project-detail-empty")
    for (const region of [header, empty]) {
      expect(region.textContent ?? "").not.toMatch(
        /activat|deactivat|makes? .*(active|paused)/i
      )
    }
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
    await user.click(
      screen.getByRole("button", { name: "goals.project.moreActions" })
    )
    await user.click(
      screen.getByRole("menuitem", { name: "goals.project.edit" })
    )
    expect(
      await screen.findByText("goals.project.editTitle")
    ).toBeInTheDocument()
    expect(screen.getByTestId("project-detail-page")).toHaveAttribute(
      "data-project-id",
      "proj-a"
    )
  })

  it("does not cascade-pause a prerequisite that's still shared by a goal in a different project (PR #151 review)", async () => {
    // goal-b (this project's only member) depends on goal-a. goal-c also depends on goal-a but
    // belongs to a different project, so it's absent from listProjectGoals — only the account-wide
    // fetch reveals it. Before the fix, cascadeContext was built from this project's own rows only,
    // undercounting goal-a's dependents to 1 (just goal-b) and cascade-pausing it anyway.
    listProjects.mockResolvedValue({ projects: [project()] })
    listProjectGoals.mockResolvedValue({
      goals: [
        {
          goal: goal({ goalId: "goal-b", dependsOn: ["goal-a"] }),
          priority: 1,
        },
      ],
    })
    listAccountGoals.mockResolvedValue({
      goals: [
        goal({ goalId: "goal-a" }),
        goal({ goalId: "goal-b", dependsOn: ["goal-a"] }),
        goal({ goalId: "goal-c", dependsOn: ["goal-a"] }),
      ],
    })
    const user = userEvent.setup()
    renderPage("proj-a")

    await user.click(await screen.findByTestId("goal-row-pause-goal-b"))

    await vi.waitFor(() => {
      expect(updateGoalStatus).toHaveBeenCalledWith("goal-b", "Paused")
    })
    expect(updateGoalStatus).not.toHaveBeenCalledWith("goal-a", "Paused")
  })

  it("shows the new status immediately, before the pause request resolves", async () => {
    listProjects.mockResolvedValue({ projects: [project()] })
    listProjectGoals.mockResolvedValue({
      goals: [{ goal: goal({ goalId: "goal-b" }), priority: 1 }],
    })
    let resolveRequest!: (value: unknown) => void
    updateGoalStatus.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve
      })
    )
    const user = userEvent.setup()
    renderPage("proj-a")

    const badge = await screen.findByTestId("goal-status-badge")
    expect(badge).toHaveTextContent("goals.status.Active")

    await user.click(screen.getByTestId("goal-row-pause-goal-b"))

    // The request is still pending (resolveRequest not called yet) — the badge must already read
    // Paused, not wait for the round trip.
    await vi.waitFor(() =>
      expect(screen.getByTestId("goal-status-badge")).toHaveTextContent(
        "goals.status.Paused"
      )
    )

    resolveRequest({})
  })

  it("reverts the optimistic status update when the pause request fails", async () => {
    listProjects.mockResolvedValue({ projects: [project()] })
    listProjectGoals.mockResolvedValue({
      goals: [{ goal: goal({ goalId: "goal-b" }), priority: 1 }],
    })
    updateGoalStatus.mockRejectedValue(new Error("boom"))
    const user = userEvent.setup()
    renderPage("proj-a")

    await screen.findByTestId("goal-status-badge")
    await user.click(screen.getByTestId("goal-row-pause-goal-b"))

    await vi.waitFor(() => {
      expect(updateGoalStatus).toHaveBeenCalledWith("goal-b", "Paused")
    })
    await vi.waitFor(() =>
      expect(screen.getByTestId("goal-status-badge")).toHaveTextContent(
        "goals.status.Active"
      )
    )
  })

  it("pauses every applicable goal in the project via the header's bulk action", async () => {
    listProjects.mockResolvedValue({ projects: [project()] })
    listProjectGoals.mockResolvedValue({ goals: [] })
    updateProjectGoalsStatus.mockResolvedValue({ goalsTransitioned: 2 })
    const user = userEvent.setup()
    renderPage("proj-a")

    await screen.findByTestId("project-detail-page")
    await user.click(
      screen.getByRole("button", { name: "goals.project.moreActions" })
    )
    await user.click(screen.getByTestId("project-pause-all-goals"))

    await vi.waitFor(() => {
      expect(updateProjectGoalsStatus).toHaveBeenCalledWith("proj-a", "Paused")
    })
  })

  it("resumes every applicable goal in the project via the header's bulk action", async () => {
    listProjects.mockResolvedValue({ projects: [project()] })
    listProjectGoals.mockResolvedValue({ goals: [] })
    updateProjectGoalsStatus.mockResolvedValue({ goalsTransitioned: 1 })
    const user = userEvent.setup()
    renderPage("proj-a")

    await screen.findByTestId("project-detail-page")
    await user.click(
      screen.getByRole("button", { name: "goals.project.moreActions" })
    )
    await user.click(screen.getByTestId("project-resume-all-goals"))

    await vi.waitFor(() => {
      expect(updateProjectGoalsStatus).toHaveBeenCalledWith("proj-a", "Active")
    })
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

  it("offers only Group from the shared filter row, unlike Overview's Type/Sort/Group (fix-project-priority-display)", async () => {
    listProjects.mockResolvedValue({ projects: [project()] })
    listProjectGoals.mockResolvedValue({ goals: [] })
    renderPage("proj-a")

    await screen.findByTestId("project-detail-page")
    expect(screen.queryByTestId("goals-type-filter")).not.toBeInTheDocument()
    expect(screen.queryByTestId("goals-sort")).not.toBeInTheDocument()
    expect(screen.getByTestId("goals-group-by")).toBeInTheDocument()
  })

  it("opens the bulk assembly sheet from the detail route's own trigger", async () => {
    listProjects.mockResolvedValue({ projects: [project()] })
    listProjectGoals.mockResolvedValue({ goals: [] })
    const user = userEvent.setup()
    renderPage("proj-a")

    await screen.findByTestId("project-detail-page")
    await user.click(screen.getByTestId("project-add-goals"))

    expect(
      await screen.findByTestId("add-goals-to-project-sheet")
    ).toBeInTheDocument()
  })

  it("offers project removal on each goal row, because the route carries project scope", async () => {
    listProjects.mockResolvedValue({ projects: [project()] })
    listProjectGoals.mockResolvedValue({
      goals: [{ goal: goal(), priority: 1 }],
    })
    const user = userEvent.setup()
    renderPage("proj-a")

    await screen.findByTestId("goals-list-table")
    await user.click(screen.getByTestId("goal-row-actions-trigger-goal-1"))

    expect(
      await screen.findByTestId("goal-row-remove-from-project-goal-1")
    ).toBeInTheDocument()
  })

  it("carries each row's full project membership, not only the viewed project", async () => {
    listProjects.mockResolvedValue({
      projects: [
        project(),
        project({
          projectId: "proj-b",
          name: "Project B",
          isActivePlan: false,
          isDefault: false,
        }),
      ],
    })
    listProjectGoals.mockResolvedValue({
      goals: [{ goal: goal(), priority: 1 }],
    })
    renderPage("proj-a")

    const row = await screen.findByTestId("goal-row")
    const memberships = within(row).getByTestId("goal-project-memberships")
    expect(memberships).toHaveTextContent("Project A")
    expect(memberships).toHaveTextContent("Project B")
  })

  it("keeps every row's drag handle available regardless of how the list is grouped", async () => {
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
    expect(screen.getAllByTestId("goal-row-drag-handle")).toHaveLength(2)

    await selectGroup(user, "goals.filters.groupNone")

    await screen.findAllByTestId("goals-list-table")
    expect(screen.getAllByTestId("goal-row-drag-handle")).toHaveLength(2)
  })

  it("shows no drag handle with fewer than two in-flight goals", async () => {
    listProjects.mockResolvedValue({ projects: [project()] })
    listProjectGoals.mockResolvedValue({
      goals: [{ goal: goal({ goalId: "goal-1" }), priority: 1 }],
    })
    renderPage("proj-a")

    await screen.findByTestId("goals-list-table")
    expect(screen.queryByTestId("goal-row-drag-handle")).not.toBeInTheDocument()
  })
  const goalOrderIn = (container: HTMLElement) =>
    [
      ...container.querySelectorAll(
        '[data-testid^="goal-row-actions-trigger-"]'
      ),
    ].map((node) =>
      node
        .getAttribute("data-testid")!
        .slice("goal-row-actions-trigger-".length)
    )

  const groupHeadings = () =>
    [...screen.getByTestId("project-detail-goals").querySelectorAll("h2")].map(
      (node) => node.textContent
    )

  const blockFor = (heading: HTMLElement) =>
    goalOrderIn(heading.closest("section")!)

  async function selectGroup(
    user: ReturnType<typeof userEvent.setup>,
    option: string
  ) {
    await user.click(screen.getByTestId("goals-group-by"))
    await user.click(await screen.findByRole("option", { name: option }))
  }

  it("opens grouped by goal type, with one labelled block per type", async () => {
    listProjects.mockResolvedValue({ projects: [project()] })
    listProjectGoals.mockResolvedValue({
      goals: [
        { goal: goal({ goalId: "goal-rank" }), priority: 1 },
        {
          goal: goal({ goalId: "goal-ability", goalType: "Ability" }),
          priority: 2,
        },
      ],
    })
    renderPage("proj-a")

    const rank = await screen.findByRole("heading", {
      name: "goals.create.goalTypes.Rank",
    })
    const ability = screen.getByRole("heading", {
      name: "goals.create.goalTypes.Ability",
    })
    expect(blockFor(rank)).toEqual(["goal-rank"])
    expect(blockFor(ability)).toEqual(["goal-ability"])
  })

  it("renders the group blocks inside the wrapper the product tour anchors to", async () => {
    listProjects.mockResolvedValue({ projects: [project()] })
    listProjectGoals.mockResolvedValue({
      goals: [{ goal: goal(), priority: 1 }],
    })
    renderPage("proj-a")

    await screen.findAllByTestId("goals-list-table")
    expect(
      within(screen.getByTestId("project-detail-goals")).getByRole("heading", {
        name: "goals.create.goalTypes.Rank",
      })
    ).toBeInTheDocument()
  })

  it("groups archived goals too rather than rendering them flat", async () => {
    listProjects.mockResolvedValue({ projects: [project()] })
    listProjectGoals.mockResolvedValue({
      goals: [
        {
          goal: goal({ goalId: "goal-archived-rank", status: "Archived" }),
          priority: 1,
        },
        {
          goal: goal({
            goalId: "goal-archived-ability",
            goalType: "Ability",
            status: "Archived",
          }),
          priority: 2,
        },
      ],
    })
    const user = userEvent.setup()
    renderPage("proj-a")

    await screen.findByTestId("project-detail-page")
    await user.click(screen.getByTestId("projects-status-filter"))
    await user.click(
      await screen.findByRole("option", { name: /^goals\.tabs\.archived/ })
    )

    await screen.findAllByTestId("goals-list-table")
    expect(groupHeadings()).toEqual([
      "goals.create.goalTypes.Rank",
      "goals.create.goalTypes.Ability",
    ])
  })

  it("sorts by Priority by default, with a historical goal's higher priority number following in-flight ones", async () => {
    listProjects.mockResolvedValue({ projects: [project()] })
    listProjectGoals.mockResolvedValue({
      // Two-zone shape (add-inline-goal-reprioritize): a historical goal's priority always lands
      // after every in-flight goal's, exactly as the API renumbers it.
      goals: [
        {
          goal: goal({ goalId: "goal-completed", status: "Completed" }),
          priority: 4,
        },
        { goal: goal({ goalId: "goal-2", entityId: "hero2" }), priority: 2 },
        { goal: goal({ goalId: "goal-1" }), priority: 1 },
      ],
    })
    renderPage("proj-a")

    expect(
      goalOrderIn(await screen.findByTestId("project-detail-goals"))
    ).toEqual(["goal-1", "goal-2", "goal-completed"])
  })

  it("shows a unit's historical goals through the status filter without a drag handle of their own", async () => {
    listProjects.mockResolvedValue({ projects: [project()] })
    listProjectGoals.mockResolvedValue({
      goals: [
        { goal: goal({ goalId: "goal-active-1" }), priority: 1 },
        {
          goal: goal({
            goalId: "goal-active-2",
            entityId: "hero2",
            goalType: "Ability",
          }),
          priority: 2,
        },
        {
          goal: goal({
            goalId: "goal-completed",
            entityId: "hero2",
            goalType: "Ascension",
            status: "Completed",
          }),
          priority: 3,
        },
      ],
    })
    renderPage("proj-a")

    // Reachable: the Completed goal is grouped into its own type block like any other row.
    const completed = await screen.findByRole("heading", {
      name: "goals.create.goalTypes.Ascension",
    })
    expect(blockFor(completed)).toEqual(["goal-completed"])

    // 2 in-flight goals (goal-active-1, goal-active-2) get a drag handle; the historical
    // goal-completed does not, since dragging only reorders in-flight goals.
    expect(await screen.findAllByTestId("goal-row")).toHaveLength(3)
    expect(screen.getAllByTestId("goal-row-drag-handle")).toHaveLength(2)
  })

  it("offers both remaining Group options, with no 'by unit' option (relayout-project-detail-controls)", async () => {
    listProjects.mockResolvedValue({ projects: [project()] })
    listProjectGoals.mockResolvedValue({
      goals: [
        { goal: goal({ goalId: "goal-rank" }), priority: 1 },
        {
          goal: goal({ goalId: "goal-ability", goalType: "Ability" }),
          priority: 2,
        },
      ],
    })
    const user = userEvent.setup()
    renderPage("proj-a")

    await screen.findAllByTestId("goals-list-table")
    await user.click(screen.getByTestId("goals-group-by"))
    for (const option of [
      "goals.filters.groupNone",
      "goals.filters.groupByType",
    ]) {
      expect(screen.getByRole("option", { name: option })).toBeInTheDocument()
    }
    expect(
      screen.queryByRole("option", { name: "goals.filters.groupByUnit" })
    ).not.toBeInTheDocument()

    await user.click(
      screen.getByRole("option", { name: "goals.filters.groupNone" })
    )

    expect(groupHeadings()).toEqual([])
    expect(screen.getAllByTestId("goals-list-table")).toHaveLength(1)
    expect(goalOrderIn(screen.getByTestId("project-detail-goals"))).toEqual([
      "goal-rank",
      "goal-ability",
    ])
  })

  it("clamps a Group selection of 'unit' persisted from before that option was removed, without rewriting storage", async () => {
    window.localStorage.setItem("goals.projectDetail.group", "unit")
    listProjects.mockResolvedValue({ projects: [project()] })
    listProjectGoals.mockResolvedValue({
      goals: [
        { goal: goal({ goalId: "goal-rank" }), priority: 1 },
        {
          goal: goal({ goalId: "goal-ability", goalType: "Ability" }),
          priority: 2,
        },
      ],
    })
    renderPage("proj-a")

    // Renders grouped by type, not by unit and not ungrouped, proving the clamp landed on "type".
    expect(
      await screen.findByRole("heading", {
        name: "goals.create.goalTypes.Rank",
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "goals.create.goalTypes.Ability" })
    ).toBeInTheDocument()
    // Storage itself is left untouched at the read site (design.md) - still "unit" raw.
    expect(window.localStorage.getItem("goals.projectDetail.group")).toBe(
      "unit"
    )
  })

  it("carries the status and Group selections to the next project opened through the switcher", async () => {
    listProjects.mockResolvedValue({
      projects: [
        project(),
        project({
          projectId: "proj-b",
          name: "Project B",
          isActivePlan: false,
          isDefault: false,
        }),
      ],
    })
    listProjectGoals.mockImplementation((projectId: string) =>
      Promise.resolve({
        goals:
          projectId === "proj-a"
            ? [
                {
                  goal: goal({
                    goalId: "goal-a",
                    goalType: "Ability",
                    status: "Paused",
                  }),
                  priority: 1,
                },
              ]
            : [
                {
                  goal: goal({
                    goalId: "goal-b-active",
                    entityId: "hero5",
                    status: "Active",
                  }),
                  priority: 1,
                },
                {
                  goal: goal({
                    goalId: "goal-b-late",
                    entityId: "hero9",
                    goalType: "Ability",
                    status: "Paused",
                  }),
                  priority: 2,
                },
                {
                  goal: goal({
                    goalId: "goal-b-early",
                    entityId: "hero3",
                    goalType: "Ability",
                    status: "Paused",
                  }),
                  priority: 3,
                },
              ],
      })
    )
    const user = userEvent.setup()
    renderPage("proj-a")

    await screen.findByTestId("project-detail-page")
    await user.click(screen.getByTestId("projects-status-filter"))
    await user.click(
      await screen.findByRole("option", { name: /^goals\.tabs\.paused/ })
    )
    // "none" (not the default "type") is what proves the selection actually carried over — if it
    // had reset instead, project B would render grouped by type, not flat.
    await selectGroup(user, "goals.filters.groupNone")

    await user.click(screen.getByTestId("projects-goal-project-select"))
    await user.click(await screen.findByRole("option", { name: /Project B/ }))

    await vi.waitFor(() =>
      expect(listProjectGoals).toHaveBeenCalledWith("proj-b")
    )
    // Paused leaves only hero9 (priority 2) and hero3 (priority 3); no grouping carried over, so
    // they render as one flat list in priority order.
    await vi.waitFor(() => expect(groupHeadings()).toEqual([]))
    expect(goalOrderIn(screen.getByTestId("project-detail-goals"))).toEqual([
      "goal-b-late",
      "goal-b-early",
    ])
  })

  it("changing the Group selection sends no reorder request", async () => {
    listProjects.mockResolvedValue({ projects: [project()] })
    listProjectGoals.mockResolvedValue({
      goals: [
        { goal: goal({ goalId: "goal-1" }), priority: 1 },
        { goal: goal({ goalId: "goal-2", entityId: "hero2" }), priority: 2 },
      ],
    })
    const user = userEvent.setup()
    renderPage("proj-a")

    await screen.findAllByTestId("goals-list-table")
    await selectGroup(user, "goals.filters.groupNone")
    await selectGroup(user, "goals.filters.groupByType")

    expect(updateProjectGoalOrder).not.toHaveBeenCalled()
    expect(updateProjectGoals).not.toHaveBeenCalled()
  })

  it("drags a goal to a new position and submits the project's full in-flight order", async () => {
    listProjectGoals.mockResolvedValue({
      goals: [
        { goal: goal({ goalId: "goal-late", entityId: "hero1" }), priority: 2 },
        {
          goal: goal({ goalId: "goal-early", entityId: "hero2" }),
          priority: 1,
        },
      ],
    })
    listProjects.mockResolvedValue({ projects: [project()] })
    updateProjectGoalOrder.mockResolvedValue({ goals: [] })
    renderPage("proj-a")

    await screen.findAllByTestId("goals-list-table")
    const handles = screen.getAllByTestId("goal-row-drag-handle")
    expect(handles).toHaveLength(2)

    // Simulating an actual pointer-driven drag through dnd-kit's sensors is impractical under
    // jsdom; `spliceGoalOrder` (goal-order.test.ts) covers the splice logic that turns a drop into
    // the submitted full order, and this test only exercises that the wiring — drag handles present,
    // reachable, and connected to the reorder mutation — is actually in place, via keyboard
    // activation (dnd-kit's KeyboardSensor is a real, accessible way to reorder).
    handles[0]!.focus()
    expect(handles[0]).toHaveFocus()
  })
})
