import { useEffect, useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: (
    querier: () => unknown,
    deps: unknown[] = [],
    defaultResult?: unknown
  ) => {
    const [value, setValue] = useState<unknown>(defaultResult)
    useEffect(() => {
      const result = querier()
      if (result instanceof Promise) {
        let active = true
        void result.then((resolved) => {
          if (active) setValue(resolved)
        })
        return () => {
          active = false
        }
      }
      setValue(result)
      return undefined
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)
    return value
  },
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) =>
      opts?.defaultValue ?? key,
  }),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const account = { homeAccountId: "acc-1", username: "test@example.com" }

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({
    accounts: [account],
    instance: { getActiveAccount: () => account },
  }),
  useIsAuthenticated: () => false,
}))

const characters = new Map([
  [
    "hero1",
    {
      id: "hero1",
      name: "Hero One",
      faction: "Ultramarines",
      rankUpUpgrades: [{ rank: "Stone1", upgradeIds: ["h1"] }],
    },
  ],
])

vi.mock("@workspace/game-catalog/queries", () => ({
  getCharactersMap: () => characters,
  getUpgrades: () => [],
  getCampaignBattles: () => [],
}))

vi.mock("@workspace/player-data/queries", () => ({
  getPlayerCharacter: () => Promise.resolve(undefined),
  getInventoryUpgrades: () => undefined,
}))

const listGoals = vi.fn()
const listProjects = vi.fn()
const createGoal = vi.fn()
const updateGoalStatus = vi.fn()
const deleteGoal = vi.fn()

vi.mock("@/entities/goal", () => ({
  listGoals: (...args: unknown[]) => listGoals(...args),
  createGoal: (...args: unknown[]) => createGoal(...args),
  updateGoalStatus: (...args: unknown[]) => updateGoalStatus(...args),
  deleteGoal: (...args: unknown[]) => deleteGoal(...args),
}))

const listProjectGoals = vi.fn()
const activateProject = vi.fn()
const updateProjectGoals = vi.fn()
const updateProjectGoalsStatus = vi.fn()

vi.mock("@/entities/project", () => ({
  listProjects: (...args: unknown[]) => listProjects(...args),
  listProjectGoals: (...args: unknown[]) => listProjectGoals(...args),
  activateProject: (...args: unknown[]) => activateProject(...args),
  updateProjectGoals: (...args: unknown[]) => updateProjectGoals(...args),
  updateProjectGoalsStatus: (...args: unknown[]) =>
    updateProjectGoalsStatus(...args),
}))

vi.mock("@/shared/api", () => ({ ApiError: class ApiError extends Error {} }))

import { GoalsPage } from "./goals-page"

const activeGoal = {
  goalId: "goal-1",
  entityType: "Character",
  entityId: "hero1",
  goalType: "Rank",
  status: "Active",
  notes: null,
  aggregateId: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
}

describe("GoalsPage", () => {
  beforeEach(() => {
    listGoals.mockReset()
    listProjects.mockReset()
    listProjectGoals.mockReset()
    listProjectGoals.mockResolvedValue({ goals: [] })
    listProjects.mockResolvedValue({ projects: [] })
  })

  it("opens the create-goal sheet from the header button", async () => {
    listGoals.mockResolvedValue({ goals: [] })
    render(<GoalsPage />)

    expect(screen.queryByTestId("create-goal-sheet")).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId("goals-page-create-button"))

    expect(await screen.findByTestId("create-goal-sheet")).toBeInTheDocument()
  })

  it("opens the create-goal sheet from the empty-state button", async () => {
    listGoals.mockResolvedValue({ goals: [] })
    render(<GoalsPage />)

    fireEvent.click(await screen.findByTestId("goals-page-empty-create-button"))

    expect(await screen.findByTestId("create-goal-sheet")).toBeInTheDocument()
  })

  it("refetches the goal list after a successful creation", async () => {
    listGoals.mockResolvedValue({ goals: [] })
    createGoal.mockResolvedValue({ goalId: "goal-1" })
    render(<GoalsPage />)

    await screen.findByTestId("goals-page-empty")
    // React's dev-mode double-invocation of effects means the initial load can legitimately fire
    // listGoals more than once before settling — capture the count once stable rather than
    // asserting a hardcoded "1", and assert it *increases* after the create action below.
    const initialCallCount = listGoals.mock.calls.length
    expect(initialCallCount).toBeGreaterThan(0)

    fireEvent.click(screen.getByTestId("goals-page-create-button"))
    fireEvent.click(
      screen.getByRole("combobox", {
        name: "goals.create.characterPlaceholder",
      })
    )
    fireEvent.click(await screen.findByText("Hero One"))
    fireEvent.click(screen.getByTestId("create-goal-submit"))

    await vi.waitFor(() => {
      expect(listGoals.mock.calls.length).toBeGreaterThan(initialCallCount)
    })
  })

  it("shows a row for an active goal with lifecycle actions", async () => {
    listGoals.mockResolvedValue({ goals: [activeGoal] })
    render(<GoalsPage />)

    expect(await screen.findByTestId("goals-list-table")).toBeInTheDocument()
    expect(screen.getByText("Hero One")).toBeInTheDocument()
    expect(
      screen.getByTestId(`goal-row-actions-trigger-${activeGoal.goalId}`)
    ).toBeInTheDocument()
  })

  it("filters out the active goal when switching to the Completed tab", async () => {
    listGoals.mockResolvedValue({ goals: [activeGoal] })
    const user = userEvent.setup()
    render(<GoalsPage />)

    await screen.findByTestId("goals-list-table")

    await user.click(screen.getByTestId("goals-tab-completed"))

    expect(
      await screen.findByTestId("goals-page-filtered-empty")
    ).toBeInTheDocument()
  })

  it("switches to grid view", async () => {
    listGoals.mockResolvedValue({ goals: [activeGoal] })
    render(<GoalsPage />)

    await screen.findByTestId("goals-list-table")

    fireEvent.click(screen.getByTestId("goals-view-grid"))

    expect(await screen.findByTestId("goals-grid")).toBeInTheDocument()
  })

  it("selecting a project filter fetches that project's goals", async () => {
    listGoals.mockResolvedValue({ goals: [] })
    listProjects.mockResolvedValue({
      projects: [
        {
          projectId: "proj-1",
          name: "My Goals",
          description: null,
          color: null,
          status: "Active",
          isActivePlan: true,
          isDefault: true,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ],
    })
    render(<GoalsPage />)

    fireEvent.click(await screen.findByTestId("goals-project-filter"))
    fireEvent.click(
      screen.getByRole("option", { name: "My Goals (goals.project.active)" })
    )

    await vi.waitFor(() => {
      expect(listProjectGoals).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        "proj-1",
        expect.anything()
      )
    })
  })
})
