import { act, fireEvent, render, screen, within } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useLocation, useNavigate, useSearchParams } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { setTestAuth } from "@/test/auth"
import { seedGameCatalog, seedPlayerData } from "@/test/seed"

const getGoal = vi.fn()
const editGoal = vi.fn()
const listProjects = vi.fn()
const plan = vi.hoisted(() => ({
  inFlight: [] as { goalId: string; status: string }[],
  orderRevision: 4,
  loading: false,
}))
const mobile = vi.hoisted(() => ({ value: false }))
// The account's goals the taken-target check reads.
const accountGoals = vi.hoisted(() => new Map<string, unknown>())
const seedInFlight = (goal: { goalId: string }) =>
  accountGoals.set(goal.goalId, goal)

vi.mock("@workspace/ui/hooks/use-mobile", () => ({
  useIsMobile: () => mobile.value,
}))

// The saved Onslaught position the Edit dialog's yield note reads; `null` means none saved.
let onslaughtProgressFixture: unknown = null
vi.mock("@/entities/player-data-override", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/player-data-override")>()),
  onslaughtProgressQueries: {
    all: () => ["player-data-overrides", "onslaught"],
    current: () => ({
      queryFn: () => Promise.resolve(onslaughtProgressFixture),
      queryKey: ["player-data-overrides", "onslaught", "current"],
    }),
  },
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
    useGoalsById: () => ({ goalsById: accountGoals }),
  }
})

vi.mock("@/entities/project", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/project")>()),
  projectQueries: {
    details: () => ["projects", "detail"],
    goals: (projectId: string) => ({
      queryFn: () => Promise.resolve({ goals: [] }),
      queryKey: ["projects", "detail", projectId, "goals"],
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

vi.mock("@/shared/unit-name", () => ({
  useUnitName: () => (_type: string, id: string) => id,
}))
vi.mock("@/features/goal-planning/model/shared/use-goal-catalog", () => ({
  useGoalCatalog: () => ({
    getEntityName: (_type: string, id: string) => `Entity ${id}`,
    upgradesById: new Map([
      ["upgHpC014", { farmLocations: [{ battleId: "battle-1" }] }],
      [
        "upgHpM004",
        { id: "upgHpM004", rarity: "Mythic", recipe: [], farmLocations: [] },
      ],
    ]),
    charactersById: new Map([
      [
        "hero-1",
        {
          alliance: "Imperial",
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
    // Only "hero-ladder" has a rank ladder, so only its Rank goal has materials to estimate.
    getCharacter: (id: string) =>
      id === "hero-ladder"
        ? {
            id,
            rankUpUpgrades: [
              { rank: "Stone1", upgradeIds: ["upgHpC014"] },
              { rank: "Stone2", upgradeIds: ["upgHpC014"] },
              { rank: "Stone3", upgradeIds: ["upgHpC014"] },
            ],
          }
        : undefined,
  }),
}))

// The tour provider isn't mounted in these tests; the step registration has its own test.
vi.mock("./goal-edit-dialog.tutorial", () => ({
  GoalEditDialogTourRegistration: () => null,
}))

vi.mock("@/shared/api", () => {
  class ApiError extends Error {
    readonly status: number
    readonly issueCode?: string
    readonly current?: unknown
    readonly errors?: Record<string, string[]>

    constructor(
      status: number,
      message: string,
      problem: {
        issueCode?: string
        current?: unknown
        errors?: Record<string, string[]>
      } = {}
    ) {
      super(message)
      this.status = status
      this.issueCode = problem.issueCode
      this.current = problem.current
      this.errors = problem.errors
    }
  }
  return {
    ApiError,
    apiIssue: (error: unknown, ...codes: string[]) =>
      error instanceof ApiError && codes.includes(error.issueCode ?? "")
        ? error
        : null,
  }
})

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
const stayOnScreen = (goalId: string) => goalOnScreen({ ...rankGoal, goalId })

function renderDialog(
  props: Partial<Parameters<typeof GoalEditDialog>[0]> = {},
  queryClient?: QueryClient
) {
  const dialog = (
    <GoalEditDialog goalId="goal-1" onOpenChange={vi.fn()} {...props} />
  )
  return render(
    queryClient ? (
      <QueryClientProvider client={queryClient}>{dialog}</QueryClientProvider>
    ) : (
      dialog
    ),
    { route: "/plan/goals" }
  )
}

// The page's wiring in miniature: the dialog follows `?goal=`, and a probe stands in for the
// browser's Back button.
function DialogAtGoalParam() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  return (
    <>
      <button data-testid="history-back" onClick={() => void navigate(-1)}>
        Back
      </button>
      <span data-testid="location-search">{useLocation().search}</span>
      <GoalEditDialog
        goalId={params.get("goal")}
        onOpenChange={() =>
          setParams(
            (previous) => {
              previous.delete("goal")
              return previous
            },
            { replace: true }
          )
        }
      />
    </>
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

/** Selects the ladder step named `name`. */
function pickStep(testId: string, name: string) {
  fireEvent.click(
    within(screen.getByTestId(testId)).getByRole("radio", {
      name: new RegExp(`^${name}(,|$)`),
    })
  )
}

/** The ladder's selected step. */
const selectedStep = (testId: string) =>
  within(screen.getByTestId(testId)).getByRole("radio", { checked: true })

/** Types `level` into the ability stepper labelled `label`. */
function setLevel(label: string, level: number) {
  fireEvent.change(screen.getByRole("spinbutton", { name: label }), {
    target: { value: String(level) },
  })
}

const position = (n: number, total = 5) => `${n} of ${total}`

// The Onslaught reward the Edit dialog's yield note reads for a Gold 3 position.
const onslaughtRewards = [
  {
    id: "Gold-3",
    sector: "Gold",
    tier: 3,
    regular: Array(5).fill({ min: 2, max: 4 }),
    mythic: { min: 1, max: 1 },
  },
]

describe("GoalEditDialog", () => {
  beforeEach(async () => {
    accountGoals.clear()
    setTestAuth({ authenticated: true })
    await seedGameCatalog({ "onslaught-rewards": onslaughtRewards })
    await seedPlayerData({
      characters: [],
      mows: [],
      "inventory-upgrades": [],
      "inventory-items": [],
    })
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
    onslaughtProgressFixture = null
  })

  describe("contents", () => {
    it("shows the unit and kind read-only and only the Rank goal's editable fields", async () => {
      renderDialog()
      await loaded()

      expect(screen.getByTestId("goal-edit-unit")).toHaveTextContent(
        "Entity hero-1"
      )
      expect(screen.getByTestId("goal-edit-kind")).toHaveTextContent("Rank")
      expect(screen.getByTestId("goal-edit-target")).toBeInTheDocument()
      expect(screen.getByTestId("goal-edit-priority")).toBeInTheDocument()
      expect(screen.getByLabelText("Notes")).toBeInTheDocument()
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
      expect(screen.getByLabelText("Notes")).toBeInTheDocument()
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
      const priorityHint = "1 is the highest priority."
      const reachedNote =
        "An already-reached target is fine: it needs nothing more, and the goal keeps its status until you complete it."
      expect(screen.queryByText(priorityHint)).toBeNull()
      expect(screen.getByTitle(priorityHint)).toHaveAttribute(
        "aria-label",
        priorityHint
      )
      expect(screen.queryByText(reachedNote)).toBeNull()
      expect(screen.getByTitle(reachedNote)).toBeInTheDocument()
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

      expect(selectedStep("create-goal-rank-end")).toHaveAccessibleName(
        "Diamond I"
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

      setLevel("Active ability, target level", 9)
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

        expect(
          screen.queryByTestId("create-goal-issue-Ability-target")
        ).toBeNull()
        expect(
          screen.getByRole("spinbutton", {
            name: "Passive ability, target level",
          })
        ).toHaveValue(26)
        fireEvent.change(screen.getByLabelText("Notes"), {
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

        setLevel("Active ability, target level", 50)
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
        ).toHaveTextContent("Not set")
      })

      it("clearing the range saves the target without one", async () => {
        goalOnScreen(mowUpgradeGoal)
        renderDialog()
        await loaded()

        await chooseOption("goal-target-upgrade-range-primary-start", "Not set")
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

    it("Upgrade: blocks Save with a reason on the row for a zero quantity", async () => {
      goalOnScreen(upgradeGoal)
      renderDialog()
      await loaded()

      fireEvent.change(screen.getByRole("spinbutton"), {
        target: { value: "0" },
      })

      expect(
        screen.getByTestId("create-goal-upgrade-target-upgHpC014")
      ).toHaveTextContent("Enter a whole number from 1 to 10,000.")
      expect(
        screen.queryByTestId("create-goal-issue-Upgrade-materials")
      ).not.toBeInTheDocument()
      expect(screen.getByTestId("goal-edit-save")).toBeDisabled()
    })

    describe("polish-goal-dialogs", () => {
      const twoMaterials = {
        ...upgradeGoal,
        config: {
          ...config,
          upgrade: {
            targets: [
              { upgradeId: "upgHpC014", quantity: 3 },
              { upgradeId: "upgHpM004", quantity: 1 },
            ],
          },
        },
      } as unknown as GoalDetail

      it("Upgrade: shows the error only on the cleared row and marks it invalid", async () => {
        goalOnScreen(twoMaterials)
        renderDialog()
        await loaded()

        const [first, second] = screen.getAllByRole("spinbutton", {
          name: "Target quantity",
        })
        fireEvent.change(first!, { target: { value: "" } })

        expect(first).toHaveAttribute("aria-invalid", "true")
        expect(first).toHaveAccessibleDescription(
          "Enter a whole number from 1 to 10,000."
        )
        expect(second).not.toHaveAttribute("aria-invalid")
        expect(
          screen.getByTestId("create-goal-upgrade-target-upgHpM004")
        ).not.toHaveTextContent("Enter a whole number")
        expect(screen.getByTestId("goal-edit-save")).toBeDisabled()
      })

      it("Upgrade: removes a material and saves the rest; the last one can't be removed", async () => {
        goalOnScreen(twoMaterials)
        renderDialog()
        await loaded()

        fireEvent.click(
          within(
            screen.getByTestId("create-goal-upgrade-target-upgHpM004")
          ).getByRole("button", { name: "Remove" })
        )
        expect(
          within(
            screen.getByTestId("create-goal-upgrade-target-upgHpC014")
          ).getByRole("button", { name: "Remove" })
        ).toBeDisabled()
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

      it("Upgrade: adds a material with the creation picker and saves the whole list", async () => {
        goalOnScreen({
          ...upgradeGoal,
          entityId: "hero-ladder",
          config: {
            ...config,
            upgrade: {
              targets: [{ upgradeId: "upgHpM004", quantity: 1 }],
              rankRange: { start: 0, end: 2 },
            },
          },
        } as unknown as GoalDetail)
        renderDialog()
        await loaded()

        fireEvent.click(
          screen.getByRole("combobox", { name: "Add an upgrade" })
        )
        fireEvent.click(
          within(await screen.findByRole("listbox")).getByText("upgHpC014")
        )
        fireEvent.click(screen.getByTestId("goal-edit-save"))

        await vi.waitFor(() => expect(editGoal).toHaveBeenCalled())
        const [, request] = editGoal.mock.calls[0] ?? []
        expect(request.target.target.upgrade.targets).toEqual([
          { upgradeId: "upgHpM004", quantity: 1 },
          { upgradeId: "upgHpC014", quantity: 2 },
        ])
      })

      it("Upgrade: shows no empty Started from", async () => {
        goalOnScreen(upgradeGoal)
        renderDialog()
        await loaded()

        expect(
          screen.queryByTestId("goal-target-started-from")
        ).not.toBeInTheDocument()
        expect(screen.queryByText("Started from")).not.toBeInTheDocument()
      })

      it("Ability: names the start tracks, Primary/Secondary for a Machine of War", async () => {
        goalOnScreen({
          ...abilityGoal,
          entityType: "Mow",
          config: {
            ...config,
            ability: {
              activeStart: 48,
              activeEnd: 50,
              passiveStart: 26,
              passiveEnd: 30,
            },
          },
        } as unknown as GoalDetail)
        renderDialog()
        await loaded()

        expect(
          screen.getByTestId("goal-target-start-ability")
        ).toHaveTextContent("Primary 48 · Secondary 26")
      })

      it("says there are no locations to choose when none applies", async () => {
        goalOnScreen(abilityGoal)
        renderDialog()
        await loaded()

        expect(
          screen.getByTestId("goal-edit-locations-empty")
        ).toHaveTextContent("There are no locations to choose for this goal.")
      })

      describe("unify-goal-composer", () => {
        it("shows a stored Ascension target at or below its start as selected, with creation's message", async () => {
          goalOnScreen({
            ...ascensionGoal,
            config: {
              ...ascensionGoal.config,
              progression: {
                start: "Epic:RedTwoStars",
                end: "Epic:RedOneStar",
              },
            },
          } as unknown as GoalDetail)
          renderDialog()
          await loaded()

          expect(
            selectedStep("create-goal-ascension-end")
          ).toHaveAccessibleName("Epic Red One Star")
          // The same text creation shows for a target at or below the start.
          expect(
            screen.getByTestId("create-goal-issue-Ascension-target")
          ).toHaveTextContent(
            "The selected progression has already been reached."
          )
          expect(
            screen.getByTestId("create-goal-ascension-end")
          ).toHaveAttribute("aria-invalid", "true")
        })

        it("marks other in-flight Rank targets of the unit as taken, but not its own", async () => {
          goalOnScreen(rankGoal)
          seedInFlight({
            ...rankGoal,
            goalId: "goal-other",
            config: {
              ...rankGoal.config,
              rank: { ...rankGoal.config.rank!, end: 16 },
            },
          } as unknown as GoalDetail)
          renderDialog()
          await loaded()

          expect(
            within(screen.getByTestId("create-goal-rank-end")).getByRole(
              "radio",
              { name: "Diamond II, Already a goal" }
            )
          ).toHaveAttribute("aria-disabled", "true")
          expect(selectedStep("create-goal-rank-end")).toHaveAccessibleName(
            "Diamond I"
          )
        })

        it("shows no creation-only controls for a Rank goal", async () => {
          renderDialog()
          await loaded()

          expect(screen.queryByTestId("create-goal-rank-milestones")).toBeNull()
          expect(
            screen.queryByTestId("create-goal-include-ascension")
          ).toBeNull()
          expect(screen.queryByTestId("create-goal-include-unlock")).toBeNull()
          expect(screen.queryByText("Create paused")).toBeNull()
          expect(screen.queryByText("Create another goal")).toBeNull()
          expect(screen.getByTestId("create-goal-rank-end")).toBeInTheDocument()
        })

        it("shows the range message for a typed Ability level above 60 and blocks Save", async () => {
          goalOnScreen(abilityGoal)
          renderDialog()
          await loaded()

          setLevel("Active ability, target level", 61)
          expect(
            screen.getByTestId("create-goal-issue-Ability-target")
          ).toHaveTextContent("Choose a level from the current one up to 60.")
          expect(screen.getByTestId("goal-edit-save")).toBeDisabled()
        })
      })

      it("Ascension: offers only steps above the start, with no None option", async () => {
        goalOnScreen(ascensionGoal)
        renderDialog()
        await loaded()

        // Steps at or below the start can't be chosen; the first choosable one is the next step.
        const ladder = screen.getByTestId("create-goal-ascension-end")
        const choosable = within(ladder)
          .getAllByRole("radio")
          .filter((step) => !step.hasAttribute("aria-disabled"))
        expect(choosable[0]).toHaveAccessibleName(/Common One Star/)
        expect(
          within(ladder).getByRole("radio", { name: "Common, Current" })
        ).toHaveAttribute("aria-disabled", "true")
      })

      it("Ascension: says the cheapest node is used when Campaigns has no node checked", async () => {
        goalOnScreen({
          ...ascensionGoal,
          config: {
            ...ascensionGoal.config,
            acquisitionSources: [{ kind: "Campaign", ids: [] }],
          },
        } as unknown as GoalDetail)
        renderDialog()
        await loaded()

        expect(
          await screen.findByTestId("create-goal-acquisition-cheapest-node")
        ).toBeInTheDocument()
      })

      it("Rank: the farming-strategy preview follows the edited target", async () => {
        goalOnScreen({
          ...rankGoal,
          config: {
            ...rankGoal.config,
            farmingStrategy: "EveryStep",
            rank: { ...rankGoal.config.rank!, start: 9, end: 12 },
          },
        } as unknown as GoalDetail)
        renderDialog()
        await loaded()

        // Silver I → Gold I is three steps; Silver I → Diamond I is six.
        const preview = () =>
          screen.getByTestId("create-goal-farming-strategy-preview")
        expect(preview()).toHaveTextContent("(3 checkpoints)")
        expect(
          within(preview()).getAllByRole("img").at(-1)
        ).toHaveAccessibleName("Gold I")
        pickStep("create-goal-rank-end", "Diamond I")
        expect(preview()).toHaveTextContent("(6 checkpoints)")
        expect(
          within(preview()).getAllByRole("img").at(-1)
        ).toHaveAccessibleName("Diamond I")
      })

      it("Rank: the estimate follows the edited target; Unlock shows none", async () => {
        goalOnScreen({
          ...rankGoal,
          entityId: "hero-ladder",
          config: {
            ...rankGoal.config,
            rank: { ...rankGoal.config.rank!, start: 0, end: 1 },
          },
        } as unknown as GoalDetail)
        const { unmount } = renderDialog()
        await loaded()

        const estimate = screen.getByTestId("create-goal-preview")
        expect(estimate).toHaveTextContent("Resources needed")
        expect(estimate).toHaveTextContent("upgHpC014 × 1")
        pickStep("create-goal-rank-end", "Stone III")
        expect(screen.getByTestId("create-goal-preview")).toHaveTextContent(
          "upgHpC014 × 2"
        )
        unmount()

        goalOnScreen(unlockGoal)
        renderDialog()
        await loaded()
        expect(
          screen.queryByTestId("create-goal-preview")
        ).not.toBeInTheDocument()
      })

      it("carries the page tour button in its header", async () => {
        renderDialog({
          headerAction: <button type="button">Tour this page</button>,
        })
        await loaded()

        expect(
          within(screen.getByTestId("goal-edit-dialog")).getByRole("button", {
            name: "Tour this page",
          })
        ).toBeInTheDocument()
      })
    })
  })

  describe("Mythic materials (add-mythic-material-shop-sources)", () => {
    const venerableGoal = (
      acquisitionSources: GoalDetail["config"]["acquisitionSources"]
    ) =>
      ({
        ...upgradeGoal,
        config: {
          ...config,
          acquisitionSources,
          farmingLocationIds: ["battle-1"],
          upgrade: { targets: [{ upgradeId: "upgHpM004", quantity: 6 }] },
        },
      }) as unknown as GoalDetail
    const guildOffer = "create-goal-shop-offer-checkbox-guild:upgHpM004"

    beforeEach(async () => {
      await seedGameCatalog({
        shops: [
          {
            id: "guild",
            slots: [
              {
                variants: [
                  {
                    reward: { type: "upgHpM004", qty: 1 },
                    cost: { currency: "guildCredits", amount: 900 },
                    maxPurchasesPerDay: 2,
                    days: ["TUE"],
                  },
                ],
              },
            ],
          },
        ],
      })
    })

    it("shows every offer checked for a goal with no saved choice, and saves an explicit opt-out", async () => {
      goalOnScreen(venerableGoal(null))
      renderDialog()
      await loaded()

      fireEvent.click(await screen.findByTestId(guildOffer))
      fireEvent.click(screen.getByTestId("goal-edit-save"))

      await vi.waitFor(() => expect(editGoal).toHaveBeenCalled())
      expect(editGoal.mock.calls[0]![1].details).toMatchObject({
        acquisitionSources: [{ kind: "Shop", ids: [] }],
        // A Mythic-material choice sits beside the campaign override.
        farmingLocationIds: ["battle-1"],
      })
    })

    it("restores a saved selection", async () => {
      goalOnScreen(venerableGoal([{ kind: "Shop", ids: [] }]))
      renderDialog()
      await loaded()

      expect(await screen.findByTestId(guildOffer)).not.toBeChecked()
      expect(screen.getByTestId("goal-edit-save")).toBeDisabled()
    })

    it("hides the control once the edited target needs no Mythic material", async () => {
      goalOnScreen(venerableGoal(null))
      renderDialog()
      await loaded()
      await screen.findByTestId(guildOffer)

      fireEvent.change(
        within(
          screen.getByTestId("create-goal-upgrade-target-upgHpM004")
        ).getByRole("spinbutton"),
        { target: { value: "" } }
      )

      expect(
        screen.queryByTestId("goal-mythic-material-sources")
      ).not.toBeInTheDocument()
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

      fireEvent.change(screen.getByLabelText("Notes"), {
        target: { value: "Changed" },
      })
      fireEvent.click(screen.getByTestId("goal-edit-save"))

      await vi.waitFor(() => expect(editGoal).toHaveBeenCalled())
      expect(editGoal.mock.calls[0]![1]).not.toHaveProperty("priority")
    })

    it("shows the select for a Paused goal and hides it for a goal with no position", async () => {
      goalOnScreen({ ...rankGoal, goalId: "c", status: "Paused" })
      const first = renderDialog({ goalId: "c" })
      await loaded()
      expect(screen.getByTestId("goal-edit-priority")).toBeInTheDocument()
      first.unmount()

      goalOnScreen({ ...rankGoal, status: "Completed" })
      renderDialog({ goalId: "goal-1" })
      await loaded()
      expect(screen.queryByTestId("goal-edit-priority")).toBeNull()
    })

    it("keeps the draft on a stale order and offers to reload it", async () => {
      stayOnScreen("e")
      editGoal.mockRejectedValueOnce(
        new ApiError(409, "order", {
          issueCode: "goalOrderStale",
          current: { revision: 9, goalIds: ["a", "e"] },
        })
      )
      renderDialog({ goalId: "e" })
      await loaded()

      await chooseOption("goal-edit-priority-select", position(3))
      fireEvent.click(screen.getByTestId("goal-edit-save"))

      expect(await screen.findByTestId("goal-edit-error")).toHaveTextContent(
        "The order of your goals changed and nothing was saved. Reload the current order, check the position, then save again."
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

      pickStep("create-goal-rank-end", "Gold II")
      fireEvent.change(screen.getByLabelText("Notes"), {
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
      expect(invalidate).toHaveBeenCalledExactlyOnceWith({
        queryKey: ["goals", "list"],
        refetchType: "none",
      })
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

    it("shows the Onslaught yield from the saved Onslaught progress", async () => {
      onslaughtProgressFixture = {
        imperial: { sector: "Gold", tier: 3, isSet: true },
        xenos: { sector: "Stone", tier: 1, isSet: true },
        chaos: { sector: "Stone", tier: 1, isSet: true },
        revision: 1,
      }
      goalOnScreen(ascensionGoal)
      renderDialog()
      await loaded()

      const note = screen.getByTestId("create-goal-acquisition-yield-onslaught")
      await vi.waitFor(() =>
        expect(note).toHaveTextContent(/≈\d+(\.\d+)? shards\/day/)
      )
      expect(note).not.toHaveTextContent(
        "Set your Onslaught progress to see its yield."
      )
    })

    it("asks for Onslaught progress when none is saved", async () => {
      goalOnScreen(ascensionGoal)
      renderDialog()
      await loaded()

      expect(
        screen.getByTestId("create-goal-acquisition-yield-onslaught")
      ).toHaveTextContent("Set your Onslaught progress to see its yield.")
    })

    it("asks for Onslaught progress when the goal's alliance was never saved", async () => {
      // The API's unset placeholder (Stone 1, isSet false) must not read as a Stone 1 yield.
      const unset = { sector: "Stone", tier: 1, isSet: false }
      onslaughtProgressFixture = {
        imperial: unset,
        xenos: unset,
        chaos: unset,
        revision: 0,
      }
      goalOnScreen(ascensionGoal)
      renderDialog()
      await loaded()

      const note = screen.getByTestId("create-goal-acquisition-yield-onslaught")
      await vi.waitFor(() =>
        expect(note).toHaveTextContent(
          "Set your Onslaught progress to see its yield."
        )
      )
      expect(note).not.toHaveTextContent(/≈\d+(\.\d+)? shards\/day/)
    })

    it("keeps Save disabled when nothing changed", async () => {
      renderDialog()
      await loaded()

      expect(screen.getByTestId("goal-edit-save")).toBeDisabled()
    })

    it("keeps the whole draft and saves nothing when the goal's slot is taken", async () => {
      const onOpenChange = vi.fn()
      editGoal.mockRejectedValue(
        new ApiError(409, "occupied", {
          issueCode: "slotOccupied",
          current: { ...rankGoal, goalId: "goal-9" },
        })
      )
      const user = userEvent.setup()
      renderDialog({ onOpenChange })
      await loaded()

      pickStep("create-goal-rank-end", "Gold II")
      await user.click(screen.getByTestId("goal-edit-add-project"))
      await user.click(await screen.findByText("Event Prep"))
      fireEvent.click(screen.getByTestId("goal-edit-save"))

      expect(await screen.findByTestId("goal-edit-error")).toHaveTextContent(
        /already has an active or paused Rank goal/
      )
      expect(onOpenChange).not.toHaveBeenCalled()
      expect(selectedStep("create-goal-rank-end")).toHaveAccessibleName(
        "Gold II"
      )
      expect(
        screen.getByTestId("goal-edit-project-chip-project-2")
      ).toBeInTheDocument()
      expect(editGoal).toHaveBeenCalledTimes(1)
    })

    it("names a colliding Ascension sibling with its target and offers to open it", async () => {
      const onOpenGoal = vi.fn()
      goalOnScreen(ascensionGoal)
      editGoal.mockRejectedValue(
        new ApiError(409, "occupied", {
          issueCode: "slotOccupied",
          current: {
            ...ascensionGoal,
            goalId: "goal-9",
            config: {
              ...ascensionGoal.config,
              progression: {
                start: "Common:None",
                end: "Legendary:RedFiveStars",
              },
            },
          },
        })
      )
      renderDialog({ onOpenGoal })
      await loaded()

      fireEvent.change(screen.getByLabelText("Notes"), {
        target: { value: "Next milestone" },
      })
      fireEvent.click(screen.getByTestId("goal-edit-save"))

      expect(await screen.findByTestId("goal-edit-error")).toHaveTextContent(
        /already has an active or paused Ascension goal with the target Legendary/
      )
      fireEvent.click(screen.getByTestId("goal-edit-open-conflict"))
      expect(onOpenGoal).toHaveBeenCalledWith("goal-9")
    })

    it("keeps the draft on a stale revision and retries against the refreshed goal", async () => {
      const current = { ...rankGoal, revision: 8, notes: "Old note" }
      editGoal.mockRejectedValueOnce(
        new ApiError(409, "stale", {
          issueCode: "goalRevisionStale",
          current,
        })
      )
      const onOpenChange = vi.fn()
      renderDialog({ onOpenChange })
      await loaded()

      pickStep("create-goal-rank-end", "Gold II")
      fireEvent.click(screen.getByTestId("goal-edit-save"))

      expect(await screen.findByTestId("goal-edit-error")).toHaveTextContent(
        "This goal was changed elsewhere and nothing was saved. Refresh the goal (your edits are kept), then save again."
      )
      expect(onOpenChange).not.toHaveBeenCalled()
      expect(selectedStep("create-goal-rank-end")).toHaveAccessibleName(
        "Gold II"
      )

      getGoal.mockResolvedValue(current)
      fireEvent.click(screen.getByTestId("goal-edit-refresh"))
      await vi.waitFor(() =>
        expect(screen.queryByTestId("goal-edit-error")).toBeNull()
      )
      expect(selectedStep("create-goal-rank-end")).toHaveAccessibleName(
        "Gold II"
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

      fireEvent.change(screen.getByLabelText("Notes"), {
        target: { value: "x" },
      })
      fireEvent.click(screen.getByTestId("goal-edit-save"))

      expect(await screen.findByTestId("goal-edit-error")).toHaveTextContent(
        /^Not valid: .+\. Nothing was saved\. Priority is out of range$/
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

      fireEvent.change(screen.getByLabelText("Notes"), {
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

      fireEvent.change(screen.getByLabelText("Notes"), {
        target: { value: "Changed" },
      })
      await user.click(screen.getByTestId("goal-edit-cancel"))
      await user.click(
        await screen.findByRole("button", { name: "Keep editing" })
      )

      expect(onOpenChange).not.toHaveBeenCalled()
      expect(screen.getByLabelText("Notes")).toHaveValue("Changed")
    })

    it("asks before Back drops a dirty dialog: Keep editing keeps it and the param, Discard closes it", async () => {
      const user = userEvent.setup()
      render(<DialogAtGoalParam />, {
        route: "/plan/goals",
        initialEntries: [
          "/plan/goals?status=paused",
          "/plan/goals?status=paused&goal=goal-1",
        ],
      })
      await loaded()

      fireEvent.change(screen.getByLabelText("Notes"), {
        target: { value: "Changed" },
      })
      fireEvent.click(screen.getByTestId("history-back"))
      await user.click(
        await screen.findByRole("button", { name: "Keep editing" })
      )

      expect(screen.getByLabelText("Notes")).toHaveValue("Changed")
      expect(screen.getByTestId("location-search")).toHaveTextContent(
        "?status=paused&goal=goal-1"
      )

      fireEvent.click(screen.getByTestId("history-back"))
      await user.click(
        await screen.findByRole("button", { name: "Discard changes" })
      )

      await vi.waitFor(() =>
        expect(screen.queryByTestId("goal-edit-dialog")).toBeNull()
      )
      expect(screen.getByTestId("location-search")).toHaveTextContent(
        /^\?status=paused$/
      )
    })

    it("lets Back close a dialog without edits at once", async () => {
      render(<DialogAtGoalParam />, {
        route: "/plan/goals",
        initialEntries: [
          "/plan/goals?status=paused",
          "/plan/goals?status=paused&goal=goal-1",
        ],
      })
      await loaded()

      fireEvent.click(screen.getByTestId("history-back"))

      await vi.waitFor(() =>
        expect(screen.queryByTestId("goal-edit-dialog")).toBeNull()
      )
      expect(screen.queryByTestId("confirmation-dialog")).toBeNull()
      expect(screen.getByTestId("location-search")).toHaveTextContent(
        /^\?status=paused$/
      )
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

  describe("opening", () => {
    it("re-reads the goal once per open even when it is cached", async () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { staleTime: 5 * 60 * 1000 } },
      })
      goalOnScreen(rankGoal)
      queryClient.setQueryData(["goals", "detail", "goal-1"], rankGoal)

      const first = renderDialog({}, queryClient)
      await loaded()
      await vi.waitFor(() => expect(getGoal).toHaveBeenCalledTimes(1))
      first.unmount()

      renderDialog({}, queryClient)
      await loaded()
      await vi.waitFor(() => expect(getGoal).toHaveBeenCalledTimes(2))
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
      ).toHaveTextContent("Couldn't load this goal. It may no longer exist.")
      expect(screen.queryByTestId("goal-edit-save")).toBeNull()
      fireEvent.click(screen.getByTestId("goal-edit-cancel"))
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })
})
