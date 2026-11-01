import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, render, screen, within } from "@/test/render"
import { useQuery } from "@tanstack/react-query"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"

import { setTestAuth } from "@/test/auth"

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

const updateGoalsStatus = vi.fn()
const onEdit = vi.fn()
const deleteGoal = vi.fn()

vi.mock("@/entities/goal", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/goal")>()),
  updateGoalsStatus: (...args: unknown[]) => updateGoalsStatus(...args),
  deleteGoal: (...args: unknown[]) => deleteGoal(...args),
}))

/** A status change answers with the changed goals and the order revision. */
const statusResponse = { goals: [], orderRevision: 0 }

import { useGoalActions } from "@/features/goal-planning"
import type { GoalMenuMoves, GoalRow } from "@/features/goal-planning"
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
  moves,
  onMove,
}: {
  goalRow?: GoalRow
  reached?: boolean
  cascadeContext?: CascadeContext
  moves?: GoalMenuMoves
  onMove?: (displacedGoalId: string) => void
}) {
  const actions = useGoalActions()
  return (
    <GoalRowActions
      actions={actions}
      cascadeContext={cascadeContext}
      moves={moves}
      onEdit={onEdit}
      onMove={onMove}
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

/** Renders the goals list twice, as Overview and as a project's view (the same list filtered by
 *  `projectIds`), so the tests exercise rendered removal and refetch recovery in both. */
function CachedListsHarness({
  loadGoals,
}: {
  loadGoals: () => Promise<{ goals: (GoalRow & { projectIds: string[] })[] }>
}) {
  const actions = useGoalActions()
  const goals = useQuery({
    queryKey: ["goals", "list", { archived: false }],
    queryFn: loadGoals,
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
        {goals.data?.goals
          .filter((goal) => goal.projectIds.includes("proj-a"))
          .map((goal) => (
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
    setTestAuth({ authenticated: true })
    updateGoalsStatus.mockReset()
    onEdit.mockReset()
    deleteGoal.mockReset()
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
    expect(updateGoalsStatus).not.toHaveBeenCalled()
  })

  it.each(["Completed", "Archived"] as const)(
    "offers no Pause or Resume for a %s goal",
    async (status) => {
      const user = userEvent.setup()
      render(<Harness goalRow={row({ status })} />)

      expect(await menuItems(user)).toEqual(["edit", "delete"])
    }
  )

  it("offers each priority move that has a target and moves onto it", async () => {
    const user = userEvent.setup()
    const onMove = vi.fn()
    render(<Harness moves={{ top: "first", up: "prev" }} onMove={onMove} />)

    await openMenu(user)
    expect(
      await screen.findByRole("menuitem", { name: "Move to top" })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("menuitem", { name: "Move down" })
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole("menuitem", { name: "Move up" }))

    expect(onMove).toHaveBeenCalledExactlyOnceWith("prev")
  })

  it("moves to a typed priority from the Move to priority dialog", async () => {
    const user = userEvent.setup()
    const onMove = vi.fn()
    render(
      <Harness
        moves={{ priorityOrder: ["a", "b", "goal-1", "d"] }}
        onMove={onMove}
      />
    )

    await openMenu(user)
    await user.click(
      await screen.findByRole("menuitem", { name: "Move to priority…" })
    )
    const dialog = await screen.findByRole("dialog", {
      name: "Move to priority",
    })
    const field = within(dialog).getByRole("spinbutton", {
      name: "Priority (1–4)",
    })
    const move = within(dialog).getByRole("button", { name: "Move" })
    // Prefilled with the current priority, which is not a move.
    expect(field).toHaveValue(3)
    expect(move).toBeDisabled()

    await user.clear(field)
    await user.type(field, "9")
    expect(move).toBeDisabled()

    await user.clear(field)
    await user.type(field, "1{Enter}")

    expect(onMove).toHaveBeenCalledExactlyOnceWith("a")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("offers no priority moves without any", async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await openMenu(user)
    await screen.findByTestId("goal-row-delete-goal-1")
    expect(
      screen.queryByRole("menuitem", { name: /^Move/ })
    ).not.toBeInTheDocument()
  })

  it("renders no inline pause or resume icon buttons", () => {
    render(<Harness />)

    expect(screen.queryByTestId("goal-row-pause-goal-1")).toBeNull()
    expect(screen.queryByTestId("goal-row-delete-goal-1")).toBeNull()
  })

  it("pauses an active goal from the menu", async () => {
    updateGoalsStatus.mockResolvedValue(statusResponse)
    const user = userEvent.setup()
    render(<Harness />)

    await pickItem(user, "pause")

    await vi.waitFor(() => {
      expect(updateGoalsStatus).toHaveBeenCalledExactlyOnceWith({
        goalIds: ["goal-1"],
        status: "Paused",
      })
    })
  })

  it("cascades pause to a sole-dependent prerequisite in the same request", async () => {
    updateGoalsStatus.mockResolvedValue(statusResponse)
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
      expect(updateGoalsStatus).toHaveBeenCalledExactlyOnceWith({
        goalIds: ["goal-1", "goal-a"],
        status: "Paused",
      })
    })
  })

  it("keeps the acting goal's control disabled until the cascade request resolves", async () => {
    let resolve!: (value: unknown) => void
    updateGoalsStatus.mockReturnValue(
      new Promise((done) => {
        resolve = done
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

    await act(async () => resolve(statusResponse))
    await vi.waitFor(() =>
      expect(screen.getByTestId("goal-row-pause-goal-1")).not.toHaveAttribute(
        "aria-disabled"
      )
    )
  })

  it("does not cascade pause to a prerequisite shared by another active goal", async () => {
    updateGoalsStatus.mockResolvedValue(statusResponse)
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
      expect(updateGoalsStatus).toHaveBeenCalledExactlyOnceWith({
        goalIds: ["goal-1"],
        status: "Paused",
      })
    })
  })

  it("never cascades to a Completed or Archived prerequisite", async () => {
    updateGoalsStatus.mockResolvedValue(statusResponse)
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
      expect(updateGoalsStatus).toHaveBeenCalledExactlyOnceWith({
        goalIds: ["goal-1"],
        status: "Paused",
      })
    })
  })

  it("reports a rejected cascade once; the request is atomic, so there is no partial success", async () => {
    updateGoalsStatus.mockRejectedValue(new Error("boom"))
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

    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledOnce())
    expect(updateGoalsStatus).toHaveBeenCalledOnce()
    expect(toast.success).not.toHaveBeenCalled()
  })

  it("removes both rendered lists and the dialog before delete resolves", async () => {
    {
      let resolveDelete!: () => void
      const request = new Promise<void>((resolve) => {
        resolveDelete = resolve
      })
      deleteGoal.mockReturnValue(request)
      const first = { ...row(), projectIds: ["proj-a"] }
      const sibling = { ...row({ goalId: "goal-2" }), projectIds: ["proj-a"] }
      const loadGoals = vi.fn().mockResolvedValue({ goals: [first, sibling] })
      const user = userEvent.setup()
      render(<CachedListsHarness loadGoals={loadGoals} />)
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
      await act(async () => {
        resolveDelete()
        await request
      })
      await vi.waitFor(() => expect(loadGoals).toHaveBeenCalledTimes(2))
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
      const first = { ...row(), projectIds: ["proj-a"] }
      const loadGoals = vi.fn().mockResolvedValue({ goals: [first] })
      const user = userEvent.setup()
      render(<CachedListsHarness loadGoals={loadGoals} />)
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
      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong. Please try again."
      )
      expect(toast.success).not.toHaveBeenCalled()

      deleteGoal.mockResolvedValueOnce(undefined)
      loadGoals.mockResolvedValue({ goals: [] })
      await confirmFromProject()
      await vi.waitFor(() => expect(loadGoals).toHaveBeenCalledTimes(3))
      expect(deleteGoal).toHaveBeenCalledTimes(2)
      expect(screen.queryAllByText("goal-1")).toHaveLength(0)
      expect(toast.success).not.toHaveBeenCalled()
    }
  })

  it("surfaces an error toast when the mutation fails", async () => {
    updateGoalsStatus.mockRejectedValue(new Error("boom"))
    const user = userEvent.setup()
    render(<Harness />)

    await pickItem(user, "pause")

    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong. Please try again.",
        undefined
      )
    })
  })
})
