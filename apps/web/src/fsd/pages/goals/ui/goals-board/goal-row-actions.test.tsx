import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@/test/render"
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

const updateGoalStatus = vi.fn()
const deleteGoal = vi.fn()
const updateGoalProjects = vi.fn()
const getGoalDetail = vi.fn<(goalId: string) => Promise<unknown>>()
const listProjectGoals = vi.fn<(projectId: string) => Promise<unknown>>()

vi.mock("@/entities/goal", () => ({
  updateGoalStatus: (...args: unknown[]) => updateGoalStatus(...args),
  deleteGoal: (...args: unknown[]) => deleteGoal(...args),
  updateGoalProjects: (...args: unknown[]) => updateGoalProjects(...args),
  goalQueries: {
    all: () => ["goals"],
    detail: (goalId: string) => ({
      queryKey: ["goals", "detail", goalId],
      queryFn: () => getGoalDetail(goalId),
    }),
  },
}))

let defaultProjectId: string | undefined = "proj-default"

vi.mock("@/entities/project", () => ({
  projectQueries: {
    all: () => ["projects"],
    goals: (projectId: string) => ({
      queryKey: ["projects", projectId, "goals"],
      queryFn: () => listProjectGoals(projectId),
    }),
  },
  useProjects: () => ({
    projects: [projectA, defaultProject],
    defaultProjectId,
  }),
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

describe("GoalRowActions", () => {
  beforeEach(() => {
    updateGoalStatus.mockReset()
    deleteGoal.mockReset()
    updateGoalProjects.mockReset().mockResolvedValue({})
    getGoalDetail.mockReset()
    listProjectGoals.mockReset().mockResolvedValue({ goals: [] })
    vi.mocked(toast.success).mockReset()
    vi.mocked(toast.error).mockReset()
    defaultProjectId = "proj-default"
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

  it("hides Archive for a goal that hasn't reached its target, and offers it once reached", async () => {
    const user = userEvent.setup()
    const { unmount } = render(<Harness reached={false} />)

    await openMenu(user)
    expect(screen.queryByText("goals.actions.archive")).not.toBeInTheDocument()
    unmount()

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

  it("opens the confirm dialog and deletes on confirm", async () => {
    deleteGoal.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<Harness />)

    await openMenu(user)
    await user.click(await screen.findByTestId("goal-row-delete-goal-1"))

    expect(await screen.findByTestId("delete-goal-dialog")).toBeInTheDocument()

    await user.click(screen.getByTestId("delete-goal-confirm"))

    await vi.waitFor(() => {
      expect(deleteGoal).toHaveBeenCalledWith("goal-1")
    })
  })

  it("surfaces an error toast when the mutation fails", async () => {
    updateGoalStatus.mockRejectedValue(new Error("boom"))
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByTestId("goal-row-pause-goal-1"))

    await vi.waitFor(() => {
      expect(updateGoalStatus).toHaveBeenCalled()
    })
  })

  it("offers project removal only when the row is viewed inside a project", async () => {
    const user = userEvent.setup()
    const { unmount } = render(<Harness project={projectA} />)

    await openMenu(user)
    expect(
      await screen.findByTestId("goal-row-remove-from-project-goal-1")
    ).toBeInTheDocument()
    unmount()

    render(<Harness />)
    await openMenu(user)
    await screen.findByTestId("goal-row-delete-goal-1")
    expect(
      screen.queryByTestId("goal-row-remove-from-project-goal-1")
    ).not.toBeInTheDocument()
  })

  it("presents removal as an ordinary action and deletion as destructive and confirmed", async () => {
    const user = userEvent.setup()
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

    await openMenu(user)
    const remove = await screen.findByTestId(
      "goal-row-remove-from-project-goal-1"
    )
    expect(remove).not.toHaveAttribute("data-variant", "destructive")
    expect(screen.getByTestId("goal-row-delete-goal-1")).toHaveAttribute(
      "data-variant",
      "destructive"
    )

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

    await openMenu(user)
    await user.click(await screen.findByTestId("goal-row-delete-goal-1"))
    expect(
      await screen.findByTestId("delete-goal-project-alternative")
    ).toHaveTextContent("Project A")
    unmount()

    render(<Harness />)
    await openMenu(user)
    await user.click(await screen.findByTestId("goal-row-delete-goal-1"))
    await screen.findByTestId("delete-goal-dialog")
    expect(
      screen.queryByTestId("delete-goal-project-alternative")
    ).not.toBeInTheDocument()
  })

  it("submits the remaining memberships for a multi-membership goal", async () => {
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

    await openMenu(user)
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
  })

  it("relocates a last-membership goal and names the destination from project data", async () => {
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

    await openMenu(user)
    await user.click(
      await screen.findByTestId("goal-row-remove-from-project-goal-1")
    )

    await vi.waitFor(() => {
      expect(updateGoalProjects).toHaveBeenCalledWith("goal-1", [
        "proj-default",
      ])
    })
    const message = String(vi.mocked(toast.success).mock.calls[0]?.[0])
    expect(message).toContain("goals.toasts.goalRelocated")
    expect(message).toContain("Renamed Home")
    expect(message).toContain("hero1")
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

    await openMenu(user)
    await user.click(
      await screen.findByTestId("goal-row-remove-from-project-goal-1")
    )

    await vi.waitFor(() => {
      expect(updateGoalProjects).toHaveBeenCalledWith("goal-1", ["proj-c"])
    })
  })

  it("renders removal unavailable when the Default project is the only membership", async () => {
    const user = userEvent.setup()
    render(
      <Harness
        goalRow={row({ projects: [membership("proj-default")] })}
        project={defaultProject}
      />
    )

    await openMenu(user)
    expect(
      await screen.findByTestId("goal-row-remove-from-project-goal-1")
    ).toHaveAttribute("data-disabled")
    expect(
      screen.getByTestId("goal-row-remove-unavailable-goal-1")
    ).toHaveTextContent("goals.project.removeLastMembership")
    expect(updateGoalProjects).not.toHaveBeenCalled()
  })

  it("renders removal unavailable while the destination project is unknown", async () => {
    defaultProjectId = undefined
    const user = userEvent.setup()
    render(
      <Harness
        goalRow={row({ projects: [membership("proj-a")] })}
        project={projectA}
      />
    )

    await openMenu(user)
    expect(
      await screen.findByTestId("goal-row-remove-from-project-goal-1")
    ).toHaveAttribute("data-disabled")
    expect(
      screen.getByTestId("goal-row-remove-unavailable-goal-1")
    ).toHaveTextContent("goals.project.removeDestinationUnknown")
    expect(updateGoalProjects).not.toHaveBeenCalled()
  })

  it("explains an occupied destination slot instead of submitting", async () => {
    getGoalDetail.mockResolvedValue({
      goalId: "goal-1",
      projectIds: ["proj-a"],
    })
    listProjectGoals.mockResolvedValue({ goals: [occupyingMember()] })
    const user = userEvent.setup()
    render(
      <Harness
        goalRow={row({ projects: [membership("proj-a")] })}
        project={projectA}
      />
    )

    await openMenu(user)
    await user.click(
      await screen.findByTestId("goal-row-remove-from-project-goal-1")
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

    await openMenu(user)
    await user.click(
      await screen.findByTestId("goal-row-remove-from-project-goal-1")
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

    await openMenu(user)
    await user.click(
      await screen.findByTestId("goal-row-remove-from-project-goal-1")
    )

    await vi.waitFor(() => expect(toast.error).toHaveBeenCalled())
    const message = String(vi.mocked(toast.error).mock.calls[0]?.[0])
    expect(message).toContain("goals.project.membershipConflict")
    expect(message).toContain("Renamed Home")
  })
})
