import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"

// Reordering on the Goals page (spec: `global-goal-priority`, `goals-navigation`). Dragging under
// jsdom is impractical, so the list is a stub that reports the drop the real one would; everything
// around it (order, filters, Group, conflict banner, mobile mode) is the real page.
const state = vi.hoisted(() => ({
  isMobile: false,
  goals: [] as Record<string, unknown>[],
  archivedGoals: [] as Record<string, unknown>[],
  estimates: new Map<string, unknown>(),
  insightsError: false,
  retryInsights: vi.fn(),
  order: {},
  moveGoal: vi.fn(),
  retryMove: vi.fn(),
  dismissConflict: vi.fn(),
}))

vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => state.isMobile,
}))
vi.mock("@/entities/project", () => ({
  useProjects: () => ({
    projects: [],
    loading: false,
    fetchState: { status: "success" },
  }),
}))
vi.mock(
  "@/features/goal-planning/model/goal-order/use-goal-order-actions",
  async (importOriginal) => ({
    ...(await importOriginal<typeof import("@/features/goal-planning")>()),
    useGoalOrderActions: () => state.order,
  })
)
vi.mock("@/features/goal-planning/model/goals-data/use-goals", () => ({
  useGoals: (options?: { archived?: boolean }) => ({
    fetchState: {
      status: "success",
      goals: options?.archived ? state.archivedGoals : state.goals,
    },
    isLoading: false,
    retry: vi.fn(),
  }),
}))
vi.mock(
  "@/features/goal-planning/model/attainment/use-goal-attainment",
  () => ({
    useGoalAttainmentState: () => ({ byGoalId: new Map(), pending: false }),
  })
)
vi.mock(
  "@/features/goal-planning/model/attainment/use-goals-overview-metrics",
  () => ({
    useGoalsOverviewMetrics: () => new Map(),
  })
)
vi.mock("@/features/goal-planning/model/goals-data/use-goal-actions", () => ({
  useGoalActions: () => ({}),
}))
vi.mock("@/features/goal-planning/model/shared/use-goal-catalog", () => ({
  useGoalCatalog: () => ({ getEntityName: (_type: string, id: string) => id }),
}))
vi.mock(
  "@/features/goal-create/model/goal-creation-form/create-goal-launcher-context",
  () => ({
    useCreateGoalLauncher: () => vi.fn(),
  })
)
vi.mock("@/features/goal-planning/model/insights/use-plan-insights", () => ({
  usePlanInsights: () => ({
    loading: false,
    isError: state.insightsError,
    retry: state.retryInsights,
    result: {
      estimates: state.estimates,
      potentialProgressByGoalId: new Map(),
      levelPotentialProgressByGoalId: new Map(),
    },
  }),
}))
vi.mock("./goals-page.tutorial", () => ({
  useGoalsOverviewTutorial: () => undefined,
}))
vi.mock("@/features/project-management", () => ({
  useProjectActions: () => ({}),
  ManageProjectsSheet: () => null,
}))
vi.mock("./goals-project-scope", () => ({
  GoalsProjectScope: () => null,
}))
vi.mock(
  "@/features/goal-planning/model/projects/use-goals-project-scope",
  () => ({
    useGoalsProjectScope: () => ({
      projectId: undefined,
      setProjectId: vi.fn(),
    }),
  })
)
vi.mock("@/features/goal-create/ui/goal-edit/goal-edit-dialog", () => ({
  GoalEditDialog: () => null,
}))
vi.mock("@/entities/planning-setting", () => ({
  PlanningSettingsDialog: () => null,
  PlanningSettingsTrigger: () => null,
  usePlanningSettings: () => ({
    settings: { dailyEnergy: 288, xpBookRarity: "Legendary", revision: 1 },
    save: vi.fn(),
  }),
}))
vi.mock("./goals-list", () => ({
  GoalsList: ({
    rows,
    onReorder,
    reorderEnabled,
    mobileReorderActive,
    estimates,
    menuMoves,
    onMenuMove,
    highlightedGoalId,
  }: {
    rows: { goalId: string }[]
    onReorder: (orderedIds: string[], movedId: string) => void
    menuMoves?: ReadonlyMap<string, { top?: string; up?: string }>
    onMenuMove: (goalId: string, displacedGoalId: string) => void
    highlightedGoalId?: string | null
    reorderEnabled: boolean
    mobileReorderActive: boolean
    estimates?: ReadonlyMap<string, unknown>
  }) => (
    <div
      data-estimates={String(estimates?.size ?? 0)}
      data-mobile-reorder={String(mobileReorderActive)}
      data-reorder={String(reorderEnabled)}
      data-testid="goals-list"
    >
      {rows.map((row, index) => (
        <span key={row.goalId}>
          <span
            data-highlighted={String(highlightedGoalId === row.goalId)}
            data-testid="plan-row"
          >
            {row.goalId}
          </span>
          {menuMoves?.get(row.goalId)?.up ? (
            <button
              data-testid={`menu-up-${row.goalId}`}
              onClick={() =>
                onMenuMove(row.goalId, menuMoves.get(row.goalId)!.up!)
              }
              type="button"
            />
          ) : null}
          {menuMoves?.get(row.goalId)?.priorityOrder ? (
            <span data-testid={`menu-priority-order-${row.goalId}`}>
              {menuMoves.get(row.goalId)!.priorityOrder!.join(",")}
            </span>
          ) : null}
          {index > 0 ? (
            <button
              data-testid={`move-up-${row.goalId}`}
              onClick={() => {
                const ids = rows.map((entry) => entry.goalId)
                ;[ids[index - 1], ids[index]] = [ids[index]!, ids[index - 1]!]
                onReorder(ids, row.goalId)
              }}
              type="button"
            />
          ) : null}
        </span>
      ))}
    </div>
  ),
}))

import { GoalsPage } from "./goals-page"

function goal(
  goalId: string,
  globalPriority: number | null,
  overrides: Record<string, unknown> = {}
) {
  return {
    goalId,
    entityType: "Character",
    entityId: `unit-${goalId}`,
    goalType: "Rank",
    status: "Active",
    notes: null,
    dependsOn: [],
    projectIds: [],
    config: {},
    snapshot: null,
    revision: 1,
    createdAt: "",
    updatedAt: "2026-01-01T00:00:00Z",
    globalPriority,
    ...overrides,
  }
}

// Global order A,B,C,D,E; A, C and E are Rank goals, B and D are Ability goals.
const fiveGoals = () => [
  goal("a", 1),
  goal("b", 2, { goalType: "Ability" }),
  goal("c", 3),
  goal("d", 4, { goalType: "Ability" }),
  goal("e", 5),
]

const rowIds = () =>
  screen.getAllByTestId("plan-row").map((row) => row.textContent)

describe("GoalsPage reordering", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    state.isMobile = false
    state.archivedGoals = []
    state.insightsError = false
    state.estimates = new Map([["a", { status: "Estimated" }]])
    state.goals = fiveGoals()
    state.order = {
      moveGoal: state.moveGoal,
      pending: false,
      conflict: null,
      retry: state.retryMove,
      dismissConflict: state.dismissConflict,
    }
  })

  it("moves the dragged goal onto the goal that held its new place in the whole order", () => {
    render(<GoalsPage />, { route: "/plan/goals" })

    // Unfiltered: e dropped above d takes d's global position.
    fireEvent.click(screen.getByTestId("move-up-e"))

    expect(state.moveGoal).toHaveBeenCalledWith({
      goalId: "e",
      displacedGoalId: "d",
    })
  })

  it("resolves a drop on a filtered list against the hidden goals too (A,B,C,D,E; visible A,C,E; E above C gives A,B,E,C,D)", async () => {
    const user = userEvent.setup()
    render(<GoalsPage />, { route: "/plan/goals" })
    await user.click(screen.getByTestId("goals-type-filter"))
    await user.click(
      await screen.findByRole("option", {
        name: "Rank",
      })
    )
    expect(rowIds()).toEqual(["a", "c", "e"])

    fireEvent.click(screen.getByTestId("move-up-e"))

    expect(state.moveGoal).toHaveBeenCalledWith({
      goalId: "e",
      displacedGoalId: "c",
    })
  })

  it("keeps a grouped drop inside its own group section", async () => {
    const user = userEvent.setup()
    render(<GoalsPage />, { route: "/plan/goals" })
    await user.click(screen.getByTestId("goals-group-by"))
    await user.click(
      await screen.findByRole("option", { name: "Group by type" })
    )

    expect(screen.getAllByTestId("goals-list")).toHaveLength(2)
    fireEvent.click(screen.getByTestId("move-up-e"))

    expect(state.moveGoal).toHaveBeenCalledWith({
      goalId: "e",
      displacedGoalId: "c",
    })
  })

  it("moves a goal up from its row menu across a group boundary (grouped by type, E's Move up displaces D)", async () => {
    const user = userEvent.setup()
    render(<GoalsPage />, { route: "/plan/goals" })
    await user.click(screen.getByTestId("goals-group-by"))
    await user.click(
      await screen.findByRole("option", { name: "Group by type" })
    )

    fireEvent.click(screen.getByTestId("menu-up-e"))

    expect(state.moveGoal).toHaveBeenCalledWith({
      goalId: "e",
      displacedGoalId: "d",
    })
    expect(
      screen.getAllByTestId("plan-row").find((row) => row.textContent === "e")
    ).toHaveAttribute("data-highlighted", "true")
  })

  it("moves a goal up from its row menu past goals the filter hides (visible A,C,E; E's Move up displaces C)", async () => {
    const user = userEvent.setup()
    render(<GoalsPage />, { route: "/plan/goals" })
    await user.click(screen.getByTestId("goals-type-filter"))
    await user.click(await screen.findByRole("option", { name: "Rank" }))

    expect(screen.queryByTestId("menu-up-a")).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId("menu-up-e"))

    expect(state.moveGoal).toHaveBeenCalledWith({
      goalId: "e",
      displacedGoalId: "c",
    })
  })

  it("offers Move to priority over the whole order, even past goals the filter hides", async () => {
    const user = userEvent.setup()
    render(<GoalsPage />, { route: "/plan/goals" })
    await user.click(screen.getByTestId("goals-type-filter"))
    await user.click(await screen.findByRole("option", { name: "Rank" }))

    expect(screen.getByTestId("menu-priority-order-e")).toHaveTextContent(
      "a,b,c,d,e"
    )
  })

  it("announces where a row-menu move put the goal", () => {
    render(<GoalsPage />, { route: "/plan/goals" })

    fireEvent.click(screen.getByTestId("menu-up-c"))

    // The order stub doesn't apply the move, so the goal is announced where it still stands.
    expect(screen.getByTestId("goals-move-status")).toHaveTextContent(
      "Moved to priority 3 of 5."
    )
  })

  it("lists goals in priority order, Active and Paused first, with no Sort control", () => {
    state.goals = [
      goal("done", null, { status: "Completed" }),
      goal("c", 3),
      goal("b", 2, { status: "Paused" }),
      goal("a", 1),
    ]
    render(<GoalsPage />, { route: "/plan/goals" })

    expect(rowIds()).toEqual(["a", "b", "c", "done"])
    expect(screen.queryByTestId("goals-sort")).not.toBeInTheDocument()
  })

  it("feeds the list plan-aware estimates from the same plan run Today uses", () => {
    render(<GoalsPage />, { route: "/plan/goals" })

    expect(screen.getByTestId("goals-list")).toHaveAttribute(
      "data-estimates",
      "1"
    )
  })

  it("does not offer reordering for a single in-flight goal", async () => {
    state.goals = [goal("a", 1)]
    render(<GoalsPage />, { route: "/plan/goals" })
    expect(screen.getByTestId("goals-list")).toHaveAttribute(
      "data-reorder",
      "false"
    )
    expect(screen.queryByTestId("goals-order-hint")).not.toBeInTheDocument()
  })

  it("keeps the mobile reorder toggle in place but disabled when reordering is unavailable", () => {
    state.isMobile = true
    state.goals = [goal("a", 1)]
    render(<GoalsPage />, { route: "/plan/goals" })
    expect(screen.getByTestId("goals-mobile-reorder-toggle")).toBeDisabled()
    expect(screen.getByTestId("goals-mobile-select-toggle")).toBeEnabled()
  })

  it("keeps a rejected move for review and retries it only on request", () => {
    state.order = {
      ...state.order,
      conflict: { move: { goalId: "e", displacedGoalId: "d" }, message: "x" },
    }
    render(<GoalsPage />, { route: "/plan/goals" })

    expect(screen.getByTestId("goal-order-conflict")).toBeInTheDocument()
    expect(state.retryMove).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId("goal-order-conflict-retry"))
    expect(state.retryMove).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByTestId("goal-order-conflict-dismiss"))
    expect(state.dismissConflict).toHaveBeenCalledOnce()
  })

  it("offers a dedicated reorder mode on mobile with an in-reach Done control", () => {
    state.isMobile = true
    render(<GoalsPage />, { route: "/plan/goals" })

    expect(screen.queryByTestId("mobile-reorder-bar")).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId("goals-mobile-reorder-toggle"))

    expect(screen.getByTestId("goals-list")).toHaveAttribute(
      "data-mobile-reorder",
      "true"
    )
    fireEvent.click(screen.getByTestId("mobile-reorder-done"))
    expect(screen.queryByTestId("mobile-reorder-bar")).not.toBeInTheDocument()
  })

  it("says the estimates failed to load, with a retry, instead of hiding the farming details silently", () => {
    state.insightsError = true
    state.estimates = new Map()
    state.goals = [goal("a", 1)]
    render(<GoalsPage />, { route: "/plan/goals" })

    expect(screen.getByTestId("goals-estimates-error")).toBeInTheDocument()
    // Below the list, so its late arrival doesn't push the rows down.
    expect(
      screen
        .getByTestId("goals-list")
        .compareDocumentPosition(screen.getByTestId("goals-estimates-error")) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(screen.queryByTestId("goals-no-farmable")).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Retry estimates" }))
    expect(state.retryInsights).toHaveBeenCalledOnce()
  })

  it("shows the save in flight next to the list while the mobile mode is on", () => {
    state.isMobile = true
    state.order = { ...state.order, pending: true }
    render(<GoalsPage />, { route: "/plan/goals" })
    fireEvent.click(screen.getByTestId("goals-mobile-reorder-toggle"))

    expect(screen.getByTestId("mobile-reorder-status")).toHaveTextContent(
      "Saving order…"
    )
  })

  it("says there is no farming to plan when the Active goals need nothing farmable, but not for Paused-only", () => {
    state.estimates = new Map()
    state.goals = [goal("a", 1)]
    const { unmount } = render(<GoalsPage />, { route: "/plan/goals" })
    expect(screen.getByTestId("goals-no-farmable")).toBeInTheDocument()
    expect(
      screen
        .getByTestId("goals-list")
        .compareDocumentPosition(screen.getByTestId("goals-no-farmable")) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    unmount()

    state.goals = [goal("a", 1, { status: "Paused" })]
    render(<GoalsPage />, { route: "/plan/goals" })
    expect(screen.queryByTestId("goals-no-farmable")).not.toBeInTheDocument()
  })
})
