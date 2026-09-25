import type { ReactNode } from "react"
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { Rank, rankIndex } from "@workspace/game-domain"
import { beforeEach, describe, expect, it, vi } from "vitest"

const updateGoalTarget = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options && "defaultValue" in options
        ? String(options.defaultValue)
        : options
          ? `${key}:${JSON.stringify(options)}`
          : key,
  }),
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

vi.mock("@/entities/goal", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/goal")>()),
  goalQueries: {
    all: () => ["goals"],
    lists: () => ["goals", "list"],
    detail: (goalId: string) => ({ queryKey: ["goals", "detail", goalId] }),
  },
  updateGoalTarget: (...args: unknown[]) => updateGoalTarget(...args),
}))

vi.mock("@/entities/project", () => ({
  projectQueries: { all: () => ["projects"] },
}))

import { ApiError } from "@/shared/api"
import type { GoalConfig, GoalDetail } from "@/entities/goal"

import { GoalTargetSection } from "./goal-target-section"

const emptyConfig: GoalConfig = {
  rank: null,
  progression: null,
  ability: null,
  farmingStrategy: "TotalUpgrades",
  acquisitionSources: null,
  farmingLocationIds: null,
  upgrade: null,
  level: null,
}

function goal(
  goalType: GoalDetail["goalType"],
  config: Partial<GoalConfig>,
  overrides: Partial<GoalDetail> = {}
): GoalDetail {
  return {
    goalId: "goal-1",
    entityType: "Character",
    entityId: "hero-1",
    goalType,
    status: "Active",
    notes: "Keep me",
    dependsOn: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    config: { ...emptyConfig, ...config },
    snapshot: null,
    events: [],
    projectIds: ["project-1"],
    revision: 3,
    ...overrides,
  }
}

const rankGoal = (overrides: Partial<GoalDetail> = {}) =>
  goal(
    "Rank",
    {
      rank: {
        start: rankIndex(Rank.Silver1),
        startPointFive: false,
        startAppliedUpgrades: 0,
        end: rankIndex(Rank.Gold1),
        endPointFive: false,
        endAppliedUpgrades: 0,
      },
    },
    overrides
  )

const abilityGoal = () =>
  goal("Ability", {
    ability: { activeStart: 3, activeEnd: 6, passiveStart: 2, passiveEnd: 4 },
  })

const upgradeGoal = () =>
  goal("Upgrade", {
    upgrade: { targets: [{ upgradeId: "upgHpC014", quantity: 3 }] },
  })

let queryClient: QueryClient

function renderSection(
  detail: GoalDetail,
  handlers: Partial<{
    onSaved: () => void
    onViewGoal: (goalId: string) => void
    onDirtyChange: (dirty: boolean) => void
  }> = {}
) {
  const onSaved = handlers.onSaved ?? vi.fn()
  const onViewGoal = handlers.onViewGoal ?? vi.fn()
  const onDirtyChange = handlers.onDirtyChange ?? vi.fn()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>{children}</TooltipProvider>
    </QueryClientProvider>
  )
  render(
    <GoalTargetSection
      detail={detail}
      onDirtyChange={onDirtyChange}
      onSaved={onSaved}
      onViewGoal={onViewGoal}
      portalContainer={null}
      upgradesById={new Map()}
    />,
    { wrapper }
  )
  return { onSaved, onViewGoal, onDirtyChange }
}

async function chooseRank(rank: string) {
  fireEvent.click(screen.getByTestId("goal-target-rank-end"))
  fireEvent.click(within(await screen.findByRole("listbox")).getByText(rank))
}

describe("GoalTargetSection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue()
  })

  it.each([
    ["Rank", rankGoal()],
    ["Ability", abilityGoal()],
    ["Upgrade", upgradeGoal()],
    ["Level", goal("Level", { level: { start: 1, end: 10 } })],
    [
      "Ascension",
      goal("Ascension", {
        progression: { start: "Common:None", end: "Common:TwoStars" },
      }),
    ],
  ])("offers Edit target on an active %s goal", (_kind, detail) => {
    renderSection(detail)

    expect(screen.getByTestId("goal-detail-edit-target")).toBeInTheDocument()
  })

  it("offers it on a paused goal too", () => {
    renderSection(rankGoal({ status: "Paused" }))

    expect(screen.getByTestId("goal-detail-edit-target")).toBeInTheDocument()
  })

  it.each([
    ["an Unlock goal", goal("Unlock", {})],
    ["a completed goal", rankGoal({ status: "Completed" })],
    ["an archived goal", rankGoal({ status: "Archived" })],
  ])("offers no Edit target on %s", (_label, detail) => {
    renderSection(detail)

    expect(
      screen.queryByTestId("goal-detail-edit-target")
    ).not.toBeInTheDocument()
    expect(screen.queryByTestId("goal-target-section")).not.toBeInTheDocument()
  })

  it("opens prefilled with the stored end rank, not one inferred from progress", () => {
    renderSection(rankGoal())

    fireEvent.click(screen.getByTestId("goal-detail-edit-target"))

    expect(screen.getByTestId("goal-target-rank-end")).toHaveTextContent(
      "Gold1"
    )
    expect(screen.getByTestId("goal-target-save")).toBeDisabled()
  })

  it("saves only the target with the loaded revision and refreshes planning", async () => {
    updateGoalTarget.mockResolvedValue(rankGoal({ revision: 4 }))
    const { onSaved } = renderSection(rankGoal())

    fireEvent.click(screen.getByTestId("goal-detail-edit-target"))
    await chooseRank("Gold2")
    fireEvent.click(screen.getByTestId("goal-target-save"))

    await waitFor(() => expect(onSaved).toHaveBeenCalled())
    expect(updateGoalTarget).toHaveBeenCalledWith("goal-1", {
      expectedRevision: 3,
      target: {
        rank: {
          end: rankIndex(Rank.Gold2),
          endPointFive: false,
          endAppliedUpgrades: 0,
        },
      },
    })
    expect(queryClient.getQueryData(["goals", "detail", "goal-1"])).toEqual(
      rankGoal({ revision: 4 })
    )
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
      { queryKey: ["goals"] },
      { throwOnError: true }
    )
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
      { queryKey: ["projects"] },
      { throwOnError: true }
    )
    expect(screen.queryByTestId("goal-target-editor")).not.toBeInTheDocument()
    expect(screen.getByText("goals.target.saved")).toBeInTheDocument()
  })

  it("edits each Ability track on its own", async () => {
    updateGoalTarget.mockResolvedValue({ ...abilityGoal(), revision: 4 })
    renderSection(abilityGoal())

    fireEvent.click(screen.getByTestId("goal-detail-edit-target"))
    fireEvent.click(screen.getByTestId("goal-target-ability-activeEnd"))
    fireEvent.click(within(await screen.findByRole("listbox")).getByText("9"))
    fireEvent.click(screen.getByTestId("goal-target-save"))

    await waitFor(() => expect(updateGoalTarget).toHaveBeenCalled())
    expect(updateGoalTarget).toHaveBeenCalledWith("goal-1", {
      expectedRevision: 3,
      target: { ability: { activeEnd: 9, passiveEnd: 4 } },
    })
  })

  it("blocks save with a specific reason for a zero Upgrade quantity", () => {
    renderSection(upgradeGoal())

    fireEvent.click(screen.getByTestId("goal-detail-edit-target"))
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "0" } })

    expect(screen.getByTestId("goal-target-issue")).toHaveTextContent(
      "goals.target.issues.upgradeQuantity"
    )
    expect(screen.getByTestId("goal-target-save")).toBeDisabled()
  })

  it("keeps the draft and offers a refresh path on a stale revision", async () => {
    const current = rankGoal({ revision: 8 })
    updateGoalTarget.mockRejectedValue(
      new ApiError(409, "stale", {
        issueCode: "goalRevisionStale",
        message: "stale",
        goal: current,
      })
    )
    const { onSaved } = renderSection(rankGoal())

    fireEvent.click(screen.getByTestId("goal-detail-edit-target"))
    await chooseRank("Gold2")
    fireEvent.click(screen.getByTestId("goal-target-save"))

    expect(await screen.findByText("goals.target.stale")).toBeInTheDocument()
    expect(onSaved).not.toHaveBeenCalled()
    expect(screen.getByTestId("goal-target-rank-end")).toHaveTextContent(
      "Gold2"
    )

    fireEvent.click(screen.getByTestId("goal-target-load-current"))

    expect(queryClient.getQueryData(["goals", "detail", "goal-1"])).toEqual(
      current
    )
    expect(screen.queryByText("goals.target.stale")).not.toBeInTheDocument()
    expect(screen.getByTestId("goal-target-rank-end")).toHaveTextContent(
      "Gold2"
    )
  })

  it("names the conflicting milestone and keeps the draft on a Rank collision", async () => {
    updateGoalTarget.mockRejectedValue(
      new ApiError(409, "occupied", {
        issueCode: "projectGoalSlotOccupied",
        message: "occupied",
        projectId: "project-2",
        projectName: "Second plan",
        entityType: "Character",
        entityId: "hero-1",
        goalType: "Rank",
        existingGoalId: "goal-2",
      })
    )
    const { onViewGoal } = renderSection(rankGoal())

    fireEvent.click(screen.getByTestId("goal-detail-edit-target"))
    await chooseRank("Gold2")
    fireEvent.click(screen.getByTestId("goal-target-save"))

    expect(
      await screen.findByText(
        'goals.target.collision:{"project":"Second plan"}'
      )
    ).toBeInTheDocument()
    expect(screen.getByTestId("goal-target-rank-end")).toHaveTextContent(
      "Gold2"
    )

    fireEvent.click(
      screen.getByRole("button", {
        name: "goals.project.reviewConflictingGoal",
      })
    )
    expect(onViewGoal).toHaveBeenCalledWith("goal-2")
  })

  it("lists every project that already holds a colliding Rank target", async () => {
    updateGoalTarget.mockRejectedValue(
      new ApiError(409, "occupied", {
        issueCode: "projectGoalSlotOccupied",
        message: "occupied",
        projectId: "project-2",
        projectName: "Second plan",
        entityType: "Character",
        entityId: "hero-1",
        goalType: "Rank",
        existingGoalId: "goal-2",
        conflicts: [
          {
            projectId: "project-2",
            projectName: "Second plan",
            existingGoalId: "goal-2",
          },
          {
            projectId: "project-3",
            projectName: "Third plan",
            existingGoalId: "goal-3",
          },
        ],
      })
    )
    renderSection(rankGoal())

    fireEvent.click(screen.getByTestId("goal-detail-edit-target"))
    await chooseRank("Gold2")
    fireEvent.click(screen.getByTestId("goal-target-save"))

    expect(
      await screen.findByText(
        'goals.target.collision:{"project":"Second plan, Third plan"}'
      )
    ).toBeInTheDocument()
  })

  it("locks the fields while a save is in flight so no edit is silently dropped", async () => {
    let resolveSave: (value: GoalDetail) => void = () => {}
    updateGoalTarget.mockReturnValue(
      new Promise<GoalDetail>((resolve) => {
        resolveSave = resolve
      })
    )
    renderSection(rankGoal())

    fireEvent.click(screen.getByTestId("goal-detail-edit-target"))
    await chooseRank("Gold2")
    fireEvent.click(screen.getByTestId("goal-target-save"))

    await waitFor(() =>
      expect(screen.getByTestId("goal-target-rank-end")).toBeDisabled()
    )
    expect(screen.getByTestId("goal-target-save")).toBeDisabled()

    resolveSave(rankGoal({ revision: 4 }))
    await waitFor(() =>
      expect(screen.queryByTestId("goal-target-editor")).not.toBeInTheDocument()
    )
  })

  it("keeps Edit target on screen (disabled) while editing so a tour step can anchor to it", () => {
    renderSection(rankGoal())

    fireEvent.click(screen.getByTestId("goal-detail-edit-target"))

    expect(screen.getByTestId("goal-detail-edit-target")).toBeDisabled()
  })

  it("refreshes planning data after loading the current version of a stale goal", async () => {
    updateGoalTarget.mockRejectedValue(
      new ApiError(409, "stale", {
        issueCode: "goalRevisionStale",
        message: "stale",
        goal: rankGoal({ revision: 8 }),
      })
    )
    renderSection(rankGoal())
    fireEvent.click(screen.getByTestId("goal-detail-edit-target"))
    await chooseRank("Gold2")
    fireEvent.click(screen.getByTestId("goal-target-save"))
    await screen.findByText("goals.target.stale")
    vi.mocked(queryClient.invalidateQueries).mockClear()

    fireEvent.click(screen.getByTestId("goal-target-load-current"))

    await waitFor(() =>
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
        { queryKey: ["goals"] },
        { throwOnError: true }
      )
    )
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith(
      { queryKey: ["projects"] },
      { throwOnError: true }
    )
  })

  it("shows a stored partial-slot target the creation form would not offer, instead of a blank select", () => {
    renderSection(
      rankGoal({
        config: {
          ...emptyConfig,
          rank: {
            start: rankIndex(Rank.Silver1),
            startPointFive: false,
            startAppliedUpgrades: 0,
            end: rankIndex(Rank.Gold1),
            endPointFive: false,
            endAppliedUpgrades: 1,
          },
        },
      })
    )

    fireEvent.click(screen.getByTestId("goal-detail-edit-target"))

    expect(screen.getByTestId("goal-target-rank-additional")).toHaveTextContent(
      "(1/6)"
    )
  })

  it("associates each label with its select", () => {
    renderSection(rankGoal())

    fireEvent.click(screen.getByTestId("goal-detail-edit-target"))

    expect(screen.getByLabelText("goals.target.rankEnd")).toBe(
      screen.getByTestId("goal-target-rank-end")
    )
  })

  it("lets an Upgrade quantity be cleared and retyped, and rejects one above the ceiling", () => {
    renderSection(upgradeGoal())
    fireEvent.click(screen.getByTestId("goal-detail-edit-target"))
    const input = screen.getByRole("spinbutton")

    fireEvent.change(input, { target: { value: "" } })
    expect(input).toHaveValue(null)
    expect(screen.getByTestId("goal-target-save")).toBeDisabled()

    fireEvent.change(input, { target: { value: "20000" } })
    expect(screen.getByTestId("goal-target-issue")).toHaveTextContent(
      "goals.target.issues.upgradeQuantity"
    )

    fireEvent.change(input, { target: { value: "7" } })
    expect(input).toHaveValue(7)
    expect(screen.queryByTestId("goal-target-issue")).not.toBeInTheDocument()
    expect(screen.getByTestId("goal-target-save")).toBeEnabled()
  })

  it("reports a failed planning refresh instead of presenting old numbers as current", async () => {
    updateGoalTarget.mockResolvedValue(rankGoal({ revision: 4 }))
    vi.mocked(queryClient.invalidateQueries).mockRejectedValueOnce(
      new Error("offline")
    )
    renderSection(rankGoal())

    fireEvent.click(screen.getByTestId("goal-detail-edit-target"))
    await chooseRank("Gold2")
    fireEvent.click(screen.getByTestId("goal-target-save"))

    expect(
      await screen.findByText("goals.target.planningStale")
    ).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole("button", { name: "goals.target.retryRefresh" })
    )

    await waitFor(() =>
      expect(
        screen.queryByText("goals.target.planningStale")
      ).not.toBeInTheDocument()
    )
  })

  it("reports the draft as unsaved only while it differs from the stored target", async () => {
    const { onDirtyChange } = renderSection(rankGoal())

    fireEvent.click(screen.getByTestId("goal-detail-edit-target"))
    expect(onDirtyChange).toHaveBeenLastCalledWith(false)

    await chooseRank("Gold2")
    expect(onDirtyChange).toHaveBeenLastCalledWith(true)

    fireEvent.click(screen.getByTestId("goal-target-cancel"))
    expect(onDirtyChange).toHaveBeenLastCalledWith(false)
  })
})
