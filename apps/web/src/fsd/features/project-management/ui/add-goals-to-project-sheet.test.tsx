import { useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, within } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { ApiError } from "@/shared/api"

vi.mock("react-i18next", () => ({
  initReactI18next: { init: () => undefined, type: "3rdParty" },
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

const listGoals = vi.fn<() => Promise<unknown>>()
const listArchivedGoals = vi.fn<() => Promise<unknown>>()
const updateProjectGoals = vi.fn()

// The project's non-archived members (its `goalIds`), as the project list reports them.
let members: string[] = []

vi.mock("@/entities/goal", () => ({
  goalRankTargetKey: (goal: {
    goalType: string
    config?: { rank?: { end: number } }
  }) => (goal.goalType === "Rank" ? `${goal.config?.rank?.end ?? 12}:0` : null),
  describeRankTargetKey: (key: string) => {
    const [end, slots] = key.split(":").map(Number)
    return { rank: `Rank${end}`, slots }
  },
  goalQueries: {
    all: () => ["goals"],
    lists: () => ["goals", "list"],
    list: (archived: boolean) => ({
      queryKey: ["goals", "list", { archived }],
      queryFn: () => (archived ? listArchivedGoals() : listGoals()),
    }),
  },
}))

vi.mock("@/entities/project", async () => ({
  ...(await vi.importActual<object>("@/entities/project")),
  projectQueries: {
    all: () => ["projects"],
    list: () => ({ queryKey: ["projects", "list"] }),
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
  isDefault: false,
  goalIds: [] as string[],
  revision: 0,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
}

let nextPosition = 1
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
    globalPriority: nextPosition++,
    ...overrides,
  }
}

function renderSheet() {
  return render(
    <AddGoalsToProjectSheet
      onCreateGoal={vi.fn()}
      onOpenChange={vi.fn()}
      open
      project={{ ...project, goalIds: members }}
    />
  )
}

const stale = (goalIds: string[]) =>
  new ApiError(409, "The project's goals changed after they were reviewed.", {
    issueCode: "membershipStale",
    current: { projectId: "proj-a", goalIds },
  })

describe("AddGoalsToProjectSheet", () => {
  beforeEach(() => {
    nextPosition = 1
    listGoals.mockReset()
    listArchivedGoals.mockReset().mockResolvedValue({ goals: [] })
    members = []
    updateProjectGoals.mockReset().mockResolvedValue({ goals: [] })
    vi.mocked(toast.success).mockReset()
    vi.mocked(toast.error).mockReset()
  })

  it("lists goals in the order the server returns them, marks members, and offers no sort", async () => {
    listGoals.mockResolvedValue({
      goals: [
        goal({ goalId: "goal-b", entityId: "hero2" }),
        goal({ goalId: "goal-a", entityId: "hero1" }),
      ],
    })
    members = ["goal-a"]
    renderSheet()

    expect(await screen.findByTestId("add-goals-row-goal-b")).toHaveTextContent(
      "hero2"
    )
    const rows = screen.getAllByTestId(/^add-goals-row-/)
    expect(rows.map((row) => row.dataset.testid)).toEqual([
      "add-goals-row-goal-b",
      "add-goals-row-goal-a",
    ])
    expect(rows[0]).toHaveTextContent("#1")
    expect(screen.getByTestId("add-goals-member-goal-a")).toBeInTheDocument()
    expect(
      screen.queryByTestId("add-goals-member-goal-b")
    ).not.toBeInTheDocument()
    expect(screen.queryByTestId("add-goals-sort")).not.toBeInTheDocument()
  })

  it("narrows the list as the user searches", async () => {
    listGoals.mockResolvedValue({
      goals: [goal(), goal({ goalId: "goal-2", entityId: "hero2" })],
    })
    members = []
    const user = userEvent.setup()
    renderSheet()

    await screen.findByTestId("add-goals-row-goal-1")
    await user.type(screen.getByTestId("add-goals-search"), "hero2")

    expect(screen.queryByTestId("add-goals-row-goal-1")).not.toBeInTheDocument()
    expect(screen.getByTestId("add-goals-row-goal-2")).toBeInTheDocument()
  })

  it("groups by unit or goal type without reordering, and keeps selections made under a filter", async () => {
    listGoals.mockResolvedValue({
      goals: [
        goal({ goalId: "goal-1", entityId: "hero1", goalType: "Rank" }),
        goal({ goalId: "goal-2", entityId: "hero2", goalType: "Ascension" }),
        goal({ goalId: "goal-3", entityId: "hero1", goalType: "Ascension" }),
      ],
    })
    members = []
    const user = userEvent.setup()
    renderSheet()

    await screen.findByTestId("add-goals-row-goal-1")
    expect(screen.getByTestId("add-goals-group-none")).toHaveAttribute(
      "aria-pressed",
      "true"
    )

    await user.click(screen.getByTestId("add-goals-group-unit"))
    const hero1 = screen.getByTestId("add-goals-group-section-Character:hero1")
    expect(
      within(hero1)
        .getAllByTestId(/^add-goals-row-/)
        .map((row) => row.dataset.testid)
    ).toEqual(["add-goals-row-goal-1", "add-goals-row-goal-3"])
    expect(
      screen.getByTestId("add-goals-group-section-Character:hero2")
    ).toBeInTheDocument()

    await user.click(screen.getByTestId("add-goals-group-type"))
    const ascension = screen.getByTestId("add-goals-group-section-Ascension")
    expect(
      within(ascension)
        .getAllByTestId(/^add-goals-row-/)
        .map((row) => row.dataset.testid)
    ).toEqual(["add-goals-row-goal-2", "add-goals-row-goal-3"])

    // Select under one filter, then filter it away: the selection is still saved.
    await user.click(screen.getByTestId("add-goals-check-goal-2"))
    await user.type(screen.getByTestId("add-goals-search"), "hero1")
    expect(screen.queryByTestId("add-goals-row-goal-2")).not.toBeInTheDocument()
    expect(screen.getByTestId("add-goals-review-adds")).toHaveTextContent(
      "hero2"
    )
    await user.click(screen.getByTestId("add-goals-save"))

    await vi.waitFor(() => expect(updateProjectGoals).toHaveBeenCalled())
    expect(updateProjectGoals).toHaveBeenCalledWith("proj-a", {
      goals: [{ goalId: "goal-2" }],
      expectedGoalIds: [],
    })
  })

  it("adds goals, sending the reviewed set and ids only, and keeps every existing member", async () => {
    listGoals.mockResolvedValue({
      goals: [
        goal({ goalId: "goal-new", entityId: "hero9" }),
        goal({ goalId: "goal-member", entityId: "hero1" }),
      ],
    })
    members = ["goal-member", "goal-member-2"]
    const user = userEvent.setup()
    renderSheet()

    await user.click(await screen.findByTestId("add-goals-check-goal-new"))
    expect(screen.getByTestId("add-goals-pending-add-goal-new")).toBeVisible()
    await user.click(screen.getByTestId("add-goals-save"))

    await vi.waitFor(() => expect(updateProjectGoals).toHaveBeenCalled())
    // Only goal ids: membership never carries priority, status or target.
    expect(updateProjectGoals).toHaveBeenCalledWith("proj-a", {
      goals: [
        { goalId: "goal-member" },
        { goalId: "goal-member-2" },
        { goalId: "goal-new" },
      ],
      expectedGoalIds: ["goal-member", "goal-member-2"],
    })
    await vi.waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        'goals.toasts.projectMembershipSaved:{"project":"Project A","added":1,"removed":0}'
      )
    )
    // The goal lists refetch: the saved goals' `projectIds` changed.
    expect(listGoals).toHaveBeenCalledTimes(2)
  })

  it("removes a member the user unticks, including one that is not listed, and keeps the rest", async () => {
    listGoals.mockResolvedValue({
      goals: [
        goal({ goalId: "goal-keep", entityId: "hero1" }),
        goal({ goalId: "goal-drop", entityId: "hero2" }),
      ],
    })
    members = ["goal-keep", "goal-drop"]
    // An archived member is not listed but must survive the save.
    listArchivedGoals.mockResolvedValue({
      goals: [
        goal({
          goalId: "goal-archived",
          entityId: "hero3",
          status: "Archived",
          globalPriority: null,
          projectIds: ["proj-a"],
        }),
      ],
    })
    const user = userEvent.setup()
    renderSheet()

    const check = await screen.findByTestId("add-goals-check-goal-drop")
    expect(check).toBeChecked()
    await user.click(check)
    expect(check).not.toBeChecked()
    expect(
      screen.getByTestId("add-goals-pending-remove-goal-drop")
    ).toBeVisible()
    expect(screen.getByTestId("add-goals-review-removes")).toHaveTextContent(
      "hero2"
    )
    await user.click(screen.getByTestId("add-goals-save"))

    await vi.waitFor(() => expect(updateProjectGoals).toHaveBeenCalled())
    expect(updateProjectGoals).toHaveBeenCalledWith("proj-a", {
      goals: [{ goalId: "goal-keep" }, { goalId: "goal-archived" }],
      expectedGoalIds: ["goal-keep", "goal-drop", "goal-archived"],
    })
  })

  it("reviews a mixed batch by name and saves it in one call", async () => {
    listGoals.mockResolvedValue({
      goals: [
        goal({ goalId: "goal-m1", entityId: "hero1" }),
        goal({ goalId: "goal-m2", entityId: "hero2" }),
        goal({ goalId: "goal-n1", entityId: "hero3" }),
        goal({ goalId: "goal-n2", entityId: "hero4" }),
        goal({ goalId: "goal-n3", entityId: "hero5" }),
      ],
    })
    members = ["goal-m1", "goal-m2"]
    const user = userEvent.setup()
    renderSheet()

    await user.click(await screen.findByTestId("add-goals-check-goal-m1"))
    await user.click(screen.getByTestId("add-goals-check-goal-m2"))
    await user.click(screen.getByTestId("add-goals-check-goal-n1"))
    await user.click(screen.getByTestId("add-goals-check-goal-n2"))
    await user.click(screen.getByTestId("add-goals-check-goal-n3"))

    const adds = screen.getByTestId("add-goals-review-adds")
    expect(adds).toHaveTextContent("hero3")
    expect(adds).toHaveTextContent("hero4")
    expect(adds).toHaveTextContent("hero5")
    expect(screen.getByTestId("add-goals-review-removes")).toHaveTextContent(
      "hero1"
    )
    expect(screen.getByTestId("add-goals-save")).toHaveTextContent('"count":5')
    await user.click(screen.getByTestId("add-goals-save"))

    await vi.waitFor(() => expect(updateProjectGoals).toHaveBeenCalledTimes(1))
    expect(updateProjectGoals).toHaveBeenCalledWith("proj-a", {
      goals: [
        { goalId: "goal-n1" },
        { goalId: "goal-n2" },
        { goalId: "goal-n3" },
      ],
      expectedGoalIds: ["goal-m1", "goal-m2"],
    })
  })

  it("has nothing to save until something changes, and again once a change is undone", async () => {
    listGoals.mockResolvedValue({
      goals: [goal(), goal({ goalId: "goal-2", entityId: "hero2" })],
    })
    members = ["goal-1"]
    const user = userEvent.setup()
    renderSheet()

    await screen.findByTestId("add-goals-row-goal-1")
    expect(screen.getByTestId("add-goals-save")).toBeDisabled()
    expect(screen.getByTestId("add-goals-review")).toHaveTextContent(
      "goals.project.assemblyReviewEmpty"
    )

    await user.click(screen.getByTestId("add-goals-check-goal-2"))
    expect(screen.getByTestId("add-goals-save")).toBeEnabled()
    await user.click(screen.getByTestId("add-goals-check-goal-2"))
    expect(screen.getByTestId("add-goals-save")).toBeDisabled()
    expect(updateProjectGoals).not.toHaveBeenCalled()
  })

  it("lets another goal for a member's unit be selected and saved: membership is never slot-checked", async () => {
    listGoals.mockResolvedValue({ goals: [goal({ goalId: "goal-gold" })] })
    members = ["goal-member"]
    const user = userEvent.setup()
    renderSheet()

    const check = await screen.findByTestId("add-goals-check-goal-gold")
    await vi.waitFor(() => expect(check).not.toBeDisabled())
    await user.click(check)
    await user.click(screen.getByTestId("add-goals-save"))

    await vi.waitFor(() =>
      expect(updateProjectGoals).toHaveBeenCalledWith("proj-a", {
        goals: [{ goalId: "goal-member" }, { goalId: "goal-gold" }],
        expectedGoalIds: ["goal-member"],
      })
    )
  })

  it("saves two picks for the same unit and Rank target in one batch", async () => {
    listGoals.mockResolvedValue({
      goals: [
        goal({ goalId: "goal-a" }),
        goal({ goalId: "goal-b" }),
        goal({ goalId: "goal-c", entityId: "hero3" }),
      ],
    })
    members = []
    const user = userEvent.setup()
    renderSheet()

    await user.click(await screen.findByTestId("add-goals-check-goal-a"))
    await user.click(screen.getByTestId("add-goals-check-goal-b"))
    await user.click(screen.getByTestId("add-goals-check-goal-c"))
    await user.click(screen.getByTestId("add-goals-save"))

    await vi.waitFor(() => expect(updateProjectGoals).toHaveBeenCalled())
    expect(updateProjectGoals).toHaveBeenCalledWith("proj-a", {
      goals: [{ goalId: "goal-a" }, { goalId: "goal-b" }, { goalId: "goal-c" }],
      expectedGoalIds: [],
    })
  })

  describe("rejections", () => {
    it("shows a stale conflict in context, keeps the draft, and re-reviews after a refresh", async () => {
      listGoals.mockResolvedValue({
        goals: [
          goal({ goalId: "goal-a", entityId: "hero1" }),
          goal({ goalId: "goal-b", entityId: "hero2" }),
          goal({ goalId: "goal-c", entityId: "hero3" }),
        ],
      })
      members = ["goal-a"]
      // Elsewhere: goal-a stays, goal-c joined.
      updateProjectGoals.mockRejectedValueOnce(stale(["goal-a", "goal-c"]))
      const user = userEvent.setup()
      renderSheet()

      await user.click(await screen.findByTestId("add-goals-check-goal-b"))
      await user.click(screen.getByTestId("add-goals-save"))

      const banner = await screen.findByTestId("add-goals-conflict")
      expect(screen.getByTestId("add-goals-stale-added")).toHaveTextContent(
        "hero3"
      )
      expect(banner).toBeVisible()
      // The draft survives and the save waits for an explicit re-review.
      expect(screen.getByTestId("add-goals-check-goal-b")).toBeChecked()
      expect(screen.getByTestId("add-goals-save")).toBeDisabled()
      expect(toast.error).not.toHaveBeenCalled()
      expect(updateProjectGoals).toHaveBeenCalledTimes(1)

      await user.click(screen.getByTestId("add-goals-refresh"))
      expect(screen.queryByTestId("add-goals-conflict")).toBeNull()
      expect(screen.getByTestId("add-goals-member-goal-c")).toBeVisible()
      expect(screen.getByTestId("add-goals-check-goal-b")).toBeChecked()
      await user.click(screen.getByTestId("add-goals-save"))

      await vi.waitFor(() =>
        expect(updateProjectGoals).toHaveBeenCalledTimes(2)
      )
      expect(updateProjectGoals).toHaveBeenLastCalledWith("proj-a", {
        goals: [
          { goalId: "goal-a" },
          { goalId: "goal-c" },
          { goalId: "goal-b" },
        ],
        expectedGoalIds: ["goal-a", "goal-c"],
      })
    })

    it("drops a pending removal the other edit already made, and a pending addition it already made", async () => {
      listGoals.mockResolvedValue({
        goals: [
          goal({ goalId: "goal-a", entityId: "hero1" }),
          goal({ goalId: "goal-b", entityId: "hero2" }),
        ],
      })
      members = ["goal-a"]
      // Elsewhere: goal-a left and goal-b joined — both of this draft's intents are already true.
      updateProjectGoals.mockRejectedValueOnce(stale(["goal-b"]))
      const user = userEvent.setup()
      renderSheet()

      await user.click(await screen.findByTestId("add-goals-check-goal-a"))
      await user.click(screen.getByTestId("add-goals-check-goal-b"))
      await user.click(screen.getByTestId("add-goals-save"))
      await user.click(await screen.findByTestId("add-goals-refresh"))

      expect(screen.getByTestId("add-goals-save")).toBeDisabled()
      expect(screen.getByTestId("add-goals-check-goal-b")).toBeChecked()
      expect(screen.getByTestId("add-goals-check-goal-a")).not.toBeChecked()
    })

    it("marks the goals a last-membership rejection names, keeps the draft, and clears the mark on the next edit", async () => {
      listGoals.mockResolvedValue({
        goals: [
          goal({ goalId: "goal-a", entityId: "hero1" }),
          goal({ goalId: "goal-b", entityId: "hero2" }),
        ],
      })
      members = ["goal-a", "goal-b"]
      updateProjectGoals.mockRejectedValueOnce(
        new ApiError(
          400,
          "Cannot remove a goal from its only remaining project.",
          {
            issueCode: "lastProjectMembership",
            extensions: { blockedGoalIds: ["goal-a"] },
          }
        )
      )
      const user = userEvent.setup()
      renderSheet()

      await user.click(await screen.findByTestId("add-goals-check-goal-a"))
      await user.click(screen.getByTestId("add-goals-save"))

      expect(
        await screen.findByTestId("add-goals-conflict-goal-a")
      ).toHaveTextContent("goals.project.assemblyLastMembership")
      expect(screen.getByTestId("add-goals-conflict")).toHaveTextContent(
        "hero1"
      )
      expect(screen.getByTestId("add-goals-check-goal-a")).not.toBeChecked()
      expect(screen.getByTestId("add-goals-save")).toBeEnabled()
      expect(toast.error).not.toHaveBeenCalled()

      // Keeping the goal is the fix: the mark goes away with the edit.
      await user.click(screen.getByTestId("add-goals-check-goal-a"))
      expect(screen.queryByTestId("add-goals-conflict")).toBeNull()
    })

    it("toasts any other failure and keeps the draft", async () => {
      listGoals.mockResolvedValue({ goals: [goal()] })
      members = []
      updateProjectGoals.mockRejectedValue(new ApiError(500, "Boom"))
      const user = userEvent.setup()
      renderSheet()

      await user.click(await screen.findByTestId("add-goals-check-goal-1"))
      await user.click(screen.getByTestId("add-goals-save"))

      await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith("Boom"))
      expect(screen.getByTestId("add-goals-check-goal-1")).toBeChecked()
      expect(screen.queryByTestId("add-goals-conflict")).toBeNull()
    })
  })

  it("drops an unsaved draft when the viewed project changes or the sheet closes", async () => {
    listGoals.mockResolvedValue({
      goals: [
        goal({ goalId: "goal-a" }),
        goal({ goalId: "goal-c", entityId: "hero3" }),
      ],
    })
    members = []
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
    expect(screen.getByTestId("add-goals-save")).toBeDisabled()

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
            project={{ ...project, projectId, goalIds: members }}
          />
        </>
      )
    }

    it("stays available when the search has no matches", async () => {
      listGoals.mockResolvedValue({ goals: [goal()] })
      members = []
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
      members = []
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

    it("restores pending selections and search after creation, reading the new member into the baseline", async () => {
      listGoals.mockResolvedValue({
        goals: [goal(), goal({ goalId: "goal-2", entityId: "hero2" })],
      })
      members = []
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
      members = ["goal-new"]
      await user.click(screen.getByTestId("reopen"))

      expect(await screen.findByTestId("add-goals-search")).toHaveValue("hero1")
      expect(screen.getByTestId("add-goals-check-goal-1")).toBeChecked()
      await user.clear(screen.getByTestId("add-goals-search"))
      expect(
        await screen.findByTestId("add-goals-member-goal-new")
      ).toBeInTheDocument()

      await user.click(screen.getByTestId("add-goals-save"))
      await vi.waitFor(() => expect(updateProjectGoals).toHaveBeenCalled())
      expect(updateProjectGoals).toHaveBeenCalledWith("proj-a", {
        goals: [{ goalId: "goal-new" }, { goalId: "goal-1" }],
        expectedGoalIds: ["goal-new"],
      })
    })

    it("restores the draft after creation is cancelled, but drops it after a normal dismiss", async () => {
      listGoals.mockResolvedValue({ goals: [goal()] })
      members = []
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
