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
const deleteGoal = vi.fn()
const updateGoalProjects = vi.fn()
const getGoalDetail = vi.fn<(goalId: string) => Promise<unknown>>()
const listProjectGoals = vi.fn<(projectId: string) => Promise<unknown>>()
const createProjectMock = vi.fn()

vi.mock("@/entities/goal", () => ({
  updateGoalStatus: (...args: unknown[]) => updateGoalStatus(...args),
  deleteGoal: (...args: unknown[]) => deleteGoal(...args),
  updateGoalProjects: (...args: unknown[]) => updateGoalProjects(...args),
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

let defaultProjectId: string | undefined = "proj-default"
let mockProjects: Array<{ projectId: string; status: string }> = []

vi.mock("@/entities/project", () => ({
  projectQueries: {
    all: () => ["projects"],
    goals: (projectId: string) => ({
      queryKey: ["projects", projectId, "goals"],
      queryFn: () => listProjectGoals(projectId),
    }),
  },
  useProjects: () => ({
    projects: mockProjects,
    defaultProjectId,
  }),
  createProject: (...args: unknown[]) => createProjectMock(...args),
  activateProject: vi.fn(),
  updateProject: vi.fn(),
  updateProjectGoalOrder: vi.fn(),
  updateProjectGoalsStatus: vi.fn(),
  ProjectColorDot: () => null,
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

import { ApiError } from "@/shared/api"
import { useGoalActions } from "../../model/goals-data/use-goal-actions"
import type { GoalRow } from "../../model/shared/types"
import type { CascadeContext } from "./goal-row-utils"
import { GoalRowActions } from ".//goal-row-actions"

const projectA = {
  projectId: "proj-a",
  name: "Project A",
  description: null,
  color: null,
  status: "Active" as const,
  isActivePlan: false,
  isDefault: false,
  revision: 0,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
}
// Deliberately not named "Default" — the copy must read the destination's current name from project
// data, since the Default project is renameable.
const defaultProject = {
  ...projectA,
  projectId: "proj-default",
  name: "Renamed Home",
  isDefault: true,
}

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

function membership(projectId: string) {
  return { projectId, name: projectId, color: null, isActivePlan: false }
}

function occupyingMember() {
  return {
    priority: 1,
    goal: {
      goalId: "goal-9",
      entityType: "Character",
      entityId: "hero1",
      goalType: "Rank",
      status: "Active",
      notes: null,
      dependsOn: [],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
  }
}

function Harness({
  goalRow = row(),
  project,
  reached,
  cascadeContext,
}: {
  goalRow?: GoalRow
  project?: typeof projectA
  reached?: boolean
  cascadeContext?: CascadeContext
}) {
  const actions = useGoalActions()
  return (
    <GoalRowActions
      actions={actions}
      cascadeContext={cascadeContext}
      project={project}
      reached={reached}
      row={goalRow}
    />
  )
}

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByTestId("goal-row-actions-trigger-goal-1"))
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
            <GoalRowActions row={goal} actions={actions} />
          </div>
        ))}
      </section>
      <section aria-label="Project">
        {projectGoals.data?.goals.map(({ goal }) => (
          <div key={goal.goalId}>
            <span>{goal.goalId}</span>
            <GoalRowActions row={goal} actions={actions} project={projectA} />
          </div>
        ))}
      </section>
    </>
  )
}

describe("GoalRowActions", () => {
  beforeEach(() => {
    updateGoalStatus.mockReset()
    deleteGoal.mockReset()
    updateGoalProjects.mockReset().mockResolvedValue({})
    getGoalDetail.mockReset()
    listProjectGoals.mockReset().mockResolvedValue({ goals: [] })
    createProjectMock.mockReset()
    vi.mocked(toast.success).mockReset()
    vi.mocked(toast.error).mockReset()
    defaultProjectId = "proj-default"
    mockProjects = [projectA, defaultProject]
    isMobileRef.current = false
  })

  it("pauses an active goal via the primary control and refreshes", async () => {
    updateGoalStatus.mockResolvedValue({})
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByTestId("goal-row-pause-goal-1"))

    await vi.waitFor(() => {
      expect(updateGoalStatus).toHaveBeenCalledWith("goal-1", "Paused")
    })
  })

  it("shows a resume control, not a pause control, for a paused goal", async () => {
    render(<Harness goalRow={row({ status: "Paused" })} />)

    expect(screen.getByTestId("goal-row-resume-goal-1")).toBeInTheDocument()
    expect(
      screen.queryByTestId("goal-row-pause-goal-1")
    ).not.toBeInTheDocument()
  })

  it("shows neither a pause nor a resume control for a Completed or Archived goal", () => {
    const { unmount } = render(
      <Harness goalRow={row({ status: "Completed" })} />
    )
    expect(
      screen.queryByTestId("goal-row-pause-goal-1")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("goal-row-resume-goal-1")
    ).not.toBeInTheDocument()
    unmount()

    render(<Harness goalRow={row({ status: "Archived" })} />)
    expect(
      screen.queryByTestId("goal-row-pause-goal-1")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("goal-row-resume-goal-1")
    ).not.toBeInTheDocument()
  })

  it("shows no '⋯' menu on desktop when nothing applies to it (not reached, no project)", () => {
    render(<Harness reached={false} />)
    expect(
      screen.queryByTestId("goal-row-actions-trigger-goal-1")
    ).not.toBeInTheDocument()
  })

  it("shows the '⋯' menu on desktop with Archive once the goal is reached", async () => {
    const user = userEvent.setup()
    render(<Harness reached />)

    await openMenu(user)
    expect(await screen.findByText("goals.actions.archive")).toBeInTheDocument()
  })

  it("always offers Unarchive for an archived goal, regardless of reached state", async () => {
    const user = userEvent.setup()
    const { unmount } = render(
      <Harness goalRow={row({ status: "Archived" })} reached={false} />
    )

    await openMenu(user)
    expect(
      await screen.findByText("goals.actions.unarchive")
    ).toBeInTheDocument()
    unmount()

    render(<Harness goalRow={row({ status: "Archived" })} reached />)
    await openMenu(user)
    expect(
      await screen.findByText("goals.actions.unarchive")
    ).toBeInTheDocument()
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

    await user.click(screen.getByTestId("goal-row-pause-goal-1"))

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

    await user.click(screen.getByTestId("goal-row-pause-goal-1"))
    await vi.waitFor(() =>
      expect(screen.getByTestId("goal-row-pause-goal-1")).toBeDisabled()
    )

    // The acting goal's own call resolves, but the cascade call to goal-a is still pending — the
    // control must stay disabled through this window (the exact race the fix closes).
    resolveActing({})
    await vi.waitFor(() => {
      expect(updateGoalStatus).toHaveBeenCalledWith("goal-a", "Paused")
    })
    expect(screen.getByTestId("goal-row-pause-goal-1")).toBeDisabled()

    resolveCascade({})
    await vi.waitFor(() =>
      expect(screen.getByTestId("goal-row-pause-goal-1")).not.toBeDisabled()
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

    await user.click(screen.getByTestId("goal-row-pause-goal-1"))

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

    await user.click(screen.getByTestId("goal-row-pause-goal-1"))

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

    await user.click(screen.getByTestId("goal-row-pause-goal-1"))

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

  it.each([false, true])(
    "removes both rendered lists and the dialog before delete resolves (mobile: %s)",
    async (mobile) => {
      isMobileRef.current = mobile
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
      if (mobile) {
        await user.click(
          overview.getByTestId("goal-row-actions-trigger-goal-1")
        )
        await user.click(await screen.findByTestId("goal-row-delete-goal-1"))
      } else {
        await user.click(overview.getByTestId("goal-row-delete-goal-1"))
      }
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
  )

  it.each([false, true])(
    "restores both lists on delete failure and allows retry (mobile: %s)",
    async (mobile) => {
      isMobileRef.current = mobile
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
        if (mobile) {
          await user.click(
            project.getByTestId("goal-row-actions-trigger-goal-1")
          )
          await user.click(await screen.findByTestId("goal-row-delete-goal-1"))
        } else {
          await user.click(project.getByTestId("goal-row-delete-goal-1"))
        }
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
  )

  it("surfaces an error toast when the mutation fails", async () => {
    updateGoalStatus.mockRejectedValue(new Error("boom"))
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByTestId("goal-row-pause-goal-1"))

    await vi.waitFor(() => {
      expect(updateGoalStatus).toHaveBeenCalled()
    })
  })

  it("offers a project-scoped action as a desktop icon only when the row is viewed inside a project", async () => {
    const { unmount } = render(<Harness project={projectA} />)

    // No membership set on this row, so the project list hasn't resolved a destination yet —
    // still renders as the Move-to-project affordance (disabled), not absent.
    expect(
      await screen.findByTestId("goal-row-move-to-project-goal-1")
    ).toBeInTheDocument()
    unmount()

    render(<Harness />)
    expect(
      screen.queryByTestId("goal-row-move-to-project-goal-1")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("goal-row-remove-from-project-goal-1")
    ).not.toBeInTheDocument()
  })

  it("presents removal as an ordinary action and deletion as destructive, as desktop icons", async () => {
    getGoalDetail.mockResolvedValue({
      goalId: "goal-1",
      projectIds: ["proj-a", "proj-default"],
    })
    render(
      <Harness
        goalRow={row({
          projects: [membership("proj-a"), membership("proj-default")],
        })}
        project={projectA}
      />
    )

    const remove = await screen.findByTestId(
      "goal-row-remove-from-project-goal-1"
    )
    expect(remove).toHaveAttribute("data-variant", "ghost")
    expect(screen.getByTestId("goal-row-delete-goal-1")).toHaveAttribute(
      "data-variant",
      "destructive"
    )

    const user = userEvent.setup()
    await user.click(remove)
    expect(screen.queryByTestId("delete-goal-dialog")).not.toBeInTheDocument()
  })

  it("names project removal as the alternative in the delete confirmation, and only in project context", async () => {
    const user = userEvent.setup()
    const { unmount } = render(
      <Harness
        goalRow={row({ projects: [membership("proj-a")] })}
        project={projectA}
      />
    )

    await user.click(screen.getByTestId("goal-row-delete-goal-1"))
    expect(
      await screen.findByTestId("delete-goal-project-alternative")
    ).toHaveTextContent("Project A")
    unmount()

    render(<Harness />)
    await user.click(screen.getByTestId("goal-row-delete-goal-1"))
    await screen.findByTestId("delete-goal-dialog")
    expect(
      screen.queryByTestId("delete-goal-project-alternative")
    ).not.toBeInTheDocument()
  })

  it("submits the remaining memberships for a multi-membership goal, no picker shown", async () => {
    getGoalDetail.mockResolvedValue({
      goalId: "goal-1",
      projectIds: ["proj-a", "proj-default"],
    })
    const user = userEvent.setup()
    render(
      <Harness
        goalRow={row({
          projects: [membership("proj-a"), membership("proj-default")],
        })}
        project={projectA}
      />
    )

    await user.click(
      await screen.findByTestId("goal-row-remove-from-project-goal-1")
    )

    await vi.waitFor(() => {
      expect(updateGoalProjects).toHaveBeenCalledWith("goal-1", [
        "proj-default",
      ])
    })
    expect(String(vi.mocked(toast.success).mock.calls[0]?.[0])).toContain(
      "goals.toasts.goalRemovedFromProject"
    )
    expect(
      screen.queryByTestId("move-to-project-dialog")
    ).not.toBeInTheDocument()
  })

  it("moves a last-membership goal to a picked destination and names it from project data", async () => {
    getGoalDetail.mockResolvedValue({
      goalId: "goal-1",
      projectIds: ["proj-a"],
    })
    const user = userEvent.setup()
    render(
      <Harness
        goalRow={row({ projects: [membership("proj-a")] })}
        project={projectA}
      />
    )

    await user.click(
      await screen.findByTestId("goal-row-move-to-project-goal-1")
    )
    expect(
      await screen.findByTestId("move-to-project-dialog")
    ).toBeInTheDocument()
    await user.click(screen.getByTestId("move-to-project-option-proj-default"))

    await vi.waitFor(() => {
      expect(updateGoalProjects).toHaveBeenCalledWith("goal-1", [
        "proj-default",
      ])
    })
    const message = String(vi.mocked(toast.success).mock.calls[0]?.[0])
    expect(message).toContain("goals.toasts.goalRelocated")
    expect(message).toContain("Renamed Home")
    expect(message).toContain("hero1")
    await vi.waitFor(() =>
      expect(
        screen.queryByTestId("move-to-project-dialog")
      ).not.toBeInTheDocument()
    )
  })

  it("creates a new project from the picker and moves the goal into it", async () => {
    createProjectMock.mockResolvedValue({
      projectId: "proj-new",
      name: "New One",
      description: null,
      color: null,
      status: "Active",
      isActivePlan: false,
      isDefault: false,
      revision: 0,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    })
    getGoalDetail.mockResolvedValue({
      goalId: "goal-1",
      projectIds: ["proj-a"],
    })
    const user = userEvent.setup()
    render(
      <Harness
        goalRow={row({ projects: [membership("proj-a")] })}
        project={projectA}
      />
    )

    await user.click(
      await screen.findByTestId("goal-row-move-to-project-goal-1")
    )
    await user.click(await screen.findByTestId("move-to-project-create-new"))
    expect(
      screen.queryByTestId("move-to-project-dialog")
    ).not.toBeInTheDocument()

    await user.type(screen.getByLabelText("goals.project.name"), "New One")
    await user.click(screen.getByText("goals.project.create"))

    await vi.waitFor(() => {
      expect(updateGoalProjects).toHaveBeenCalledWith("goal-1", ["proj-new"])
    })
  })

  it("skips the picker and opens project creation directly when there's no other existing project", async () => {
    mockProjects = [defaultProject]
    const user = userEvent.setup()
    render(
      <Harness
        goalRow={row({ projects: [membership("proj-default")] })}
        project={defaultProject}
      />
    )

    await user.click(
      await screen.findByTestId("goal-row-move-to-project-goal-1")
    )

    expect(
      screen.queryByTestId("move-to-project-dialog")
    ).not.toBeInTheDocument()
    expect(
      await screen.findByTestId("manage-projects-sheet")
    ).toBeInTheDocument()
  })

  it("offers Move to project, not a disabled dead end, when the Default project is the goal's only membership", async () => {
    const user = userEvent.setup()
    render(
      <Harness
        goalRow={row({ projects: [membership("proj-default")] })}
        project={defaultProject}
      />
    )

    const move = await screen.findByTestId("goal-row-move-to-project-goal-1")
    expect(move).not.toBeDisabled()

    await user.click(move)
    expect(
      await screen.findByTestId("move-to-project-option-proj-a")
    ).toBeInTheDocument()
  })

  it("disables the row action while the destination project is unknown", async () => {
    defaultProjectId = undefined
    render(
      <Harness
        goalRow={row({ projects: [membership("proj-a")] })}
        project={projectA}
      />
    )

    expect(
      await screen.findByTestId("goal-row-move-to-project-goal-1")
    ).toBeDisabled()
    expect(updateGoalProjects).not.toHaveBeenCalled()
  })

  it("moves a Rank goal into a destination that holds a different Rank target for the unit", async () => {
    getGoalDetail.mockImplementation((goalId: string) =>
      Promise.resolve(
        goalId === "goal-9"
          ? { goalId, goalType: "Rank", config: { rank: { end: 15 } } }
          : {
              goalId,
              projectIds: ["proj-a"],
              goalType: "Rank",
              config: { rank: { end: 12 } },
            }
      )
    )
    listProjectGoals.mockResolvedValue({ goals: [occupyingMember()] })
    updateGoalProjects.mockResolvedValue({})
    const user = userEvent.setup()
    render(
      <Harness
        goalRow={row({ projects: [membership("proj-a")] })}
        project={projectA}
      />
    )

    await user.click(
      await screen.findByTestId("goal-row-move-to-project-goal-1")
    )
    await user.click(
      await screen.findByTestId("move-to-project-option-proj-default")
    )

    await vi.waitFor(() =>
      expect(updateGoalProjects).toHaveBeenCalledWith("goal-1", [
        "proj-default",
      ])
    )
    expect(toast.error).not.toHaveBeenCalled()
  })

  it("explains an occupied destination slot instead of submitting", async () => {
    getGoalDetail.mockResolvedValue({
      goalId: "goal-1",
      projectIds: ["proj-a"],
      goalType: "Rank",
    })
    listProjectGoals.mockResolvedValue({ goals: [occupyingMember()] })
    const user = userEvent.setup()
    render(
      <Harness
        goalRow={row({ projects: [membership("proj-a")] })}
        project={projectA}
      />
    )

    await user.click(
      await screen.findByTestId("goal-row-move-to-project-goal-1")
    )
    await user.click(
      await screen.findByTestId("move-to-project-option-proj-default")
    )

    await vi.waitFor(() => expect(toast.error).toHaveBeenCalled())
    const message = String(vi.mocked(toast.error).mock.calls[0]?.[0])
    expect(message).toContain("goals.project.membershipConflict")
    expect(message).toContain("Renamed Home")
    expect(message).toContain("Rank")
    expect(updateGoalProjects).not.toHaveBeenCalled()
  })

  it("lets a Completed goal relocate past an occupied destination slot", async () => {
    getGoalDetail.mockResolvedValue({
      goalId: "goal-1",
      projectIds: ["proj-a"],
    })
    listProjectGoals.mockResolvedValue({ goals: [occupyingMember()] })
    const user = userEvent.setup()
    render(
      <Harness
        goalRow={row({
          status: "Completed",
          projects: [membership("proj-a")],
        })}
        project={projectA}
      />
    )

    await user.click(
      await screen.findByTestId("goal-row-move-to-project-goal-1")
    )
    await user.click(
      await screen.findByTestId("move-to-project-option-proj-default")
    )

    await vi.waitFor(() => {
      expect(updateGoalProjects).toHaveBeenCalledWith("goal-1", [
        "proj-default",
      ])
    })
  })

  it("still reports a 409 raised after a passing pre-flight", async () => {
    getGoalDetail.mockResolvedValue({
      goalId: "goal-1",
      projectIds: ["proj-a"],
    })
    updateGoalProjects.mockRejectedValue(
      new ApiError(409, "conflict", {
        issueCode: "projectGoalSlotOccupied",
        message: "conflict",
        projectId: "proj-default",
        projectName: "Renamed Home",
        entityType: "Character",
        entityId: "hero1",
        goalType: "Rank",
        existingGoalId: "goal-9",
      })
    )
    const user = userEvent.setup()
    render(
      <Harness
        goalRow={row({ projects: [membership("proj-a")] })}
        project={projectA}
      />
    )

    await user.click(
      await screen.findByTestId("goal-row-move-to-project-goal-1")
    )
    await user.click(
      await screen.findByTestId("move-to-project-option-proj-default")
    )

    await vi.waitFor(() => expect(toast.error).toHaveBeenCalled())
    const message = String(vi.mocked(toast.error).mock.calls[0]?.[0])
    expect(message).toContain("goals.project.membershipConflict")
    expect(message).toContain("Renamed Home")
  })

  it("keeps a membership added elsewhere after the view loaded", async () => {
    getGoalDetail.mockResolvedValue({
      goalId: "goal-1",
      projectIds: ["proj-a", "proj-c"],
    })
    const user = userEvent.setup()
    render(
      <Harness
        goalRow={row({ projects: [membership("proj-a")] })}
        project={projectA}
      />
    )

    await user.click(
      await screen.findByTestId("goal-row-move-to-project-goal-1")
    )
    await user.click(
      await screen.findByTestId("move-to-project-option-proj-default")
    )

    await vi.waitFor(() => {
      expect(updateGoalProjects).toHaveBeenCalledWith("goal-1", ["proj-c"])
    })
  })

  describe("on mobile", () => {
    beforeEach(() => {
      isMobileRef.current = true
    })

    it("keeps every non-primary action inside the '⋯' menu", async () => {
      getGoalDetail.mockResolvedValue({
        goalId: "goal-1",
        projectIds: ["proj-a", "proj-default"],
      })
      const user = userEvent.setup()
      render(
        <Harness
          goalRow={row({
            projects: [membership("proj-a"), membership("proj-default")],
          })}
          project={projectA}
        />
      )

      // No standalone icons outside the menu on mobile.
      expect(
        screen.queryByTestId("goal-row-remove-from-project-goal-1")
      ).not.toBeInTheDocument()
      expect(
        screen.queryByTestId("goal-row-delete-goal-1")
      ).not.toBeInTheDocument()

      await openMenu(user)
      expect(
        await screen.findByTestId("goal-row-remove-from-project-goal-1")
      ).toBeInTheDocument()
      expect(screen.getByTestId("goal-row-delete-goal-1")).toBeInTheDocument()
    })

    it("shows the '⋯' menu even when nothing besides Delete applies", async () => {
      render(<Harness reached={false} />)
      expect(
        screen.getByTestId("goal-row-actions-trigger-goal-1")
      ).toBeInTheDocument()
    })
  })
})
