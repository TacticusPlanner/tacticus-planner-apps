import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, render, screen, within } from "@/test/render"
import { useQuery } from "@tanstack/react-query"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${JSON.stringify(opts)}` : key,
  }),
}))

const account = { homeAccountId: "acc-1", username: "test@example.com" }

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({
    accounts: [account],
    instance: { getActiveAccount: () => account },
  }),
  useIsAuthenticated: () => true,
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock("@/shared/unit-name", () => ({
  useUnitName: () => (_entityType: string | null, entityId: string | null) =>
    entityId ?? "",
}))

const { isMobileRef } = vi.hoisted(() => ({ isMobileRef: { current: false } }))
vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => isMobileRef.current,
}))

const updateGoalStatus = vi.fn()
const onEdit = vi.fn()
const deleteGoal = vi.fn()
const getGoalDetail = vi.fn<(goalId: string) => Promise<unknown>>()
const listProjectGoals = vi.fn<(projectId: string) => Promise<unknown>>()

vi.mock("@/entities/goal", () => ({
  updateGoalStatus: (...args: unknown[]) => updateGoalStatus(...args),
  deleteGoal: (...args: unknown[]) => deleteGoal(...args),
  // The Rank end target a goal detail carries (its `config.rank.end`; 12 when unspecified).
  goalRankTargetKey: (goal: {
    goalType?: string
    config?: { rank?: { end: number } }
  }) => (goal.goalType === "Rank" ? `${goal.config?.rank?.end ?? 12}:0` : null),
  describeRankTargetKey: (key: string) => {
    const [end, slots] = key.split(":").map(Number)
    return { rank: `Rank${end}`, slots }
  },
  goalQueries: {
    all: () => ["goals"],
    detail: (goalId: string) => ({
      queryKey: ["goals", "detail", goalId],
      queryFn: () => getGoalDetail(goalId),
    }),
  },
}))

vi.mock("@/entities/project", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/project")>()),
  projectQueries: {
    all: () => ["projects"],
    goals: (projectId: string) => ({
      queryKey: ["projects", projectId, "goals"],
      queryFn: () => listProjectGoals(projectId),
    }),
  },
}))

vi.mock("@/shared/api", () => ({
  ApiError: class ApiError extends Error {
    status: number
    details: unknown
    constructor(status: number, message: string, details?: unknown) {
      super(message)
      this.status = status
      this.details = details
    }
  },
}))

import { useGoalActions } from "../../model/goals-data/use-goal-actions"
import type { GoalRow } from "../../model/shared/types"
import type { CascadeContext } from "./goal-row-utils"
import { GoalRowActions } from ".//goal-row-actions"

function row(overrides: Partial<GoalRow> = {}): GoalRow {
  return {
    goalId: "goal-1",
    entityType: "Character",
    entityId: "hero1",
    goalType: "Rank",
    status: "Active",
    notes: null,
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

function Harness({
  goalRow = row(),
  reached,
  cascadeContext,
}: {
  goalRow?: GoalRow
  reached?: boolean
  cascadeContext?: CascadeContext
}) {
  const actions = useGoalActions()
  return (
    <GoalRowActions
      actions={actions}
      cascadeContext={cascadeContext}
      onEdit={onEdit}
      reached={reached}
      row={goalRow}
    />
  )
}

async function openMenu(
  user: ReturnType<typeof userEvent.setup>,
  goalId = "goal-1"
) {
  await user.click(screen.getByTestId(`goal-row-actions-trigger-${goalId}`))
}

async function pickItem(
  user: ReturnType<typeof userEvent.setup>,
  item: "pause" | "resume" | "delete" | "edit",
  goalId = "goal-1"
) {
  await openMenu(user, goalId)
  await user.click(await screen.findByTestId(`goal-row-${item}-${goalId}`))
}

/** Subscribe to both cache shapes so the tests exercise rendered removal and refetch recovery. */
function CachedListsHarness({
  loadGoals,
  loadProjectGoals,
}: {
  loadGoals: () => Promise<{ goals: GoalRow[] }>
  loadProjectGoals: () => Promise<{ goals: { goal: GoalRow }[] }>
}) {
  const actions = useGoalActions()
  const goals = useQuery({
    queryKey: ["goals", "list", { archived: false }],
    queryFn: loadGoals,
  })
  const projectGoals = useQuery({
    queryKey: ["projects", "proj-a", "goals"],
    queryFn: loadProjectGoals,
  })
  return (
    <>
      <section aria-label="Overview">
        {goals.data?.goals.map((goal) => (
          <div key={goal.goalId}>
            <span>{goal.goalId}</span>
            <GoalRowActions row={goal} actions={actions} onEdit={onEdit} />
          </div>
        ))}
      </section>
      <section aria-label="Project">
        {projectGoals.data?.goals.map(({ goal }) => (
          <div key={goal.goalId}>
            <span>{goal.goalId}</span>
            <GoalRowActions row={goal} actions={actions} onEdit={onEdit} />
          </div>
        ))}
      </section>
    </>
  )
}

describe("GoalRowActions", () => {
  beforeEach(() => {
    updateGoalStatus.mockReset()
    onEdit.mockReset()
    deleteGoal.mockReset()
    getGoalDetail.mockReset()
    listProjectGoals.mockReset().mockResolvedValue({ goals: [] })
    vi.mocked(toast.success).mockReset()
    vi.mocked(toast.error).mockReset()
  })

  async function menuItems(user: ReturnType<typeof userEvent.setup>) {
    await openMenu(user)
    await screen.findByTestId("goal-row-delete-goal-1")
    return ["edit", "pause", "resume", "delete"].filter((item) =>
      screen.queryByTestId(`goal-row-${item}-goal-1`)
    )
  }

  it("offers Edit, Pause and Delete for an Active goal and reports the edit", async () => {
    const user = userEvent.setup()
    render(<Harness />)

    expect(await menuItems(user)).toEqual(["edit", "pause", "delete"])
    await user.click(screen.getByTestId("goal-row-edit-goal-1"))
    expect(onEdit).toHaveBeenCalledExactlyOnceWith("goal-1")
  })

  it("offers Resume instead of Pause for a Paused goal", async () => {
    const user = userEvent.setup()
    render(<Harness goalRow={row({ status: "Paused" })} />)

    expect(await menuItems(user)).toEqual(["edit", "resume", "delete"])
  })

  it("offers only Edit and Delete for a Reached goal, whatever its stored status", async () => {
    const user = userEvent.setup()
    const { unmount } = render(<Harness reached />)
    expect(await menuItems(user)).toEqual(["edit", "delete"])
    unmount()

    render(<Harness goalRow={row({ status: "Paused" })} reached />)
    expect(await menuItems(user)).toEqual(["edit", "delete"])
    expect(updateGoalStatus).not.toHaveBeenCalled()
  })

  it.each(["Completed", "Archived"] as const)(
    "offers no Pause or Resume for a %s goal",
    async (status) => {
      const user = userEvent.setup()
      render(<Harness goalRow={row({ status })} />)

      expect(await menuItems(user)).toEqual(["edit", "delete"])
    }
  )

  it("renders no inline pause or resume icon buttons", () => {
    render(<Harness />)

    expect(screen.queryByTestId("goal-row-pause-goal-1")).toBeNull()
    expect(screen.queryByTestId("goal-row-delete-goal-1")).toBeNull()
  })

  it("pauses an active goal from the menu", async () => {
    updateGoalStatus.mockResolvedValue({})
    const user = userEvent.setup()
    render(<Harness />)

    await pickItem(user, "pause")

    await vi.waitFor(() => {
      expect(updateGoalStatus).toHaveBeenCalledWith("goal-1", "Paused")
    })
  })

  it("cascades pause to a sole-dependent prerequisite", async () => {
    updateGoalStatus.mockResolvedValue({})
    const user = userEvent.setup()
    render(
      <Harness
        cascadeContext={{
          statusById: new Map([["goal-a", "Active"]]),
          dependentCountById: new Map([["goal-a", 1]]),
        }}
        goalRow={row({ dependsOn: ["goal-a"] })}
      />
    )

    await pickItem(user, "pause")

    await vi.waitFor(() => {
      expect(updateGoalStatus).toHaveBeenCalledWith("goal-1", "Paused")
    })
    await vi.waitFor(() => {
      expect(updateGoalStatus).toHaveBeenCalledWith("goal-a", "Paused")
    })
  })

  it("keeps the acting goal's control disabled until the whole cascade finishes, not just its own call", async () => {
    let resolveActing!: (value: unknown) => void
    let resolveCascade!: (value: unknown) => void
    updateGoalStatus.mockImplementation((goalId: string) =>
      goalId === "goal-1"
        ? new Promise((resolve) => {
            resolveActing = resolve
          })
        : new Promise((resolve) => {
            resolveCascade = resolve
          })
    )
    const user = userEvent.setup()
    render(
      <Harness
        cascadeContext={{
          statusById: new Map([["goal-a", "Active"]]),
          dependentCountById: new Map([["goal-a", 1]]),
        }}
        goalRow={row({ dependsOn: ["goal-a"] })}
      />
    )

    await pickItem(user, "pause")
    await openMenu(user)
    await vi.waitFor(() =>
      expect(screen.getByTestId("goal-row-pause-goal-1")).toHaveAttribute(
        "aria-disabled",
        "true"
      )
    )

    // The acting goal's own call resolves, but the cascade call to goal-a is still pending — the
    // control must stay disabled through this window (the exact race the fix closes).
    resolveActing({})
    await vi.waitFor(() => {
      expect(updateGoalStatus).toHaveBeenCalledWith("goal-a", "Paused")
    })
    expect(screen.getByTestId("goal-row-pause-goal-1")).toHaveAttribute(
      "aria-disabled",
      "true"
    )

    resolveCascade({})
    await vi.waitFor(() =>
      expect(screen.getByTestId("goal-row-pause-goal-1")).not.toHaveAttribute(
        "aria-disabled"
      )
    )
  })

  it("does not cascade pause to a prerequisite shared by another active goal", async () => {
    updateGoalStatus.mockResolvedValue({})
    const user = userEvent.setup()
    render(
      <Harness
        cascadeContext={{
          statusById: new Map([["goal-a", "Active"]]),
          dependentCountById: new Map([["goal-a", 2]]),
        }}
        goalRow={row({ dependsOn: ["goal-a"] })}
      />
    )

    await pickItem(user, "pause")

    await vi.waitFor(() => {
      expect(updateGoalStatus).toHaveBeenCalledWith("goal-1", "Paused")
    })
    expect(updateGoalStatus).not.toHaveBeenCalledWith("goal-a", "Paused")
  })

  it("never cascades to a Completed or Archived prerequisite", async () => {
    updateGoalStatus.mockResolvedValue({})
    const user = userEvent.setup()
    render(
      <Harness
        cascadeContext={{
          statusById: new Map([
            ["goal-a", "Completed"],
            ["goal-b", "Archived"],
          ]),
          dependentCountById: new Map([
            ["goal-a", 1],
            ["goal-b", 1],
          ]),
        }}
        goalRow={row({ dependsOn: ["goal-a", "goal-b"] })}
      />
    )

    await pickItem(user, "pause")

    await vi.waitFor(() => {
      expect(updateGoalStatus).toHaveBeenCalledWith("goal-1", "Paused")
    })
    expect(updateGoalStatus).not.toHaveBeenCalledWith("goal-a", "Paused")
    expect(updateGoalStatus).not.toHaveBeenCalledWith("goal-b", "Paused")
  })

  it("reports partial success with one aggregate toast when a cascade target fails", async () => {
    updateGoalStatus.mockImplementation((goalId: string) =>
      goalId === "goal-a"
        ? Promise.reject(new Error("boom"))
        : Promise.resolve({})
    )
    const user = userEvent.setup()
    render(
      <Harness
        cascadeContext={{
          statusById: new Map([["goal-a", "Active"]]),
          dependentCountById: new Map([["goal-a", 1]]),
        }}
        goalRow={row({ dependsOn: ["goal-a"] })}
      />
    )

    await pickItem(user, "pause")

    await vi.waitFor(() => {
      expect(updateGoalStatus).toHaveBeenCalledWith("goal-a", "Paused")
    })
    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
    })
    const message = String(vi.mocked(toast.error).mock.calls[0]?.[0])
    expect(message).toContain("statusChangedPartial")
    expect(message).toContain('"succeeded":1')
    expect(message).toContain('"total":2')
    expect(toast.success).not.toHaveBeenCalled()
  })

  it("removes both rendered lists and the dialog before delete resolves", async () => {
    {
      let resolveDelete!: () => void
      const request = new Promise<void>((resolve) => {
        resolveDelete = resolve
      })
      deleteGoal.mockReturnValue(request)
      const first = row()
      const sibling = row({ goalId: "goal-2" })
      const loadGoals = vi.fn().mockResolvedValue({ goals: [first, sibling] })
      const loadProjectGoals = vi
        .fn()
        .mockResolvedValue({ goals: [{ goal: first }, { goal: sibling }] })
      const user = userEvent.setup()
      render(
        <CachedListsHarness
          loadGoals={loadGoals}
          loadProjectGoals={loadProjectGoals}
        />
      )
      const overview = within(screen.getByRole("region", { name: "Overview" }))
      await overview.findByText("goal-1")
      await within(screen.getByRole("region", { name: "Project" })).findByText(
        "goal-1"
      )
      await user.click(overview.getByTestId("goal-row-actions-trigger-goal-1"))
      await user.click(await screen.findByTestId("goal-row-delete-goal-1"))
      expect(
        await screen.findByTestId("delete-goal-dialog")
      ).toBeInTheDocument()
      expect(deleteGoal).not.toHaveBeenCalled()
      await user.click(screen.getByTestId("delete-goal-confirm"))
      expect(deleteGoal).toHaveBeenCalledWith("goal-1")
      expect(screen.queryAllByText("goal-1")).toHaveLength(0)
      expect(screen.getAllByText("goal-2")).toHaveLength(2)
      expect(screen.queryByTestId("delete-goal-dialog")).not.toBeInTheDocument()

      loadGoals.mockResolvedValue({ goals: [sibling] })
      loadProjectGoals.mockResolvedValue({ goals: [{ goal: sibling }] })
      await act(async () => {
        resolveDelete()
        await request
      })
      await vi.waitFor(() => {
        expect(loadGoals).toHaveBeenCalledTimes(2)
        expect(loadProjectGoals).toHaveBeenCalledTimes(2)
      })
      expect(screen.queryAllByText("goal-1")).toHaveLength(0)
      expect(toast.success).not.toHaveBeenCalled()
      expect(toast.error).not.toHaveBeenCalled()
    }
  })

  it("restores both lists on delete failure and allows retry", async () => {
    {
      let rejectDelete!: (error: Error) => void
      deleteGoal.mockReturnValueOnce(
        new Promise<void>((_, reject) => {
          rejectDelete = reject
        })
      )
      const first = row()
      const loadGoals = vi.fn().mockResolvedValue({ goals: [first] })
      const loadProjectGoals = vi
        .fn()
        .mockResolvedValue({ goals: [{ goal: first }] })
      const user = userEvent.setup()
      render(
        <CachedListsHarness
          loadGoals={loadGoals}
          loadProjectGoals={loadProjectGoals}
        />
      )
      const project = within(screen.getByRole("region", { name: "Project" }))
      await project.findByText("goal-1")
      await within(screen.getByRole("region", { name: "Overview" })).findByText(
        "goal-1"
      )
      const confirmFromProject = async () => {
        await user.click(project.getByTestId("goal-row-actions-trigger-goal-1"))
        await user.click(await screen.findByTestId("goal-row-delete-goal-1"))
        await user.click(await screen.findByTestId("delete-goal-confirm"))
      }
      await confirmFromProject()
      expect(screen.queryAllByText("goal-1")).toHaveLength(0)
      await act(async () => {
        rejectDelete(new Error("boom"))
      })
      await vi.waitFor(() =>
        expect(screen.getAllByText("goal-1")).toHaveLength(2)
      )
      expect(loadGoals).toHaveBeenCalledTimes(2)
      expect(loadProjectGoals).toHaveBeenCalledTimes(2)
      expect(toast.error).toHaveBeenCalledWith("goals.toasts.actionError")
      expect(toast.success).not.toHaveBeenCalled()

      deleteGoal.mockResolvedValueOnce(undefined)
      loadGoals.mockResolvedValue({ goals: [] })
      loadProjectGoals.mockResolvedValue({ goals: [] })
      await confirmFromProject()
      await vi.waitFor(() => expect(loadProjectGoals).toHaveBeenCalledTimes(3))
      expect(deleteGoal).toHaveBeenCalledTimes(2)
      expect(screen.queryAllByText("goal-1")).toHaveLength(0)
      expect(toast.success).not.toHaveBeenCalled()
    }
  })

  it("surfaces an error toast when the mutation fails", async () => {
    updateGoalStatus.mockRejectedValue(new Error("boom"))
    const user = userEvent.setup()
    render(<Harness />)

    await pickItem(user, "pause")

    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("goals.toasts.actionError")
    })
  })
})
