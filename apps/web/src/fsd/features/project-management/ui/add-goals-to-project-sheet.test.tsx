import { useState } from "react"
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

vi.mock("@/shared/api", () => ({
  ApiError: class ApiError extends Error {},
}))

const listGoals = vi.fn<() => Promise<unknown>>()
const listProjectGoals = vi.fn<() => Promise<unknown>>()
const updateProjectGoals = vi.fn()

vi.mock("@/entities/goal", () => ({
  goalQueries: {
    all: () => ["goals"],
    list: (archived: boolean) => ({
      queryKey: ["goals", "list", { archived }],
      queryFn: () => listGoals(),
    }),
  },
}))

vi.mock("@/entities/project", () => ({
  projectQueries: {
    all: () => ["projects"],
    goals: (projectId: string) => ({
      queryKey: ["projects", projectId, "goals"],
      queryFn: () => listProjectGoals(),
    }),
  },
  updateProjectGoals: (...args: unknown[]) => updateProjectGoals(...args),
}))

import { AddGoalsToProjectSheet } from "./add-goals-to-project-sheet"

const project = {
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

function goal(overrides: Record<string, unknown> = {}) {
  return {
    goalId: "goal-1",
    entityType: "Character",
    entityId: "hero1",
    goalType: "Rank",
    status: "Active",
    notes: null,
    dependsOn: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

function renderSheet() {
  return render(
    <AddGoalsToProjectSheet
      onCreateGoal={vi.fn()}
      onOpenChange={vi.fn()}
      open
      project={project}
    />
  )
}

describe("AddGoalsToProjectSheet", () => {
  beforeEach(() => {
    listGoals.mockReset()
    listProjectGoals.mockReset()
    updateProjectGoals.mockReset().mockResolvedValue({ goals: [] })
    vi.mocked(toast.success).mockReset()
    vi.mocked(toast.error).mockReset()
  })

  it("lists the profile's goals and marks the ones already in this project", async () => {
    listGoals.mockResolvedValue({
      goals: [goal(), goal({ goalId: "goal-2", entityId: "hero2" })],
    })
    listProjectGoals.mockResolvedValue({
      goals: [{ goal: goal(), priority: 3 }],
    })
    renderSheet()

    expect(await screen.findByTestId("add-goals-row-goal-1")).toHaveTextContent(
      "hero1"
    )
    expect(screen.getByTestId("add-goals-row-goal-2")).toBeInTheDocument()
    expect(screen.getByTestId("add-goals-member-goal-1")).toBeInTheDocument()
    expect(
      screen.queryByTestId("add-goals-member-goal-2")
    ).not.toBeInTheDocument()
  })

  it("narrows the list as the user searches", async () => {
    listGoals.mockResolvedValue({
      goals: [goal(), goal({ goalId: "goal-2", entityId: "hero2" })],
    })
    listProjectGoals.mockResolvedValue({ goals: [] })
    const user = userEvent.setup()
    renderSheet()

    await screen.findByTestId("add-goals-row-goal-1")
    await user.type(screen.getByTestId("add-goals-search"), "hero2")

    expect(screen.queryByTestId("add-goals-row-goal-1")).not.toBeInTheDocument()
    expect(screen.getByTestId("add-goals-row-goal-2")).toBeInTheDocument()
  })

  it("keeps existing members with their priorities and appends additions last", async () => {
    listGoals.mockResolvedValue({
      goals: [
        goal({ goalId: "goal-new", entityId: "hero9" }),
        goal({ goalId: "goal-member", entityId: "hero1" }),
      ],
    })
    listProjectGoals.mockResolvedValue({
      goals: [
        { goal: goal({ goalId: "goal-member" }), priority: 1 },
        {
          goal: goal({ goalId: "goal-member-2", entityId: "hero2" }),
          priority: 2,
        },
      ],
    })
    const user = userEvent.setup()
    renderSheet()

    await user.click(await screen.findByTestId("add-goals-check-goal-new"))
    await user.click(screen.getByTestId("add-goals-save"))

    await vi.waitFor(() => expect(updateProjectGoals).toHaveBeenCalled())
    expect(updateProjectGoals).toHaveBeenCalledWith("proj-a", [
      { goalId: "goal-member", priority: 1 },
      { goalId: "goal-member-2", priority: 2 },
      { goalId: "goal-new", priority: 3 },
    ])
  })

  it("never drops an existing member from the submitted list", async () => {
    listGoals.mockResolvedValue({
      goals: [
        goal({ goalId: "goal-new", entityId: "hero9" }),
        goal({ goalId: "goal-member" }),
      ],
    })
    listProjectGoals.mockResolvedValue({
      goals: [{ goal: goal({ goalId: "goal-member" }), priority: 5 }],
    })
    const user = userEvent.setup()
    renderSheet()

    // An already-member goal renders as a member and cannot be unchecked.
    expect(
      await screen.findByTestId("add-goals-check-goal-member")
    ).toBeDisabled()

    await user.click(screen.getByTestId("add-goals-check-goal-new"))
    await user.click(screen.getByTestId("add-goals-save"))

    await vi.waitFor(() => expect(updateProjectGoals).toHaveBeenCalled())
    const submitted = updateProjectGoals.mock.calls[0]?.[1] as {
      goalId: string
    }[]
    expect(submitted.map((entry) => entry.goalId)).toContain("goal-member")
  })

  it("submits membership as it stands at save time, not as the sheet rendered it", async () => {
    listGoals.mockResolvedValue({
      goals: [goal({ goalId: "goal-new", entityId: "hero9" })],
    })
    listProjectGoals.mockResolvedValueOnce({ goals: [] }).mockResolvedValue({
      goals: [
        {
          goal: goal({ goalId: "goal-elsewhere", entityId: "hero5" }),
          priority: 1,
        },
      ],
    })
    const user = userEvent.setup()
    renderSheet()

    await user.click(await screen.findByTestId("add-goals-check-goal-new"))
    await user.click(screen.getByTestId("add-goals-save"))

    await vi.waitFor(() => expect(updateProjectGoals).toHaveBeenCalled())
    expect(updateProjectGoals).toHaveBeenCalledWith("proj-a", [
      { goalId: "goal-elsewhere", priority: 1 },
      { goalId: "goal-new", priority: 2 },
    ])
  })

  it("blocks a selection whose goal-type slot is held by an active member, and states why", async () => {
    listGoals.mockResolvedValue({
      goals: [goal({ goalId: "goal-conflicting" })],
    })
    listProjectGoals.mockResolvedValue({
      goals: [{ goal: goal({ goalId: "goal-member" }), priority: 1 }],
    })
    renderSheet()

    expect(
      await screen.findByTestId("add-goals-check-goal-conflicting")
    ).toBeDisabled()
    expect(
      screen.getByTestId("add-goals-blocked-goal-conflicting")
    ).toHaveTextContent("goals.project.assemblySlotTaken")
  })

  it("does not block a selection whose slot is only held by a historical goal", async () => {
    listGoals.mockResolvedValue({
      goals: [goal({ goalId: "goal-candidate" })],
    })
    listProjectGoals.mockResolvedValue({
      goals: [
        {
          goal: goal({ goalId: "goal-member", status: "Completed" }),
          priority: 1,
        },
      ],
    })
    renderSheet()

    expect(
      await screen.findByTestId("add-goals-check-goal-candidate")
    ).not.toBeDisabled()
    expect(
      screen.queryByTestId("add-goals-blocked-goal-candidate")
    ).not.toBeInTheDocument()
  })

  it("blocks only the conflicting pick and still saves the rest of the batch", async () => {
    listGoals.mockResolvedValue({
      goals: [
        goal({ goalId: "goal-a" }),
        goal({ goalId: "goal-b" }),
        goal({ goalId: "goal-c", entityId: "hero3" }),
      ],
    })
    listProjectGoals.mockResolvedValue({ goals: [] })
    const user = userEvent.setup()
    renderSheet()

    await user.click(await screen.findByTestId("add-goals-check-goal-a"))
    await user.click(screen.getByTestId("add-goals-check-goal-c"))

    // goal-b shares goal-a's unit-and-type slot, so picking it would have the endpoint reject the
    // whole save — it becomes unselectable instead.
    expect(screen.getByTestId("add-goals-check-goal-b")).toBeDisabled()

    await user.click(screen.getByTestId("add-goals-save"))

    await vi.waitFor(() => expect(updateProjectGoals).toHaveBeenCalled())
    expect(updateProjectGoals).toHaveBeenCalledWith("proj-a", [
      { goalId: "goal-a", priority: 1 },
      { goalId: "goal-c", priority: 2 },
    ])
  })

  it("drops an unsaved draft when the viewed project changes or the sheet closes", async () => {
    listGoals.mockResolvedValue({
      goals: [
        goal({ goalId: "goal-a" }),
        goal({ goalId: "goal-c", entityId: "hero3" }),
      ],
    })
    listProjectGoals.mockResolvedValue({ goals: [] })
    const user = userEvent.setup()
    const { rerender } = render(
      <AddGoalsToProjectSheet
        onCreateGoal={vi.fn()}
        onOpenChange={vi.fn()}
        open
        project={project}
      />
    )

    await user.click(await screen.findByTestId("add-goals-check-goal-a"))
    expect(screen.getByTestId("add-goals-check-goal-a")).toBeChecked()

    // The detail route has no `key`, so its header switcher swaps `project` underneath a sheet that
    // never remounts — a draft that survived would be submitted against the newly viewed project.
    rerender(
      <AddGoalsToProjectSheet
        onCreateGoal={vi.fn()}
        onOpenChange={vi.fn()}
        open
        project={{ ...project, projectId: "proj-b", name: "Project B" }}
      />
    )
    expect(
      await screen.findByTestId("add-goals-check-goal-a")
    ).not.toBeChecked()

    await user.click(screen.getByTestId("add-goals-check-goal-a"))
    rerender(
      <AddGoalsToProjectSheet
        onCreateGoal={vi.fn()}
        onOpenChange={vi.fn()}
        open={false}
        project={{ ...project, projectId: "proj-b", name: "Project B" }}
      />
    )
    rerender(
      <AddGoalsToProjectSheet
        onCreateGoal={vi.fn()}
        onOpenChange={vi.fn()}
        open
        project={{ ...project, projectId: "proj-b", name: "Project B" }}
      />
    )
    expect(
      await screen.findByTestId("add-goals-check-goal-a")
    ).not.toBeChecked()
  })

  describe("Create new goal", () => {
    function Harness({
      onCreateGoal,
      projectId = "proj-a",
    }: {
      onCreateGoal: () => void
      projectId?: string
    }) {
      const [open, setOpen] = useState(true)
      return (
        <>
          <button data-testid="reopen" onClick={() => setOpen(true)} />
          <AddGoalsToProjectSheet
            onCreateGoal={onCreateGoal}
            onOpenChange={setOpen}
            open={open}
            project={{ ...project, projectId }}
          />
        </>
      )
    }

    it("stays available when the search has no matches", async () => {
      listGoals.mockResolvedValue({ goals: [goal()] })
      listProjectGoals.mockResolvedValue({ goals: [] })
      const user = userEvent.setup()
      render(<Harness onCreateGoal={vi.fn()} />)

      await user.type(
        await screen.findByTestId("add-goals-search"),
        "no-such-goal"
      )
      expect(screen.queryByTestId("add-goals-row-goal-1")).toBeNull()
      expect(screen.getByTestId("add-goals-create-new")).toBeEnabled()
    })

    it("launches creation and closes the sheet without saving pending selections", async () => {
      listGoals.mockResolvedValue({ goals: [goal()] })
      listProjectGoals.mockResolvedValue({ goals: [] })
      const onCreateGoal = vi.fn()
      const user = userEvent.setup()
      render(<Harness onCreateGoal={onCreateGoal} />)

      await user.click(await screen.findByTestId("add-goals-check-goal-1"))
      await user.click(screen.getByTestId("add-goals-create-new"))

      expect(onCreateGoal).toHaveBeenCalledTimes(1)
      await vi.waitFor(() =>
        expect(
          screen.queryByTestId("add-goals-to-project-sheet")
        ).not.toBeInTheDocument()
      )
      expect(updateProjectGoals).not.toHaveBeenCalled()
    })

    it("restores pending selections and search after creation, without duplicating the new member", async () => {
      listGoals.mockResolvedValue({
        goals: [goal(), goal({ goalId: "goal-2", entityId: "hero2" })],
      })
      listProjectGoals.mockResolvedValue({ goals: [] })
      const user = userEvent.setup()
      render(<Harness onCreateGoal={vi.fn()} />)

      await user.type(await screen.findByTestId("add-goals-search"), "hero1")
      await user.click(await screen.findByTestId("add-goals-check-goal-1"))
      await user.click(screen.getByTestId("add-goals-create-new"))
      await vi.waitFor(() =>
        expect(
          screen.queryByTestId("add-goals-to-project-sheet")
        ).not.toBeInTheDocument()
      )

      // The creation sheet saved a new goal already assigned to this project.
      const created = goal({ goalId: "goal-new", entityId: "hero-new" })
      listGoals.mockResolvedValue({
        goals: [goal(), goal({ goalId: "goal-2", entityId: "hero2" }), created],
      })
      listProjectGoals.mockResolvedValue({
        goals: [{ goal: created, priority: 1 }],
      })
      await user.click(screen.getByTestId("reopen"))

      expect(await screen.findByTestId("add-goals-search")).toHaveValue("hero1")
      expect(screen.getByTestId("add-goals-check-goal-1")).toBeChecked()
      await user.clear(screen.getByTestId("add-goals-search"))
      expect(
        await screen.findByTestId("add-goals-member-goal-new")
      ).toBeInTheDocument()

      await user.click(screen.getByTestId("add-goals-save"))
      await vi.waitFor(() => expect(updateProjectGoals).toHaveBeenCalled())
      expect(updateProjectGoals).toHaveBeenCalledWith("proj-a", [
        { goalId: "goal-new", priority: 1 },
        { goalId: "goal-1", priority: 2 },
      ])
    })

    it("restores the draft after creation is cancelled, but drops it after a normal dismiss", async () => {
      listGoals.mockResolvedValue({ goals: [goal()] })
      listProjectGoals.mockResolvedValue({ goals: [] })
      const user = userEvent.setup()
      render(<Harness onCreateGoal={vi.fn()} />)

      await user.click(await screen.findByTestId("add-goals-check-goal-1"))
      await user.click(screen.getByTestId("add-goals-create-new"))
      await user.click(screen.getByTestId("reopen"))
      expect(await screen.findByTestId("add-goals-check-goal-1")).toBeChecked()

      await user.keyboard("{Escape}")
      await user.click(screen.getByTestId("reopen"))
      expect(
        await screen.findByTestId("add-goals-check-goal-1")
      ).not.toBeChecked()
    })
  })
})
