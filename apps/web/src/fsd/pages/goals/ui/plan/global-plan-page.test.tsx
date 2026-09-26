import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"

import { GlobalPlanPage } from "./global-plan-page"

const state = vi.hoisted(() => ({
  isMobile: false,
  plan: {} as Record<string, unknown>,
  order: {} as Record<string, unknown>,
  moveGoal: vi.fn(),
  retryPlan: vi.fn(),
  retryMove: vi.fn(),
  dismissConflict: vi.fn(),
  launchCreateGoal: vi.fn(),
  estimates: new Map<string, unknown>(),
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}))
vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => state.isMobile,
}))
vi.mock("@/entities/goal", () => ({
  useGlobalGoalPlan: () => state.plan,
}))
vi.mock("@/entities/project", () => ({
  useProjects: () => ({ projects: [] }),
}))
vi.mock("@/features/goal-order", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/goal-order")>()),
  useGoalOrderActions: () => state.order,
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
vi.mock("../../model/goal-creation-form/create-goal-launcher-context", () => ({
  useCreateGoalLauncher: () => state.launchCreateGoal,
}))
vi.mock("../../model/insights/use-plan-insights", () => ({
  usePlanInsights: () => ({
    loading: false,
    result: {
      estimates: state.estimates,
      potentialProgressByGoalId: new Map(),
      levelPotentialProgressByGoalId: new Map(),
    },
  }),
}))
vi.mock("./global-plan-page.tutorial", () => ({
  useGlobalPlanTutorial: () => undefined,
}))
vi.mock("../goal-detail/goal-detail-sheet", () => ({
  GoalDetailSheet: () => null,
}))
// Dragging under jsdom is impractical; the list stub exposes the drop the real one reports.
vi.mock("../goals-board/goals-list", () => ({
  GoalsList: ({
    rows,
    onReorder,
    reorderEnabled,
    mobileReorderActive,
  }: {
    rows: { goalId: string }[]
    onReorder: (orderedIds: string[], movedId: string) => void
    reorderEnabled: boolean
    mobileReorderActive: boolean
  }) => (
    <div
      data-reorder={String(reorderEnabled)}
      data-mobile-reorder={String(mobileReorderActive)}
      data-testid="goals-list"
    >
      {rows.map((row) => (
        <span data-testid="plan-row" key={row.goalId}>
          {row.goalId}
        </span>
      ))}
      <button
        data-testid="drop-last-first"
        onClick={() => {
          const ids = rows.map((row) => row.goalId)
          const last = ids[ids.length - 1]!
          onReorder([last, ...ids.slice(0, -1)], last)
        }}
        type="button"
      />
    </div>
  ),
}))

function goal(goalId: string, globalPriority: number, status = "Active") {
  return {
    goalId,
    entityType: "Character",
    entityId: `unit-${goalId}`,
    goalType: "Rank",
    status,
    notes: null,
    dependsOn: [],
    createdAt: "",
    updatedAt: "",
    globalPriority,
  }
}

function setPlan(inFlight: ReturnType<typeof goal>[], overrides = {}) {
  state.plan = {
    inFlight,
    active: inFlight.filter((entry) => entry.status === "Active"),
    entries: [],
    goals: inFlight,
    orderRevision: 3,
    loading: false,
    isError: false,
    retry: state.retryPlan,
    ...overrides,
  }
}

describe("GlobalPlanPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.isMobile = false
    state.estimates = new Map([["a", { status: "Estimated" }]])
    state.order = {
      moveGoal: state.moveGoal,
      pending: false,
      conflict: null,
      retry: state.retryMove,
      dismissConflict: state.dismissConflict,
    }
    setPlan([goal("a", 1), goal("b", 2, "Paused"), goal("c", 3)])
  })

  it("lists every in-flight goal once, in global order, Paused ones included", () => {
    render(<GlobalPlanPage />)

    expect(
      screen.getAllByTestId("plan-row").map((row) => row.textContent)
    ).toEqual(["a", "b", "c"])
    expect(screen.getByTestId("goals-list")).toHaveAttribute(
      "data-reorder",
      "true"
    )
  })

  it("shows a loading state, not an empty plan, while the goals load", () => {
    setPlan([], { loading: true })
    render(<GlobalPlanPage />)

    expect(screen.getByTestId("global-plan-loading")).toBeInTheDocument()
    expect(screen.queryByTestId("global-plan-empty")).not.toBeInTheDocument()
  })

  it("shows a load error with retry, not an empty plan, when the goals fail to load", () => {
    setPlan([], { isError: true })
    render(<GlobalPlanPage />)

    expect(screen.getByTestId("global-plan-error")).toBeInTheDocument()
    expect(screen.queryByTestId("global-plan-empty")).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "goals.plan.retry" }))
    expect(state.retryPlan).toHaveBeenCalledOnce()
  })

  it("shows an empty state with a Create goal action when nothing is in flight", () => {
    setPlan([])
    render(<GlobalPlanPage />)

    expect(screen.getByTestId("global-plan-empty")).toBeInTheDocument()
    fireEvent.click(
      within(screen.getByTestId("global-plan-empty")).getByRole("button", {
        name: "goals.plan.createGoal",
      })
    )
    expect(state.launchCreateGoal).toHaveBeenCalledOnce()
  })

  it("does not offer reordering for a single goal", () => {
    setPlan([goal("a", 1)])
    render(<GlobalPlanPage />)

    expect(screen.getByTestId("goals-list")).toHaveAttribute(
      "data-reorder",
      "false"
    )
  })

  it("moves the dropped goal onto the goal that held its new place", () => {
    render(<GlobalPlanPage />)

    fireEvent.click(screen.getByTestId("drop-last-first"))

    // c was dropped at the top, where a was: c takes a's global position.
    expect(state.moveGoal).toHaveBeenCalledWith({
      goalId: "c",
      displacedGoalId: "a",
    })
  })

  it("keeps a rejected move for review and retries it only on request", () => {
    state.order = {
      ...state.order,
      conflict: { move: { goalId: "c", displacedGoalId: "a" }, message: "x" },
    }
    render(<GlobalPlanPage />)

    expect(screen.getByTestId("goal-order-conflict")).toBeInTheDocument()
    expect(state.retryMove).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId("goal-order-conflict-retry"))
    expect(state.retryMove).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByTestId("goal-order-conflict-dismiss"))
    expect(state.dismissConflict).toHaveBeenCalledOnce()
  })

  it("offers a dedicated reorder mode on mobile with an in-reach Done control", () => {
    state.isMobile = true
    render(<GlobalPlanPage />)

    expect(screen.queryByTestId("mobile-reorder-bar")).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId("global-plan-mobile-reorder-toggle"))

    expect(screen.getByTestId("goals-list")).toHaveAttribute(
      "data-mobile-reorder",
      "true"
    )
    fireEvent.click(screen.getByTestId("mobile-reorder-done"))
    expect(screen.queryByTestId("mobile-reorder-bar")).not.toBeInTheDocument()
  })

  it("shows the save in flight next to the list while the mobile mode is on", () => {
    state.isMobile = true
    state.order = { ...state.order, pending: true }
    render(<GlobalPlanPage />)
    fireEvent.click(screen.getByTestId("global-plan-mobile-reorder-toggle"))

    expect(screen.getByTestId("mobile-reorder-status")).toHaveTextContent(
      "goals.order.saving"
    )
  })

  it("says there is no farming to plan, not that there are no goals, when the Active ones need nothing farmable", () => {
    state.estimates = new Map()
    setPlan([goal("a", 1)])
    render(<GlobalPlanPage />)

    expect(screen.queryByTestId("global-plan-empty")).not.toBeInTheDocument()
    expect(screen.getByTestId("global-plan-no-farmable")).toBeInTheDocument()
    expect(screen.getByTestId("goals-list")).toBeInTheDocument()
  })

  it("does not say there is no farming while Paused goals are all that remain", () => {
    state.estimates = new Map()
    setPlan([goal("a", 1, "Paused")])
    render(<GlobalPlanPage />)

    expect(
      screen.queryByTestId("global-plan-no-farmable")
    ).not.toBeInTheDocument()
  })
})
