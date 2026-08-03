import { useEffect, useState } from "react"
import { fireEvent, render, screen, within } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
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

vi.mock("@workspace/player-data/queries", () => ({
  getPlayerCharacters: () => [],
  getPlayerMows: () => [],
  getInventoryUpgrades: () => [],
  getPlayerInventoryItems: () => [],
  getInventoryShard: () => Promise.resolve(undefined),
}))

vi.mock("@/entities/goal", () => ({
  goalQueries: {
    detail: (goalId: string) => ({
      queryFn: () => getGoal(goalId),
      queryKey: ["goals", "detail", goalId],
    }),
    list: () => ({
      queryFn: () => Promise.resolve({ goals: [] }),
      queryKey: ["goals", "list", { archived: false }],
    }),
    lists: () => ["goals", "list"],
  },
  updateGoal: (...args: unknown[]) => updateGoal(...args),
  updateGoalProjects: (...args: unknown[]) => updateGoalProjects(...args),
}))

vi.mock("@/entities/project", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/project")>()),
  projectQueries: {
    list: () => ({
      queryFn: () => listProjects(),
      queryKey: ["projects", "list"],
    }),
    all: () => ["projects"],
  },
}))

vi.mock("../../model/shared/use-goal-catalog", () => ({
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
    charactersById: new Map([
      [
        "hero-1",
        {
          shardLocations: [
            { battleId: "shard-battle-1" },
            { battleId: "shard-battle-2" },
          ],
        },
      ],
    ]),
    mowsById: new Map(),
    ascensionCostsById: new Map(),
    unlockShardCostsById: new Map(),
    getCharacter: () => undefined,
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
import { CreateGoalLauncherProvider } from "../../model/goal-creation-form/create-goal-launcher"

import { GoalDetailSheet } from ".//goal-detail-sheet"

const detail = {
  goalId: "goal-1",
  entityType: "Character",
  entityId: "hero-1",
  // Ability, not Rank — Rank goals now hide the farm-location picker entirely (see the dedicated
  // "Rank goal" test below), so the generic farming-override behavior is exercised through a goal
  // type that still uses it.
  goalType: "Ability",
  status: "Active",
  notes: "Old note",
  config: { farmingLocationIds: [], farmingStrategy: "TotalUpgrades" },
  dependsOn: ["dependency-1"],
  events: [{ at: "2026-01-01T00:00:00Z", type: "Created" }],
  projectIds: ["project-1"],
  snapshot: {
    initialRequirement: [
      { count: 2, resourceId: "upgrade-1" },
      { count: 3, resourceId: "upgrade-2" },
    ],
  },
  updatedAt: "2026-01-01T00:00:00Z",
}

const dependency = {
  ...detail,
  dependsOn: [],
  entityId: "hero-2",
  goalId: "dependency-1",
  snapshot: null,
}

const rankDetail = {
  ...detail,
  goalType: "Rank",
  dependsOn: [],
  config: {
    farmingLocationIds: [],
    farmingStrategy: "TotalUpgrades",
    // end: 15 (Diamond1) — wide enough to span 2+ milestone checkpoints, so Milestones stays
    // selectable (farmingStrategyAvailability disables it below that).
    rank: {
      start: 0,
      startPointFive: false,
      startAppliedUpgrades: 0,
      end: 15,
      endPointFive: false,
      endAppliedUpgrades: 0,
    },
  },
}

const unlockDetail = {
  ...detail,
  goalType: "Unlock",
  dependsOn: [],
  config: { farmingLocationIds: [], farmingStrategy: "TotalUpgrades" },
  // Unlock goals never populate initialRequirement (buildCreateGoalSnapshot's ownsResourcePreview is
  // only true for Character Rank / Mow Ability) — the shard-location list instead comes from
  // charactersById, mocked above.
  snapshot: { ...detail.snapshot, initialRequirement: [] },
}

const levelDetail = {
  ...detail,
  goalType: "Level",
  dependsOn: [],
  config: {
    farmingLocationIds: [],
    farmingStrategy: "TotalUpgrades",
    level: { start: 31, end: 42 },
  },
  // Level goals are uncosted — buildCreateGoalSnapshot never populates initialRequirement for them.
  snapshot: { ...detail.snapshot, initialRequirement: [] },
}

function renderSheet(
  props: Partial<Parameters<typeof GoalDetailSheet>[0]> = {},
  queryClient?: QueryClient
) {
  const sheet = (
    <CreateGoalLauncherProvider onLaunch={vi.fn()}>
      <GoalDetailSheet
        estimate={{ date: "2026-01-08", days: 3, status: "Estimated" } as never}
        goalId="goal-1"
        isolated
        onOpenChange={vi.fn()}
        onUpdated={vi.fn()}
        {...props}
      />
    </CreateGoalLauncherProvider>
  )
  return render(
    queryClient ? (
      <QueryClientProvider client={queryClient}>{sheet}</QueryClientProvider>
    ) : (
      sheet
    )
  )
}

async function enterEditMode(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByTestId("goal-detail-edit"))
  await screen.findByTestId("goal-detail-edit-form")
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

  it("defaults to view mode with read-only details, then saves edits", async () => {
    const user = userEvent.setup()
    const onUpdated = vi.fn()
    renderSheet({ onUpdated })

    expect(await screen.findByText("Entity hero-1")).toBeInTheDocument()
    expect(await screen.findByText(/Entity hero-2/)).toBeInTheDocument()
    expect(screen.getByText(/Created/)).toBeInTheDocument()
    expect(
      screen.getByText("goals.detail.isolatedEstimate")
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === "P" &&
          Boolean(
            element.textContent?.includes(
              'goals.create.previewEstimate:{"days":3}'
            )
          )
      )
    ).toBeInTheDocument()
    // View mode has no editable fields yet.
    expect(
      screen.queryByLabelText("goals.detail.notes")
    ).not.toBeInTheDocument()
    expect(screen.queryByText("goals.detail.save")).not.toBeInTheDocument()

    await enterEditMode(user)

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
        farmingStrategy: "TotalUpgrades",
      })
    })
    expect(onUpdated).toHaveBeenCalledOnce()
    // Project membership wasn't touched, so the goal-side membership call is skipped entirely.
    expect(updateGoalProjects).not.toHaveBeenCalled()
    // Saving returns to view mode.
    expect(await screen.findByTestId("goal-detail-view")).toBeInTheDocument()
  })

  it("preserves the editing draft when the same goal refetches with a new updatedAt", async () => {
    const user = userEvent.setup()
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    let currentDetail = detail
    getGoal.mockImplementation((goalId: string) =>
      Promise.resolve(goalId === "dependency-1" ? dependency : currentDetail)
    )
    renderSheet({}, queryClient)
    await enterEditMode(user)

    fireEvent.change(screen.getByLabelText("goals.detail.notes"), {
      target: { value: "Unsaved draft" },
    })
    currentDetail = {
      ...detail,
      notes: "Server-side note",
      updatedAt: "2026-02-01T00:00:00Z",
    }
    await queryClient.invalidateQueries({
      queryKey: ["goals", "detail", "goal-1"],
    })

    await vi.waitFor(() => expect(getGoal).toHaveBeenCalledTimes(3))
    expect(screen.getByLabelText("goals.detail.notes")).toHaveValue(
      "Unsaved draft"
    )
  })

  it("asks for confirmation before discarding unsaved edits on Cancel", async () => {
    const user = userEvent.setup()
    renderSheet()
    await enterEditMode(user)

    const notes = screen.getByLabelText("goals.detail.notes")
    fireEvent.change(notes, { target: { value: "Changed" } })

    await user.click(screen.getByTestId("goal-detail-cancel"))
    expect(await screen.findByTestId("confirmation-dialog")).toBeInTheDocument()

    await user.click(screen.getByTestId("confirmation-dialog-confirm"))
    expect(await screen.findByTestId("goal-detail-view")).toBeInTheDocument()
  })

  it("returns to view mode directly on Cancel when nothing changed", async () => {
    const user = userEvent.setup()
    renderSheet()
    await enterEditMode(user)

    await user.click(screen.getByTestId("goal-detail-cancel"))
    expect(screen.queryByTestId("confirmation-dialog")).not.toBeInTheDocument()
    expect(await screen.findByTestId("goal-detail-view")).toBeInTheDocument()
  })

  it("asks for confirmation before closing the sheet with unsaved edits, then closes on discard", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    renderSheet({ onOpenChange })
    await enterEditMode(user)

    const notes = screen.getByLabelText("goals.detail.notes")
    fireEvent.change(notes, { target: { value: "Changed" } })

    await user.keyboard("{Escape}")
    expect(await screen.findByTestId("confirmation-dialog")).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalled()

    await user.click(screen.getByTestId("confirmation-dialog-confirm"))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("renders blocked estimates and API load errors", async () => {
    const { unmount } = renderSheet({
      estimate: {
        reason: "NoFarmLocation",
        resourceIds: [],
        status: "Blocked",
      },
    })
    expect(await screen.findByText("Entity hero-1")).toBeInTheDocument()
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === "P" &&
          Boolean(
            element.textContent?.includes(
              "goals.estimate.blocked.NoFarmLocation"
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
    await enterEditMode(user)

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
    await enterEditMode(user)

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
    await enterEditMode(user)

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

  it("lets a Rank goal's farming strategy be changed, with no farm-location picker", async () => {
    getGoal.mockReset().mockResolvedValue(rankDetail)
    const user = userEvent.setup()
    renderSheet()
    expect(await screen.findByText("Entity hero-1")).toBeInTheDocument()
    await enterEditMode(user)

    expect(screen.getByTestId("create-goal-farming-strategy")).toBeVisible()
    expect(
      screen.queryByText("goals.detail.farmingTitle")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText("goals.detail.shardsTitle")
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId("create-goal-farming-strategy"))
    fireEvent.click(
      within(await screen.findByRole("listbox")).getByText(
        "goals.create.farmingStrategy.Milestones"
      )
    )
    fireEvent.click(screen.getByText("goals.detail.save"))

    await vi.waitFor(() => {
      expect(updateGoal).toHaveBeenCalledWith("goal-1", {
        farmingLocationIds: null,
        notes: "Old note",
        farmingStrategy: "Milestones",
      })
    })
  })

  it("shows shard locations (not upgrade farm locations) for an Unlock goal", async () => {
    getGoal.mockReset().mockResolvedValue(unlockDetail)
    const user = userEvent.setup()
    renderSheet()
    expect(await screen.findByText("Entity hero-1")).toBeInTheDocument()
    await enterEditMode(user)

    expect(screen.getByText("goals.detail.shardsTitle")).toBeInTheDocument()
    expect(
      screen.queryByText("goals.detail.farmingTitle")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("create-goal-farming-strategy")
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole("checkbox", { name: "shard-battle-1" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("checkbox", { name: "shard-battle-2" })
    ).toBeInTheDocument()
  })

  it("shows the current/target level for a Level goal, with no farming strategy or location picker", async () => {
    getGoal.mockReset().mockResolvedValue(levelDetail)
    const user = userEvent.setup()
    renderSheet()
    expect(await screen.findByText("Entity hero-1")).toBeInTheDocument()
    await enterEditMode(user)

    const levelSummary = screen.getByTestId("goal-detail-level")
    expect(levelSummary).toHaveTextContent("goals.create.level.current: 31")
    expect(levelSummary).toHaveTextContent("goals.create.level.target: 42")
    expect(
      screen.queryByTestId("create-goal-farming-strategy")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("goal-detail-locations")
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByText("goals.detail.save"))
    await vi.waitFor(() => {
      expect(updateGoal).toHaveBeenCalledWith("goal-1", {
        farmingLocationIds: null,
        notes: "Old note",
        farmingStrategy: "TotalUpgrades",
      })
    })
  })
})
