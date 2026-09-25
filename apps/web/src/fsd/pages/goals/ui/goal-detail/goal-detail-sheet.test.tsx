import { useEffect, useState } from "react"
import { fireEvent, render, screen, within } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

const getGoal = vi.fn()
const updateGoal = vi.fn()
const updateGoalProjects = vi.fn()
const updateGoalTarget = vi.fn()
const updateGoalStatus = vi.fn()
const listProjects = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
    // The Estimate section renders `EstimateCell`, which formats the completion date with
    // `Intl.DateTimeFormat(i18n.resolvedLanguage, ...)` — same shape goal-detail-view.test.tsx uses.
    i18n: { resolvedLanguage: "en" },
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
    all: () => ["goals"],
  },
  goalRevisionConflictDetails: () => null,
  updateGoalTarget: (...args: unknown[]) => updateGoalTarget(...args),
  updateGoal: (...args: unknown[]) => updateGoal(...args),
  updateGoalProjects: (...args: unknown[]) => updateGoalProjects(...args),
  updateGoalStatus: (...args: unknown[]) => updateGoalStatus(...args),
}))

vi.mock("@/entities/project", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/project")>()),
  projectQueries: {
    goals: (projectId: string) => ({
      queryFn: () => Promise.resolve({ goals: [] }),
      queryKey: ["projects", projectId, "goals"],
    }),
    list: () => ({
      queryFn: () => listProjects(),
      queryKey: ["projects", "list"],
    }),
    all: () => ["projects"],
  },
}))

vi.mock("@/entities/planning-setting", () => ({
  usePlanningSettings: () => ({
    settings: { dailyEnergy: 288, revision: 1 },
    save: () => {},
  }),
}))

vi.mock("@workspace/game-catalog/queries", () => ({
  // No shop currently offers any unit's shards — keeps the acquisition-source picker's Shops
  // group hidden and avoids the real Dexie/IndexedDB-backed getShops() in this jsdom test.
  getShops: () => Promise.resolve([]),
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
    battlesById: new Map(),
    ascensionCostsById: new Map(),
    unlockShardCostsById: new Map(),
    getCharacter: () => undefined,
  }),
}))

// The tour provider isn't mounted in these tests; the step registration has its own test.
vi.mock("./goal-detail-sheet.tutorial", () => ({
  GoalDetailSheetTourRegistration: () => null,
}))

vi.mock("@/shared/api", () => ({
  ApiError: class ApiError extends Error {
    readonly status: number
    readonly details: unknown

    constructor(status: number, message: string, details?: unknown) {
      super(message)
      this.status = status
      this.details = details
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

const ascensionDetail = {
  ...detail,
  goalType: "Ascension",
  dependsOn: [],
  config: {
    farmingLocationIds: [],
    farmingStrategy: "TotalUpgrades",
    progression: { start: "Common:None", end: "Common:OneStar" },
    acquisitionSources: [
      { kind: "Campaign", ids: ["shard-battle-1"] },
      { kind: "Onslaught", ids: [] },
    ],
  },
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
    <MemoryRouter>
      <CreateGoalLauncherProvider onLaunch={vi.fn()}>
        <GoalDetailSheet
          estimate={
            { date: "2026-01-08", days: 3, status: "Estimated" } as never
          }
          goalId="goal-1"
          isolated
          onOpenChange={vi.fn()}
          onUpdated={vi.fn()}
          {...props}
        />
      </CreateGoalLauncherProvider>
    </MemoryRouter>
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
    updateGoalStatus.mockReset()
    listProjects.mockReset().mockResolvedValue({
      projects: [
        { projectId: "project-1", name: "My Goals", isActivePlan: true },
        { projectId: "project-2", name: "Event Prep", isActivePlan: false },
        { projectId: "project-home", name: "Home", isDefault: true },
      ],
    })
  })

  it("saves a target without submitting or discarding an unsaved notes draft", async () => {
    const user = userEvent.setup()
    const rankWithRevision = { ...rankDetail, revision: 5 }
    getGoal.mockReset().mockResolvedValue(rankWithRevision)
    updateGoalTarget
      .mockReset()
      .mockResolvedValue({ ...rankWithRevision, revision: 6 })
    renderSheet()
    await enterEditMode(user)
    fireEvent.change(screen.getByLabelText("goals.detail.notes"), {
      target: { value: "Unsaved thought" },
    })

    await user.click(screen.getByTestId("goal-detail-edit-target"))
    fireEvent.click(screen.getByTestId("goal-target-rank-end"))
    fireEvent.click(
      within(await screen.findByRole("listbox")).getAllByRole("option")[0]!
    )
    await user.click(screen.getByTestId("goal-target-save"))

    await vi.waitFor(() => expect(updateGoalTarget).toHaveBeenCalledTimes(1))
    const [goalId, request] = updateGoalTarget.mock.calls[0] as [
      string,
      { expectedRevision: number; target: Record<string, unknown> },
    ]
    expect(goalId).toBe("goal-1")
    expect(request.expectedRevision).toBe(5)
    expect(Object.keys(request.target)).toEqual(["rank"])
    expect(updateGoal).not.toHaveBeenCalled()
    expect(screen.getByLabelText("goals.detail.notes")).toHaveValue(
      "Unsaved thought"
    )
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
    // The Estimate section now renders the Goals list's own date-and-days cell rather than a
    // days-only line (goal-detail-estimate-display: "shows a completion date and day count").
    const estimate = screen.getByTestId("goal-row-estimate")
    expect(estimate).toHaveTextContent("Jan 8")
    expect(estimate).toHaveTextContent('goals.estimate.days:{"days":3}')
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

  it("links a stale server slot conflict to its existing goal", async () => {
    const user = userEvent.setup()
    const onGoalChange = vi.fn()
    updateGoal.mockRejectedValueOnce(
      new ApiError(409, "Event Prep already has this goal", {
        issueCode: "projectGoalSlotOccupied",
        message: "Event Prep already has this goal",
        projectId: "project-2",
        projectName: "Event Prep",
        entityType: "Character",
        entityId: "hero-1",
        goalType: "Ability",
        existingGoalId: "goal-conflict",
      })
    )
    renderSheet({ onGoalChange })
    await enterEditMode(user)

    await user.click(screen.getByTestId("goal-detail-save"))
    await user.click(
      await screen.findByRole("button", {
        name: "goals.project.reviewConflictingGoal",
      })
    )

    expect(onGoalChange).toHaveBeenCalledWith("goal-conflict")
  })

  it("adds the goal to another project on save", async () => {
    const user = userEvent.setup()
    renderSheet()
    expect(await screen.findByText("Entity hero-1")).toBeInTheDocument()
    await enterEditMode(user)

    await user.click(screen.getByTestId("goal-detail-add-project"))
    await user.click(await screen.findByText("Event Prep"))
    await vi.waitFor(() => {
      expect(screen.getByText("goals.detail.save")).not.toBeDisabled()
    })
    await user.click(screen.getByText("goals.detail.save"))

    await vi.waitFor(() => {
      expect(updateGoalProjects).toHaveBeenCalledWith("goal-1", [
        "project-1",
        "project-2",
      ])
    })
  })

  it("issues no status mutation when memberships are edited", async () => {
    // goal-project-membership: "Editing membership leaves status alone" — a project organizes goals,
    // it does not activate or deactivate them.
    const user = userEvent.setup()
    renderSheet()
    expect(await screen.findByText("Entity hero-1")).toBeInTheDocument()
    await enterEditMode(user)

    await user.click(screen.getByTestId("goal-detail-add-project"))
    await user.click(await screen.findByText("Event Prep"))
    await vi.waitFor(() => {
      expect(screen.getByText("goals.detail.save")).not.toBeDisabled()
    })
    await user.click(screen.getByText("goals.detail.save"))

    await vi.waitFor(() => {
      expect(updateGoalProjects).toHaveBeenCalledTimes(1)
    })
    expect(updateGoalStatus).not.toHaveBeenCalled()
  })

  it("states that membership does not pause or resume the goal, wherever memberships are edited", async () => {
    const user = userEvent.setup()
    renderSheet()
    expect(await screen.findByText("Entity hero-1")).toBeInTheDocument()
    await enterEditMode(user)

    const note = await screen.findByTestId(
      "goal-detail-projects-activation-note"
    )
    expect(note).toBeVisible()
    expect(note).toHaveTextContent("goals.detail.projectsActivationNote")
  })

  it("relocates the last project membership to the Default project on save", async () => {
    const user = userEvent.setup()
    renderSheet()
    await enterEditMode(user)

    await user.click(
      screen.getByRole("button", {
        name: /^goals\.project\.removeMembership/,
      })
    )

    expect(
      await screen.findByTestId("goal-detail-project-chip-project-home")
    ).toBeInTheDocument()
    await user.click(screen.getByText("goals.detail.save"))

    await vi.waitFor(() => {
      expect(updateGoalProjects).toHaveBeenCalledWith("goal-1", [
        "project-home",
      ])
    })
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

  it.each(["EveryStep", "Milestones"] as const)(
    "reopens a Rank goal saved with %s on that strategy, not the default",
    async (farmingStrategy) => {
      getGoal.mockReset().mockResolvedValue({
        ...rankDetail,
        config: { ...rankDetail.config, farmingStrategy },
      })
      const user = userEvent.setup()
      renderSheet()
      expect(await screen.findByText("Entity hero-1")).toBeInTheDocument()
      await enterEditMode(user)

      expect(
        screen.getByTestId("create-goal-farming-strategy")
      ).toHaveTextContent(`goals.create.farmingStrategy.${farmingStrategy}`)
    }
  )

  it("keeps a saved Rank strategy through save, view, and reopening the editor", async () => {
    let stored = rankDetail
    getGoal.mockReset().mockImplementation(() => Promise.resolve(stored))
    updateGoal.mockReset().mockImplementation((_goalId, request) => {
      stored = {
        ...stored,
        config: { ...stored.config, farmingStrategy: request.farmingStrategy },
      }
      return Promise.resolve(stored)
    })
    const user = userEvent.setup()
    renderSheet()
    expect(await screen.findByText("Entity hero-1")).toBeInTheDocument()
    await enterEditMode(user)

    fireEvent.click(screen.getByTestId("create-goal-farming-strategy"))
    fireEvent.click(
      within(await screen.findByRole("listbox")).getByText(
        "goals.create.farmingStrategy.EveryStep"
      )
    )
    fireEvent.click(screen.getByText("goals.detail.save"))
    await vi.waitFor(() =>
      expect(screen.queryByTestId("goal-detail-edit-form")).toBeNull()
    )

    await enterEditMode(user)
    expect(
      screen.getByTestId("create-goal-farming-strategy")
    ).toHaveTextContent("goals.create.farmingStrategy.EveryStep")
  })

  it("falls back to Total upgrades when the saved strategy no longer fits the goal's range", async () => {
    getGoal.mockReset().mockResolvedValue({
      ...rankDetail,
      config: {
        ...rankDetail.config,
        farmingStrategy: "EveryStep",
        rank: { ...rankDetail.config.rank, end: 1 },
      },
    })
    const user = userEvent.setup()
    renderSheet()
    expect(await screen.findByText("Entity hero-1")).toBeInTheDocument()
    await enterEditMode(user)

    expect(
      screen.getByTestId("create-goal-farming-strategy")
    ).toHaveTextContent("goals.create.farmingStrategy.TotalUpgrades")
  })

  it("shows the acquisition-source picker's Campaigns group (not the upgrade-node checklist) for an Unlock goal", async () => {
    getGoal.mockReset().mockResolvedValue(unlockDetail)
    const user = userEvent.setup()
    renderSheet()
    expect(await screen.findByText("Entity hero-1")).toBeInTheDocument()
    await enterEditMode(user)

    expect(
      screen.getByTestId("create-goal-acquisition-sources")
    ).toBeInTheDocument()
    expect(
      screen.queryByTestId("goal-detail-locations")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("create-goal-farming-strategy")
    ).not.toBeInTheDocument()
    expect(
      screen.getByTestId("create-goal-shard-location-checkbox-shard-battle-1")
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("create-goal-shard-location-checkbox-shard-battle-2")
    ).toBeInTheDocument()
  })

  it("returns to view mode directly on Cancel for an Unlock goal with no persisted acquisitionSources (tacticus-planner-apps#103)", async () => {
    getGoal.mockReset().mockResolvedValue(unlockDetail)
    const user = userEvent.setup()
    renderSheet()
    expect(await screen.findByText("Entity hero-1")).toBeInTheDocument()
    await enterEditMode(user)

    await user.click(screen.getByTestId("goal-detail-cancel"))
    expect(screen.queryByTestId("confirmation-dialog")).not.toBeInTheDocument()
    expect(await screen.findByTestId("goal-detail-view")).toBeInTheDocument()
  })

  it("restores an Ascension goal's saved Campaign + Onslaught selection on entering edit", async () => {
    getGoal.mockReset().mockResolvedValue(ascensionDetail)
    const user = userEvent.setup()
    renderSheet()
    expect(await screen.findByText("Entity hero-1")).toBeInTheDocument()
    await enterEditMode(user)

    expect(
      screen.getByTestId("create-goal-shard-location-checkbox-shard-battle-1")
    ).toBeChecked()
    expect(
      screen.getByTestId("create-goal-acquisition-group-onslaught-toggle")
    ).toBeChecked()
  })

  it("saves an edited acquisition-source selection as acquisitionSources, not farmingLocationIds", async () => {
    getGoal.mockReset().mockResolvedValue(ascensionDetail)
    const user = userEvent.setup()
    renderSheet()
    expect(await screen.findByText("Entity hero-1")).toBeInTheDocument()
    await enterEditMode(user)

    await user.click(
      screen.getByTestId("create-goal-acquisition-group-onslaught-toggle")
    )
    fireEvent.click(screen.getByText("goals.detail.save"))

    await vi.waitFor(() => {
      expect(updateGoal).toHaveBeenCalledWith(
        "goal-1",
        expect.objectContaining({
          acquisitionSources: [{ kind: "Campaign", ids: ["shard-battle-1"] }],
        })
      )
    })
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
