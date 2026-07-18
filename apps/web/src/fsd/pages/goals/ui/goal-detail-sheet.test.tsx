import { fireEvent, render, screen } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const getGoal = vi.fn()
const updateGoal = vi.fn()
const updateGoalProjects = vi.fn()
const listProjects = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}))

const account = { homeAccountId: "account-1" }
vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({
    accounts: [account],
    instance: { getActiveAccount: () => account },
  }),
  useIsAuthenticated: () => true,
}))

vi.mock("@/entities/goal", () => ({
  goalQueries: {
    detail: (goalId: string) => ({
      queryFn: () => getGoal(goalId),
      queryKey: ["goals", "detail", goalId],
    }),
    lists: () => ["goals", "list"],
  },
  updateGoal: (...args: unknown[]) => updateGoal(...args),
  updateGoalProjects: (...args: unknown[]) => updateGoalProjects(...args),
}))

vi.mock("@/entities/project", () => ({
  projectQueries: {
    list: () => ({
      queryFn: () => listProjects(),
      queryKey: ["projects", "list"],
    }),
    all: () => ["projects"],
  },
}))

vi.mock("../model/use-goal-catalog", () => ({
  useGoalCatalog: () => ({
    getEntityName: (_type: string, id: string) => `Entity ${id}`,
    upgradesById: new Map([
      [
        "upgrade-1",
        {
          farmLocations: [{ battleId: "battle-1" }, { battleId: "battle-2" }],
        },
      ],
      ["upgrade-2", { farmLocations: [{ battleId: "battle-2" }] }],
    ]),
  }),
}))

vi.mock("@/shared/api", () => ({
  ApiError: class ApiError extends Error {
    readonly status: number

    constructor(status: number, message: string) {
      super(message)
      this.status = status
    }
  },
}))

import { ApiError } from "@/shared/api"

import { GoalDetailSheet } from "./goal-detail-sheet"

const detail = {
  goalId: "goal-1",
  entityType: "Character",
  entityId: "hero-1",
  goalType: "Rank",
  status: "Active",
  notes: "Old note",
  config: { farmingLocationIds: [] },
  dependsOn: ["dependency-1"],
  milestones: [
    {
      completedAt: "2026-01-02T00:00:00Z",
      index: 1,
      status: "completed",
      targetState: "Bronze I",
    },
  ],
  events: [{ at: "2026-01-01T00:00:00Z", type: "Created" }],
  projectIds: ["project-1"],
  snapshot: {
    initialRequirement: [
      { count: 2, resourceId: "upgrade-1" },
      { count: 3, resourceId: "upgrade-2" },
    ],
    originalEnergyTotal: 30,
    originalEstimateDate: "2026-01-10",
    originalEstimateDays: 5,
    originalRaidsTotal: 6,
  },
  updatedAt: "2026-01-01T00:00:00Z",
}

const dependency = {
  ...detail,
  dependsOn: [],
  entityId: "hero-2",
  goalId: "dependency-1",
  milestones: [],
  snapshot: null,
}

function renderSheet(
  props: Partial<Parameters<typeof GoalDetailSheet>[0]> = {}
) {
  return render(
    <GoalDetailSheet
      estimate={{ date: "2026-01-08", days: 3, status: "Estimated" } as never}
      goalId="goal-1"
      isolated
      onOpenChange={vi.fn()}
      onUpdated={vi.fn()}
      {...props}
    />
  )
}

describe("GoalDetailSheet", () => {
  beforeEach(() => {
    getGoal
      .mockReset()
      .mockImplementation((goalId: string) =>
        Promise.resolve(goalId === "dependency-1" ? dependency : detail)
      )
    updateGoal
      .mockReset()
      .mockImplementation((_goalId, request) =>
        Promise.resolve({ ...detail, ...request })
      )
    updateGoalProjects
      .mockReset()
      .mockImplementation((_goalId, projectIds) =>
        Promise.resolve({ ...detail, projectIds })
      )
    listProjects.mockReset().mockResolvedValue({
      projects: [
        { projectId: "project-1", name: "My Goals", isActivePlan: true },
        { projectId: "project-2", name: "Event Prep", isActivePlan: false },
      ],
    })
  })

  it("renders details, validates farming overrides, and saves edits", async () => {
    const user = userEvent.setup()
    const onUpdated = vi.fn()
    renderSheet({ onUpdated })

    expect(await screen.findByText("Entity hero-1")).toBeInTheDocument()
    expect(await screen.findByText(/Entity hero-2/)).toBeInTheDocument()
    expect(screen.getByText(/Bronze I/)).toBeInTheDocument()
    expect(screen.getByText(/Created/)).toBeInTheDocument()
    expect(
      screen.getByText("goals.detail.isolatedEstimate")
    ).toBeInTheDocument()

    const notes = screen.getByLabelText("goals.detail.notes")
    fireEvent.change(notes, { target: { value: " Updated note " } })

    const battle1 = screen.getByRole("checkbox", { name: "battle-1" })
    const battle2 = screen.getByRole("checkbox", { name: "battle-2" })
    await user.click(battle1)
    expect(screen.getByText("goals.detail.farmingInvalid")).toBeInTheDocument()
    expect(screen.getByText("goals.detail.save")).toBeDisabled()

    await user.click(battle2)
    await user.click(screen.getByText("goals.detail.save"))

    await vi.waitFor(() => {
      expect(updateGoal).toHaveBeenCalledWith("goal-1", {
        farmingLocationIds: ["battle-1", "battle-2"],
        notes: "Updated note",
      })
    })
    expect(onUpdated).toHaveBeenCalledOnce()
    // Project membership wasn't touched, so the goal-side membership call is skipped entirely.
    expect(updateGoalProjects).not.toHaveBeenCalled()

    await user.click(battle1)
    expect(screen.getByRole("checkbox", { name: "battle-1" })).not.toBeChecked()
  })

  it("renders blocked estimates and API load errors", async () => {
    const { unmount } = renderSheet({
      estimate: { reason: "NoFarmableLocations", status: "Blocked" } as never,
    })
    expect(await screen.findByText("Entity hero-1")).toBeInTheDocument()
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === "P" &&
          Boolean(
            element.textContent?.includes(
              "goals.estimate.blocked.NoFarmableLocations"
            )
          )
      )
    ).toBeInTheDocument()

    unmount()
    getGoal.mockReset().mockRejectedValue(new ApiError(404, "Goal missing"))
    renderSheet({ goalId: "missing" })
    expect(await screen.findByRole("alert")).toHaveTextContent("Goal missing")
  })

  it("shows generic and API save errors", async () => {
    const user = userEvent.setup()
    updateGoal.mockRejectedValueOnce(new Error("network"))
    renderSheet()
    expect(await screen.findByText("Entity hero-1")).toBeInTheDocument()

    await user.click(screen.getByText("goals.detail.save"))
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "goals.detail.saveError"
    )

    updateGoal.mockRejectedValueOnce(new ApiError(409, "Revision conflict"))
    await user.click(screen.getByText("goals.detail.save"))
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Revision conflict"
    )
  })

  it("adds the goal to another project on save", async () => {
    const user = userEvent.setup()
    renderSheet()
    expect(await screen.findByText("Entity hero-1")).toBeInTheDocument()

    const eventPrep = await screen.findByRole("checkbox", {
      name: "Event Prep",
    })
    await user.click(eventPrep)
    await user.click(screen.getByText("goals.detail.save"))

    await vi.waitFor(() => {
      expect(updateGoalProjects).toHaveBeenCalledWith("goal-1", [
        "project-1",
        "project-2",
      ])
    })
  })

  it("disables save and shows a validation message when every project is unchecked", async () => {
    const user = userEvent.setup()
    renderSheet()

    const myGoals = await screen.findByRole("checkbox", {
      name: "My Goals (goals.create.projectActive)",
    })
    await user.click(myGoals)

    expect(
      screen.getByText("goals.detail.projectsRequired")
    ).toBeInTheDocument()
    expect(screen.getByText("goals.detail.save")).toBeDisabled()
    expect(updateGoalProjects).not.toHaveBeenCalled()
  })
})
