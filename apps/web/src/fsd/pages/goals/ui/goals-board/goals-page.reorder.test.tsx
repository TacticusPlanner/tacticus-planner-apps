import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
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
  order: {} as Record<string, unknown>,
  moveGoal: vi.fn(),
  retryMove: vi.fn(),
  dismissConflict: vi.fn(),
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: "3rdParty", init: vi.fn() },
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
vi.mock("@/features/goal-order", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/goal-order")>()),
  useGoalOrderActions: () => state.order,
}))
vi.mock("../../model/goals-data/use-goals", () => ({
  useGoals: (options?: { archived?: boolean }) => ({
    fetchState: {
      status: "success",
      goals: options?.archived ? state.archivedGoals : state.goals,
    },
    isLoading: false,
    retry: vi.fn(),
  }),
}))
vi.mock("../../model/attainment/use-goal-attainment", () => ({
  useGoalAttainment: () => new Map(),
}))
vi.mock("../../model/attainment/use-goals-overview-metrics", () => ({
  useGoalsOverviewMetrics: () => new Map(),
}))
vi.mock("../../model/goals-data/use-goal-actions", () => ({
  useGoalActions: () => ({}),
}))
vi.mock("../../model/projects/use-goal-projects", () => ({
  useGoalProjects: () => new Map(),
}))
vi.mock("../../model/shared/use-goal-catalog", () => ({
  useGoalCatalog: () => ({ getEntityName: (_type: string, id: string) => id }),
}))
vi.mock("../../model/goal-creation-form/create-goal-launcher-context", () => ({
  useCreateGoalLauncher: () => vi.fn(),
}))
vi.mock("../../model/insights/use-plan-insights", () => ({
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
vi.mock("./overview-project-quicknav", () => ({
  OverviewProjectQuicknav: () => null,
}))
vi.mock("../goal-detail/goal-detail-sheet", () => ({
  GoalDetailSheet: () => null,
}))
vi.mock("../settings/planning-settings-dialog", () => ({
  PlanningSettingsDialog: () => null,
}))
vi.mock("./goals-list", () => ({
  GoalsList: ({
    rows,
    onReorder,
    reorderEnabled,
    mobileReorderActive,
    estimates,
  }: {
    rows: { goalId: string }[]
    onReorder: (orderedIds: string[], movedId: string) => void
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
          <span data-testid="plan-row">{row.goalId}</span>
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
    render(<GoalsPage />)

    // Unfiltered: e dropped above d takes d's global position.
    fireEvent.click(screen.getByTestId("move-up-e"))

    expect(state.moveGoal).toHaveBeenCalledWith({
      goalId: "e",
      displacedGoalId: "d",
    })
  })

  it("resolves a drop on a filtered list against the hidden goals too (A,B,C,D,E; visible A,C,E; E above C gives A,B,E,C,D)", async () => {
    const user = userEvent.setup()
    render(<GoalsPage />)
    await user.click(screen.getByTestId("goals-type-filter"))
    await user.click(
      await screen.findByRole("option", {
        name: "goals.create.goalTypes.Rank",
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
    render(<GoalsPage />)
    await user.click(screen.getByTestId("goals-group-by"))
    await user.click(
      await screen.findByRole("option", { name: "goals.filters.groupByType" })
    )

    expect(screen.getAllByTestId("goals-list")).toHaveLength(2)
    fireEvent.click(screen.getByTestId("move-up-e"))

    expect(state.moveGoal).toHaveBeenCalledWith({
      goalId: "e",
      displacedGoalId: "c",
    })
  })

  it("lists goals in priority order, Active and Paused first, with no Sort control", () => {
    state.goals = [
      goal("done", null, { status: "Completed" }),
      goal("c", 3),
      goal("b", 2, { status: "Paused" }),
      goal("a", 1),
    ]
    render(<GoalsPage />)

    expect(rowIds()).toEqual(["a", "b", "c", "done"])
    expect(screen.queryByTestId("goals-sort")).not.toBeInTheDocument()
  })

  it("feeds the list plan-aware estimates from the same plan run Today uses", () => {
    render(<GoalsPage />)

    expect(screen.getByTestId("goals-list")).toHaveAttribute(
      "data-estimates",
      "1"
    )
  })

  it("does not offer reordering for a single in-flight goal or on the Archived status", async () => {
    state.goals = [goal("a", 1)]
    const { unmount } = render(<GoalsPage />)
    expect(screen.getByTestId("goals-list")).toHaveAttribute(
      "data-reorder",
      "false"
    )
    expect(screen.queryByTestId("goals-order-note")).not.toBeInTheDocument()
    unmount()

    state.goals = fiveGoals()
    state.archivedGoals = [goal("old", null, { status: "Archived" })]
    const user = userEvent.setup()
    render(<GoalsPage />)
    expect(screen.getByTestId("goals-list")).toHaveAttribute(
      "data-reorder",
      "true"
    )
    await user.click(screen.getByTestId("goals-status-filter"))
    await user.click(
      await screen.findByRole("option", { name: /^goals\.tabs\.archived/ })
    )
    expect(screen.getByTestId("goals-list")).toHaveAttribute(
      "data-reorder",
      "false"
    )
  })

  it("keeps a rejected move for review and retries it only on request", () => {
    state.order = {
      ...state.order,
      conflict: { move: { goalId: "e", displacedGoalId: "d" }, message: "x" },
    }
    render(<GoalsPage />)

    expect(screen.getByTestId("goal-order-conflict")).toBeInTheDocument()
    expect(state.retryMove).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId("goal-order-conflict-retry"))
    expect(state.retryMove).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByTestId("goal-order-conflict-dismiss"))
    expect(state.dismissConflict).toHaveBeenCalledOnce()
  })

  it("offers a dedicated reorder mode on mobile with an in-reach Done control", () => {
    state.isMobile = true
    render(<GoalsPage />)

    expect(screen.queryByTestId("mobile-reorder-bar")).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId("goals-mobile-reorder-toggle"))

    expect(screen.getByTestId("goals-list")).toHaveAttribute(
      "data-mobile-reorder",
      "true"
    )
    fireEvent.click(screen.getByTestId("mobile-reorder-done"))
    expect(screen.queryByTestId("mobile-reorder-bar")).not.toBeInTheDocument()
  })

  it("drops the mobile reorder bar when the shown status can no longer be reordered", async () => {
    state.isMobile = true
    state.goals = fiveGoals()
    state.archivedGoals = [goal("old", null, { status: "Archived" })]
    const user = userEvent.setup()
    render(<GoalsPage />)
    await user.click(screen.getByTestId("goals-mobile-reorder-toggle"))
    expect(screen.getByTestId("mobile-reorder-bar")).toBeInTheDocument()

    await user.click(screen.getByTestId("goals-status-filter"))
    await user.click(
      await screen.findByRole("option", { name: /^goals\.tabs\.archived/ })
    )

    expect(screen.queryByTestId("mobile-reorder-bar")).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("goals-mobile-reorder-toggle")
    ).not.toBeInTheDocument()
  })

  it("says the estimates failed to load, with a retry, instead of hiding the farming details silently", () => {
    state.insightsError = true
    state.estimates = new Map()
    state.goals = [goal("a", 1)]
    render(<GoalsPage />)

    expect(screen.getByTestId("goals-estimates-error")).toBeInTheDocument()
    expect(screen.queryByTestId("goals-no-farmable")).not.toBeInTheDocument()
    fireEvent.click(
      screen.getByRole("button", { name: "goals.order.estimatesRetry" })
    )
    expect(state.retryInsights).toHaveBeenCalledOnce()
  })

  it("shows the save in flight next to the list while the mobile mode is on", () => {
    state.isMobile = true
    state.order = { ...state.order, pending: true }
    render(<GoalsPage />)
    fireEvent.click(screen.getByTestId("goals-mobile-reorder-toggle"))

    expect(screen.getByTestId("mobile-reorder-status")).toHaveTextContent(
      "goals.order.saving"
    )
  })

  it("says there is no farming to plan when the Active goals need nothing farmable, but not for Paused-only", () => {
    state.estimates = new Map()
    state.goals = [goal("a", 1)]
    const { unmount } = render(<GoalsPage />)
    expect(screen.getByTestId("goals-no-farmable")).toBeInTheDocument()
    unmount()

    state.goals = [goal("a", 1, { status: "Paused" })]
    render(<GoalsPage />)
    expect(screen.queryByTestId("goals-no-farmable")).not.toBeInTheDocument()
  })
})
