import { useEffect, useState } from "react"
import { act, fireEvent, render, screen, within } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

const getGoal = vi.fn()
const editGoal = vi.fn()
const listProjects = vi.fn()
const plan = vi.hoisted(() => ({
  inFlight: [] as { goalId: string; status: string }[],
  orderRevision: 4,
  loading: false,
}))
const mobile = vi.hoisted(() => ({ value: false }))

vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => mobile.value,
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options && "defaultValue" in options
        ? String(options.defaultValue)
        : options
          ? `${key}:${JSON.stringify(options)}`
          : key,
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
  getInventoryAbilityMaterials: () => Promise.resolve(undefined),
  getInventoryShard: () => Promise.resolve(undefined),
}))

vi.mock("@/entities/goal", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/goal")>()
  return {
    ...actual,
    goalQueries: {
      ...actual.goalQueries,
      detail: (goalId: string) => ({
        queryFn: () => getGoal(goalId),
        queryKey: ["goals", "detail", goalId],
      }),
    },
    editGoal: (...args: unknown[]) => editGoal(...args),
    useGlobalGoalPlan: () => plan,
  }
})

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
  normalizeXpBookRarity: (rarity: string | null | undefined) =>
    rarity ?? "Legendary",
  usePlanningSettings: () => ({
    settings: { dailyEnergy: 288, xpBookRarity: "Legendary", revision: 1 },
    save: () => {},
  }),
}))

vi.mock("@workspace/game-catalog/queries", () => ({
  getShops: () => Promise.resolve([]),
}))

vi.mock("../../model/shared/use-goal-catalog", () => ({
  useGoalCatalog: () => ({
    getEntityName: (_type: string, id: string) => `Entity ${id}`,
    upgradesById: new Map([
      ["upgHpC014", { farmLocations: [{ battleId: "battle-1" }] }],
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
vi.mock("./goal-edit-dialog.tutorial", () => ({
  GoalEditDialogTourRegistration: () => null,
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
import type { GoalDetail } from "@/entities/goal"

import { GoalEditDialog } from "./goal-edit-dialog"

const config = {
  rank: null,
  progression: null,
  ability: null,
  farmingStrategy: "TotalUpgrades",
  acquisitionSources: null,
  farmingLocationIds: null,
  upgrade: null,
}

const base = {
  goalId: "goal-1",
  entityType: "Character",
  entityId: "hero-1",
  status: "Active",
  notes: "Old note",
  dependsOn: [],
  events: [{ at: "2026-01-01T00:00:00Z", type: "Created" }],
  projectIds: ["project-1"],
  snapshot: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  globalPriority: 1,
  revision: 5,
}

const rankGoal = {
  ...base,
  goalType: "Rank",
  config: {
    ...config,
    rank: {
      start: 0,
      startPointFive: false,
      startAppliedUpgrades: 0,
      end: 15,
      endPointFive: false,
      endAppliedUpgrades: 0,
    },
  },
} as unknown as GoalDetail

const ascensionGoal = {
  ...base,
  goalType: "Ascension",
  config: {
    ...config,
    progression: { start: "Common:None", end: "Common:TwoStars" },
    acquisitionSources: [
      { kind: "Campaign", ids: ["shard-battle-1"] },
      { kind: "Onslaught", ids: [] },
    ],
  },
} as unknown as GoalDetail

const abilityGoal = {
  ...base,
  goalType: "Ability",
  config: {
    ...config,
    ability: { activeStart: 3, activeEnd: 6, passiveStart: 2, passiveEnd: 4 },
  },
} as unknown as GoalDetail

const upgradeGoal = {
  ...base,
  goalType: "Upgrade",
  config: {
    ...config,
    upgrade: { targets: [{ upgradeId: "upgHpC014", quantity: 3 }] },
  },
} as unknown as GoalDetail

const unlockGoal = { ...base, goalType: "Unlock", config } as GoalDetail

const goalOnScreen = (goal: GoalDetail) => {
  getGoal.mockReset().mockResolvedValue(goal)
}
const stayOnScreen = (goalId: string) =>
  goalOnScreen({ ...rankGoal, goalId } as GoalDetail)

function renderDialog(
  props: Partial<Parameters<typeof GoalEditDialog>[0]> = {},
  queryClient?: QueryClient
) {
  const dialog = (
    <MemoryRouter>
      <GoalEditDialog goalId="goal-1" onOpenChange={vi.fn()} {...props} />
    </MemoryRouter>
  )
  return render(
    queryClient ? (
      <QueryClientProvider client={queryClient}>{dialog}</QueryClientProvider>
    ) : (
      dialog
    )
  )
}

async function loaded() {
  await screen.findByTestId("goal-edit-form")
}

async function chooseOption(triggerTestId: string, optionText: string) {
  fireEvent.click(screen.getByTestId(triggerTestId))
  fireEvent.click(
    within(await screen.findByRole("listbox")).getByText(optionText)
  )
}

const position = (n: number, total = 5) =>
  `goals.edit.priority.option:${JSON.stringify({ position: n, total })}`

describe("GoalEditDialog", () => {
  beforeEach(() => {
    mobile.value = false
    plan.inFlight = ["a", "b", "c", "d", "e"].map((goalId) => ({
      goalId,
      status: "Active",
    }))
    plan.orderRevision = 4
    plan.loading = false
    goalOnScreen(rankGoal)
    editGoal
      .mockReset()
      .mockImplementation((goalId: string) =>
        Promise.resolve({ goal: { ...rankGoal, goalId, revision: 6 } })
      )
    listProjects.mockReset().mockResolvedValue({
      projects: [
        { projectId: "project-1", name: "My Goals" },
        { projectId: "project-2", name: "Event Prep" },
        { projectId: "project-home", name: "Home", isDefault: true },
      ],
    })
    plan.inFlight[0] = { goalId: "goal-1", status: "Active" }
  })

  describe("contents", () => {
    it("shows the unit and kind read-only and only the Rank goal's editable fields", async () => {
      renderDialog()
      await loaded()

      expect(screen.getByTestId("goal-edit-unit")).toHaveTextContent(
        "Entity hero-1"
      )
      expect(screen.getByTestId("goal-edit-kind")).toHaveTextContent(
        "goals.create.goalTypes.Rank"
      )
      expect(screen.getByTestId("goal-edit-target")).toBeInTheDocument()
      expect(screen.getByTestId("goal-edit-priority")).toBeInTheDocument()
      expect(screen.getByLabelText("goals.detail.notes")).toBeInTheDocument()
      expect(screen.getByTestId("goal-edit-projects")).toBeInTheDocument()
      expect(
        screen.getByTestId("create-goal-farming-strategy")
      ).toBeInTheDocument()
      for (const removed of [
        "goals.detail.historyTitle",
        "goals.detail.dependenciesTitle",
        "goals.detail.blockersTitle",
        "goals.detail.estimateTitle",
        "goals.detail.progressTitle",
        "goals.detail.farmingGuidanceTitle",
      ]) {
        expect(screen.queryByText(removed)).not.toBeInTheDocument()
      }
    })

    it("offers no control that changes the goal's kind", async () => {
      renderDialog()
      await loaded()

      expect(screen.queryByTestId("create-goal-goal-type")).toBeNull()
      expect(screen.getAllByRole("combobox").map((el) => el.id)).not.toContain(
        "goal-kind"
      )
    })

    it("shows priority, notes, projects and sources but no target for an Unlock goal", async () => {
      goalOnScreen(unlockGoal)
      renderDialog()
      await loaded()

      expect(screen.queryByTestId("goal-edit-target")).toBeNull()
      expect(screen.getByTestId("goal-edit-priority")).toBeInTheDocument()
      expect(screen.getByLabelText("goals.detail.notes")).toBeInTheDocument()
      expect(screen.getByTestId("goal-edit-projects")).toBeInTheDocument()
      expect(
        screen.getByTestId("create-goal-acquisition-sources")
      ).toBeInTheDocument()
    })

    it.each([
      ["Completed", { ...rankGoal, status: "Completed" }],
      ["Archived", { ...rankGoal, status: "Archived" }],
    ])("hides the target for a %s goal", async (_status, goal) => {
      goalOnScreen(goal as GoalDetail)
      renderDialog()
      await loaded()

      expect(screen.queryByTestId("goal-edit-target")).toBeNull()
    })

    it("lays its fields out in two columns by dialog width", async () => {
      renderDialog()

      expect(await screen.findByTestId("goal-edit-form")).toHaveClass(
        "@2xl:grid-cols-2"
      )
    })

    it("puts Cancel before the primary Save, which is the last footer button", async () => {
      renderDialog()
      await loaded()

      const footer = screen
        .getByTestId("goal-edit-dialog")
        .querySelector('[data-slot="responsive-dialog-footer"]') as HTMLElement
      const buttons = Array.from(footer.querySelectorAll("button"))
      expect(buttons.map((b) => b.dataset.testid)).toEqual([
        "goal-edit-cancel",
        "goal-edit-save",
      ])
    })

    it("has no helper paragraphs, keeping the hints as tooltips", async () => {
      renderDialog()
      await loaded()

      for (const removed of [
        "goals.detail.projectsDescription",
        "goals.detail.projectsActivationNote",
      ]) {
        expect(screen.queryByText(removed)).not.toBeInTheDocument()
      }
      // Moved into an accessible tooltip instead of a visible line.
      expect(screen.queryByText("goals.edit.priority.hint")).toBeNull()
      expect(screen.getByTitle("goals.edit.priority.hint")).toHaveAttribute(
        "aria-label",
        "goals.edit.priority.hint"
      )
      expect(screen.queryByText("goals.target.reachedNote")).toBeNull()
      expect(screen.getByTitle("goals.target.reachedNote")).toBeInTheDocument()
    })

    it("renders the same form in the bottom sheet below 768px", async () => {
      mobile.value = true
      renderDialog()
      await loaded()

      expect(screen.getByTestId("goal-edit-dialog")).toHaveAttribute(
        "data-side",
        "bottom"
      )
      expect(screen.getAllByTestId("goal-edit-save")).toHaveLength(1)
      expect(screen.getByTestId("goal-edit-target")).toBeInTheDocument()
    })
  })

  describe("target editors", () => {
    it("Rank: prefills the stored end rank", async () => {
      renderDialog()
      await loaded()

      expect(screen.getByTestId("goal-target-rank-end")).toHaveTextContent(
        "Diamond1"
      )
      expect(screen.getByTestId("goal-edit-save")).toBeDisabled()
    })

    it("Ascension: shows the progression editor inline with no own Save", async () => {
      goalOnScreen(ascensionGoal)
      renderDialog()
      await loaded()

      expect(screen.getByTestId("goal-edit-target")).toBeInTheDocument()
      expect(screen.queryByTestId("goal-target-save")).toBeNull()
      expect(screen.queryByTestId("goal-detail-edit-target")).toBeNull()
    })

    it("Ability: edits one track and sends only the target with the loaded revision", async () => {
      goalOnScreen(abilityGoal)
      renderDialog()
      await loaded()

      await chooseOption("goal-target-ability-activeEnd", "9")
      fireEvent.click(screen.getByTestId("goal-edit-save"))

      await vi.waitFor(() => expect(editGoal).toHaveBeenCalled())
      expect(editGoal).toHaveBeenCalledWith("goal-1", {
        target: {
          expectedRevision: 5,
          target: { ability: { activeEnd: 9, passiveEnd: 4 } },
        },
      })
    })

    describe("Ability goal with an untargeted track (stored end below start)", () => {
      const untargeted = {
        ...abilityGoal,
        config: {
          ...abilityGoal.config,
          ability: {
            activeStart: 47,
            activeEnd: 48,
            passiveStart: 26,
            passiveEnd: 0,
          },
        },
      } as GoalDetail

      it("opens without an error, and notes alone save without sending the target", async () => {
        goalOnScreen(untargeted)
        renderDialog()
        await loaded()

        expect(screen.queryByTestId("goal-target-issue")).toBeNull()
        expect(
          screen.getByTestId("goal-target-ability-passiveEnd")
        ).toHaveTextContent("26")
        fireEvent.change(screen.getByLabelText("goals.detail.notes"), {
          target: { value: "New note" },
        })
        expect(screen.getByTestId("goal-edit-save")).toBeEnabled()
        fireEvent.click(screen.getByTestId("goal-edit-save"))

        await vi.waitFor(() => expect(editGoal).toHaveBeenCalled())
        expect(editGoal.mock.calls[0]![1]).not.toHaveProperty("target")
      })

      it("editing the targeted track sends the untargeted one at its start", async () => {
        goalOnScreen(untargeted)
        renderDialog()
        await loaded()

        await chooseOption("goal-target-ability-activeEnd", "50")
        fireEvent.click(screen.getByTestId("goal-edit-save"))

        await vi.waitFor(() => expect(editGoal).toHaveBeenCalled())
        expect(editGoal).toHaveBeenCalledWith("goal-1", {
          target: {
            expectedRevision: 5,
            target: { ability: { activeEnd: 50, passiveEnd: 26 } },
          },
        })
      })
    })

    describe("Upgrade range", () => {
      const mowUpgradeGoal = {
        ...upgradeGoal,
        entityType: "Mow",
        config: {
          ...config,
          upgrade: {
            targets: [{ upgradeId: "upgHpC014", quantity: 3 }],
            activeRange: { start: 2, end: 5 },
          },
        },
      } as unknown as GoalDetail

      it("prefills the stored range and shows an unset track as not set", async () => {
        goalOnScreen(mowUpgradeGoal)
        renderDialog()
        await loaded()

        expect(
          screen.getByTestId("goal-target-upgrade-range-primary-start")
        ).toHaveTextContent("2")
        expect(
          screen.getByTestId("goal-target-upgrade-range-primary-end")
        ).toHaveTextContent("5")
        expect(
          screen.getByTestId("goal-target-upgrade-range-secondary-start")
        ).toHaveTextContent("goals.create.upgrade.range.unset")
      })

      it("clearing the range saves the target without one", async () => {
        goalOnScreen(mowUpgradeGoal)
        renderDialog()
        await loaded()

        await chooseOption(
          "goal-target-upgrade-range-primary-start",
          "goals.create.upgrade.range.unset"
        )
        fireEvent.click(screen.getByTestId("goal-edit-save"))

        await vi.waitFor(() => expect(editGoal).toHaveBeenCalled())
        expect(editGoal).toHaveBeenCalledWith("goal-1", {
          target: {
            expectedRevision: 5,
            target: {
              upgrade: { targets: [{ upgradeId: "upgHpC014", quantity: 3 }] },
            },
          },
        })
      })

      it("sends a changed range together with the targets", async () => {
        goalOnScreen(mowUpgradeGoal)
        renderDialog()
        await loaded()

        await chooseOption("goal-target-upgrade-range-primary-end", "9")
        fireEvent.click(screen.getByTestId("goal-edit-save"))

        await vi.waitFor(() => expect(editGoal).toHaveBeenCalled())
        expect(editGoal).toHaveBeenCalledWith("goal-1", {
          target: {
            expectedRevision: 5,
            target: {
              upgrade: {
                targets: [{ upgradeId: "upgHpC014", quantity: 3 }],
                activeRange: { start: 2, end: 9 },
              },
            },
          },
        })
      })
    })

    it("Upgrade: blocks Save with a reason for a zero quantity", async () => {
      goalOnScreen(upgradeGoal)
      renderDialog()
      await loaded()

      fireEvent.change(screen.getByRole("spinbutton"), {
        target: { value: "0" },
      })

      expect(screen.getByTestId("goal-target-issue")).toHaveTextContent(
        "goals.target.issues.upgradeQuantity"
      )
      expect(screen.getByTestId("goal-edit-save")).toBeDisabled()
    })
  })

  describe("priority position", () => {
    beforeEach(() => {
      plan.inFlight = ["a", "b", "c", "d", "e"].map((goalId) => ({
        goalId,
        status: "Active",
      }))
    })

    it("moves E up to position 3", async () => {
      stayOnScreen("e")
      renderDialog({ goalId: "e" })
      await loaded()

      expect(screen.getByTestId("goal-edit-priority-select")).toHaveTextContent(
        position(5)
      )
      await chooseOption("goal-edit-priority-select", position(3))
      fireEvent.click(screen.getByTestId("goal-edit-save"))

      await vi.waitFor(() => expect(editGoal).toHaveBeenCalled())
      expect(editGoal).toHaveBeenCalledWith("e", {
        priority: { position: 3, expectedOrderRevision: 4 },
      })
    })

    it("moves C down to position 5", async () => {
      stayOnScreen("c")
      renderDialog({ goalId: "c" })
      await loaded()

      await chooseOption("goal-edit-priority-select", position(5))
      fireEvent.click(screen.getByTestId("goal-edit-save"))

      await vi.waitFor(() => expect(editGoal).toHaveBeenCalled())
      expect(editGoal).toHaveBeenCalledWith("c", {
        priority: { position: 5, expectedOrderRevision: 4 },
      })
    })

    it("submits no reorder when the position is unchanged", async () => {
      stayOnScreen("c")
      renderDialog({ goalId: "c" })
      await loaded()

      fireEvent.change(screen.getByLabelText("goals.detail.notes"), {
        target: { value: "Changed" },
      })
      fireEvent.click(screen.getByTestId("goal-edit-save"))

      await vi.waitFor(() => expect(editGoal).toHaveBeenCalled())
      expect(editGoal.mock.calls[0]![1]).not.toHaveProperty("priority")
    })

    it("shows the select for a Paused goal and hides it for a goal with no position", async () => {
      goalOnScreen({ ...rankGoal, goalId: "c", status: "Paused" } as GoalDetail)
      const first = renderDialog({ goalId: "c" })
      await loaded()
      expect(screen.getByTestId("goal-edit-priority")).toBeInTheDocument()
      first.unmount()

      goalOnScreen({ ...rankGoal, status: "Completed" } as GoalDetail)
      renderDialog({ goalId: "goal-1" })
      await loaded()
      expect(screen.queryByTestId("goal-edit-priority")).toBeNull()
    })

    it("keeps the draft on a stale order and offers to reload it", async () => {
      stayOnScreen("e")
      editGoal.mockRejectedValueOnce(
        new ApiError(409, "order", {
          issueCode: "goalOrderStale",
          message: "order",
          revision: 9,
          goalIds: ["a", "e"],
        })
      )
      renderDialog({ goalId: "e" })
      await loaded()

      await chooseOption("goal-edit-priority-select", position(3))
      fireEvent.click(screen.getByTestId("goal-edit-save"))

      expect(await screen.findByTestId("goal-edit-error")).toHaveTextContent(
        "goals.edit.errors.order"
      )
      expect(screen.getByTestId("goal-edit-priority-select")).toHaveTextContent(
        position(3)
      )
      fireEvent.click(screen.getByTestId("goal-edit-reload-order"))
      await vi.waitFor(() =>
        expect(screen.queryByTestId("goal-edit-error")).toBeNull()
      )
    })
  })

  describe("save", () => {
    it("submits the target, notes and priority in one request and closes", async () => {
      const onOpenChange = vi.fn()
      stayOnScreen("e")
      plan.inFlight = ["a", "b", "c", "d", "e"].map((goalId) => ({
        goalId,
        status: "Active",
      }))
      editGoal.mockResolvedValue({
        goal: { ...rankGoal, goalId: "e", revision: 6 },
        order: { revision: 5, goalIds: ["a", "b", "e", "c", "d"] },
      })
      const queryClient = new QueryClient()
      const invalidate = vi.spyOn(queryClient, "invalidateQueries")
      renderDialog({ goalId: "e", onOpenChange }, queryClient)
      await loaded()

      await chooseOption("goal-target-rank-end", "Gold2")
      fireEvent.change(screen.getByLabelText("goals.detail.notes"), {
        target: { value: " Updated " },
      })
      await chooseOption("goal-edit-priority-select", position(3))
      fireEvent.click(screen.getByTestId("goal-edit-save"))

      await vi.waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
      expect(editGoal).toHaveBeenCalledTimes(1)
      const request = editGoal.mock.calls[0]![1]
      expect(Object.keys(request).sort()).toEqual([
        "details",
        "priority",
        "target",
      ])
      expect(request.target.expectedRevision).toBe(5)
      expect(request.details.notes).toBe("Updated")
      expect(request.priority).toEqual({
        position: 3,
        expectedOrderRevision: 4,
      })
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["goals"] })
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ["projects"] })
    })

    it("sends only the projects section when only projects changed", async () => {
      const user = userEvent.setup()
      renderDialog()
      await loaded()

      await user.click(screen.getByTestId("goal-edit-add-project"))
      await user.click(await screen.findByText("Event Prep"))
      fireEvent.click(screen.getByTestId("goal-edit-save"))

      await vi.waitFor(() => expect(editGoal).toHaveBeenCalled())
      expect(editGoal).toHaveBeenCalledWith("goal-1", {
        projectIds: ["project-1", "project-2"],
      })
    })

    it("sends an edited acquisition-source selection as details.acquisitionSources", async () => {
      goalOnScreen(ascensionGoal)
      const user = userEvent.setup()
      renderDialog()
      await loaded()

      await user.click(
        screen.getByTestId("create-goal-acquisition-group-onslaught-toggle")
      )
      fireEvent.click(screen.getByTestId("goal-edit-save"))

      await vi.waitFor(() => expect(editGoal).toHaveBeenCalled())
      expect(editGoal.mock.calls[0]![1].details).toMatchObject({
        farmingLocationIds: null,
        acquisitionSources: [{ kind: "Campaign", ids: ["shard-battle-1"] }],
      })
    })

    it("keeps Save disabled when nothing changed", async () => {
      renderDialog()
      await loaded()

      expect(screen.getByTestId("goal-edit-save")).toBeDisabled()
    })

    it("keeps the whole draft and saves nothing when the projects conflict", async () => {
      const onOpenChange = vi.fn()
      editGoal.mockRejectedValue(
        new ApiError(409, "occupied", {
          issueCode: "projectGoalSlotOccupied",
          message: "occupied",
          projectId: "project-2",
          projectName: "Event Prep",
          entityType: "Character",
          entityId: "hero-1",
          goalType: "Rank",
          existingGoalId: "goal-9",
        })
      )
      const user = userEvent.setup()
      renderDialog({ onOpenChange })
      await loaded()

      await chooseOption("goal-target-rank-end", "Gold2")
      await user.click(screen.getByTestId("goal-edit-add-project"))
      await user.click(await screen.findByText("Event Prep"))
      fireEvent.click(screen.getByTestId("goal-edit-save"))

      expect(await screen.findByTestId("goal-edit-error")).toHaveTextContent(
        'goals.edit.errors.conflict:{"project":"Event Prep"}'
      )
      expect(onOpenChange).not.toHaveBeenCalled()
      expect(screen.getByTestId("goal-target-rank-end")).toHaveTextContent(
        "Gold2"
      )
      expect(
        screen.getByTestId("goal-edit-project-chip-project-2")
      ).toBeInTheDocument()
      expect(editGoal).toHaveBeenCalledTimes(1)
    })

    it("keeps the draft on a stale revision and retries against the refreshed goal", async () => {
      const current = { ...rankGoal, revision: 8, notes: "Old note" }
      editGoal.mockRejectedValueOnce(
        new ApiError(409, "stale", {
          issueCode: "goalRevisionStale",
          message: "stale",
          goal: current,
        })
      )
      const onOpenChange = vi.fn()
      renderDialog({ onOpenChange })
      await loaded()

      await chooseOption("goal-target-rank-end", "Gold2")
      fireEvent.click(screen.getByTestId("goal-edit-save"))

      expect(await screen.findByTestId("goal-edit-error")).toHaveTextContent(
        "goals.edit.errors.stale"
      )
      expect(onOpenChange).not.toHaveBeenCalled()
      expect(screen.getByTestId("goal-target-rank-end")).toHaveTextContent(
        "Gold2"
      )

      getGoal.mockResolvedValue(current)
      fireEvent.click(screen.getByTestId("goal-edit-refresh"))
      await vi.waitFor(() =>
        expect(screen.queryByTestId("goal-edit-error")).toBeNull()
      )
      expect(screen.getByTestId("goal-target-rank-end")).toHaveTextContent(
        "Gold2"
      )
      // Let the refetch of the refreshed goal settle before retrying.
      await act(() => new Promise((resolve) => setTimeout(resolve, 20)))
      fireEvent.click(screen.getByTestId("goal-edit-save"))

      await vi.waitFor(() => expect(editGoal).toHaveBeenCalledTimes(2))
      expect(editGoal.mock.calls[1]![1].target.expectedRevision).toBe(8)
    })

    it("names an invalid section from a 400 and keeps the dialog open", async () => {
      editGoal.mockRejectedValue(
        new ApiError(400, "Priority is out of range", {
          errors: { "Priority.Position": ["Priority is out of range"] },
        })
      )
      const onOpenChange = vi.fn()
      renderDialog({ onOpenChange })
      await loaded()

      fireEvent.change(screen.getByLabelText("goals.detail.notes"), {
        target: { value: "x" },
      })
      fireEvent.click(screen.getByTestId("goal-edit-save"))

      expect(await screen.findByTestId("goal-edit-error")).toHaveTextContent(
        "goals.edit.errors.invalid"
      )
      expect(onOpenChange).not.toHaveBeenCalled()
    })
  })

  describe("closing", () => {
    it("asks before discarding edits on Escape, and closes once confirmed", async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderDialog({ onOpenChange })
      await loaded()

      fireEvent.change(screen.getByLabelText("goals.detail.notes"), {
        target: { value: "Changed" },
      })
      await user.keyboard("{Escape}")

      expect(
        await screen.findByTestId("confirmation-dialog")
      ).toBeInTheDocument()
      expect(onOpenChange).not.toHaveBeenCalled()

      await user.click(screen.getByTestId("confirmation-dialog-confirm"))
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it("asks before discarding edits on Cancel and keeps them on Keep editing", async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderDialog({ onOpenChange })
      await loaded()

      fireEvent.change(screen.getByLabelText("goals.detail.notes"), {
        target: { value: "Changed" },
      })
      await user.click(screen.getByTestId("goal-edit-cancel"))
      await user.click(
        await screen.findByRole("button", { name: "goals.edit.unsaved.keep" })
      )

      expect(onOpenChange).not.toHaveBeenCalled()
      expect(screen.getByLabelText("goals.detail.notes")).toHaveValue("Changed")
    })

    it("closes immediately on Cancel or Escape when nothing changed", async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderDialog({ onOpenChange })
      await loaded()

      await user.click(screen.getByTestId("goal-edit-cancel"))
      await user.keyboard("{Escape}")

      expect(screen.queryByTestId("confirmation-dialog")).toBeNull()
      expect(onOpenChange).toHaveBeenCalledTimes(2)
    })

    it("stays open when the overlay outside the dialog is clicked", async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      renderDialog({ onOpenChange })
      await loaded()

      const overlay = document.querySelector('[data-slot="dialog-overlay"]')
      await user.click(overlay as HTMLElement)

      expect(onOpenChange).not.toHaveBeenCalled()
      expect(screen.getByTestId("goal-edit-dialog")).toBeInTheDocument()
    })
  })

  describe("loading and failure", () => {
    it("shows a skeleton and no Save while the goal loads", async () => {
      getGoal.mockReset().mockReturnValue(new Promise(() => undefined))
      renderDialog()

      expect(
        await screen.findByTestId("goal-edit-skeleton")
      ).toBeInTheDocument()
      expect(screen.queryByTestId("goal-edit-save")).toBeNull()
    })

    it("shows an error with a way to close and no Save when the goal cannot load", async () => {
      const onOpenChange = vi.fn()
      getGoal.mockReset().mockRejectedValue(new ApiError(404, "gone"))
      renderDialog({ onOpenChange })

      expect(
        await screen.findByTestId("goal-edit-load-error")
      ).toHaveTextContent("goals.edit.loadError")
      expect(screen.queryByTestId("goal-edit-save")).toBeNull()
      fireEvent.click(screen.getByTestId("goal-edit-cancel"))
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })
})
