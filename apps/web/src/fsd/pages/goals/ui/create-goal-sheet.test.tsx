import { useEffect, useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@/test/render"
import userEvent from "@testing-library/user-event"
import { lastRank } from "@workspace/game-domain"

// Minimal stand-in for dexie-react-hooks' real `useLiveQuery` — mirrors
// pages/lookup/.../character-lookup-page.test.tsx's version. The query fns it calls are mocked
// directly below, so it only needs to handle a synchronous value and a resolving promise.
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

vi.mock("@/entities/player-data-override", () => ({
  onslaughtProgressQueries: {
    current: () => ({
      queryKey: ["player-data-overrides", "onslaught"],
      queryFn: () =>
        Promise.resolve({
          imperial: { sector: "Stone", tier: 1 },
          xenos: { sector: "Stone", tier: 1 },
          chaos: { sector: "Stone", tier: 1 },
          revision: 1,
        }),
    }),
  },
  getOnslaughtProgress: () =>
    Promise.resolve({
      imperial: { sector: "Stone", tier: 1 },
      xenos: { sector: "Stone", tier: 1 },
      chaos: { sector: "Stone", tier: 1 },
      revision: 1,
    }),
  progressForAlliance: (progress: Record<string, unknown>, alliance: string) =>
    progress[alliance.toLowerCase()],
  onslaughtReward: () => ({ min: 2, max: 3, mythic: false }),
}))

vi.mock("@/entities/planning-setting", () => ({
  dailyEnergyTiers: [288, 378, 438, 538, 638, 738, 838, 938],
  usePlanningSettings: () => ({
    settings: { dailyEnergy: 288, revision: 1 },
    save: vi.fn(),
  }),
}))

const account = { homeAccountId: "acc-1", username: "test@example.com" }

vi.mock("@azure/msal-react", () => ({
  useMsal: () => ({
    accounts: [account],
    instance: { getActiveAccount: () => account },
  }),
  // true so useGoalPrefill actually calls getPlayerCharacter (below) — its per-test mocked
  // resolution is how these tests control whether the selected character reads as locked/owned.
  useIsAuthenticated: () => true,
}))

const characters = new Map([
  [
    "hero1",
    {
      id: "hero1",
      name: "Hero One",
      faction: "Ultramarines",
      shardLocations: [{ battleId: "B1" }],
      rankUpUpgrades: [
        { rank: "Stone1", upgradeIds: ["h1", "c1"] },
        { rank: "Stone2", upgradeIds: ["h2"] },
      ],
    },
  ],
])

const upgrades = [
  {
    id: "h1",
    label: "Health Base",
    rarity: "Common",
    stat: "Health",
    craftable: false,
    recipe: [],
    // Farmable at a guaranteed-drop node so the estimate preview (plan §16 phase 4) has something to
    // compute for the default Stone1 -> Stone2 range selectCharacter() lands on.
    farmLocations: [
      {
        battleId: "B1",
        guaranteed: true,
        effectiveRate: null,
        numerator: null,
        denominator: null,
      },
    ],
  },
  {
    id: "h2",
    label: "Health Two",
    rarity: "Common",
    stat: "Health",
    craftable: false,
    recipe: [],
    farmLocations: [],
  },
  {
    id: "c1",
    label: "Crafted Attack",
    rarity: "Rare",
    stat: "Damage",
    craftable: true,
    recipe: [{ material: "h1", count: 2 }],
    farmLocations: [],
  },
]

const equipmentItems = new Map([
  [
    "I_Crit_C001",
    {
      id: "I_Crit_C001",
      name: "Common Blade",
      rarity: "Common",
      isRelic: false,
      levels: [{ stats: {} }, { stats: {} }],
    },
  ],
  [
    "I_Crit_M001",
    {
      id: "I_Crit_M001",
      name: "Mythic Edge",
      rarity: "Mythic",
      isRelic: false,
      levels: [{ stats: {} }, { stats: {} }],
    },
  ],
  [
    "I_Block_C002",
    {
      id: "I_Block_C002",
      name: "Refractor Field",
      rarity: "Legendary",
      isRelic: true,
      levels: [{ stats: {} }, { stats: {} }, { stats: {} }],
    },
  ],
])

const battles = [
  {
    id: "B1",
    campaignGroupId: "CG1",
    type: "Normal",
    challenge: false,
    nodeNumber: 1,
    energyCost: 10,
  },
]

const mows = new Map([
  [
    "mow1",
    {
      id: "mow1",
      name: "Stormbird",
      unitKind: "Vehicle",
      faction: "Ultramarines",
      alliance: "Imperial",
      primaryAbility: { name: "Smash", recipes: [["h1"]] },
      secondaryAbility: { name: "Crush", recipes: [] },
    },
  ],
])

vi.mock("@workspace/game-catalog/queries", () => ({
  getCharactersMap: () => characters,
  getMowsMap: () => mows,
  getUpgrades: () => upgrades,
  getCampaignBattles: () => battles,
  getCampaignDefinitions: () => [],
  getAscensionCostsMap: () => new Map(),
  getUnlockShardCostsMap: () => new Map(),
  getOnslaughtRewards: () => [],
  getEquipmentMap: () => Promise.resolve(equipmentItems),
}))

const getPlayerCharacter = vi.fn()
const getPlayerMow = vi.fn()
const getInventoryUpgrades = vi.fn()
// Backs the picker's locked-unit lookup — empty roster by default (no test here asserts on the
// lock badge itself, that's covered by unit-combobox.test.tsx).
const getPlayerCharacters = vi.fn(() => Promise.resolve([]))
const getPlayerMows = vi.fn(() => Promise.resolve([]))

vi.mock("@workspace/player-data/queries", () => ({
  getPlayerCharacter: (...args: unknown[]) => getPlayerCharacter(...args),
  getPlayerMow: (...args: unknown[]) => getPlayerMow(...args),
  getPlayerCharacters: () => getPlayerCharacters(),
  getPlayerMows: () => getPlayerMows(),
  getInventoryUpgrades: (...args: unknown[]) => getInventoryUpgrades(...args),
  getInventoryShard: () => undefined,
  getLiveProgress: () => undefined,
}))

const createCombinedGoals = vi.fn()
const createGoal = vi.fn()
const listProjects = vi.fn()

vi.mock("@/entities/goal", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/goal")>()),
  createCombinedGoals: (...args: unknown[]) => createCombinedGoals(...args),
  createGoal: (...args: unknown[]) => createGoal(...args),
}))

vi.mock("@/entities/project", () => ({
  listProjects: (...args: unknown[]) => listProjects(...args),
  projectQueries: {
    list: () => ({
      queryKey: ["projects", "list"],
      queryFn: () => listProjects(),
    }),
  },
}))

vi.mock("@/shared/api", () => ({ ApiError: class ApiError extends Error {} }))

import { CreateGoalSheet } from "./create-goal-sheet"

async function selectCharacter() {
  fireEvent.click(
    screen.getByRole("combobox", {
      name: "goals.create.unitPlaceholder",
    })
  )
  fireEvent.click(await screen.findByText("Hero One"))
}

async function selectMow() {
  fireEvent.click(
    screen.getByRole("combobox", {
      name: "goals.create.unitPlaceholder",
    })
  )
  fireEvent.click(await screen.findByText("Stormbird"))
}

describe("CreateGoalSheet", () => {
  beforeEach(() => {
    createCombinedGoals.mockReset()
    listProjects.mockReset()
    listProjects.mockResolvedValue({ projects: [] })

    // Owned, nothing applied yet — numerically identical missingUpgrades/estimate math to an
    // undefined playerCharacter, but not locked, so most tests exercise the plain (no
    // auto-suggestion) composer path. Locked-character tests override this per test.
    getPlayerCharacter.mockReset()
    getPlayerCharacter.mockResolvedValue({
      rank: "Stone1",
      progressionIndex: "Common:None",
      appliedUpgradeSlots: [],
    })
    getPlayerMow.mockReset()
    getPlayerMow.mockResolvedValue(undefined)
    getInventoryUpgrades.mockReset()
    getInventoryUpgrades.mockReturnValue(undefined)
  })

  it("creates a Rank goal for the selected character and closes on success", async () => {
    createCombinedGoals.mockResolvedValue({ goals: [{ goalId: "goal-1" }] })
    const onOpenChange = vi.fn()
    const onCreated = vi.fn()
    render(
      <CreateGoalSheet open onOpenChange={onOpenChange} onCreated={onCreated} />
    )

    await selectCharacter()
    // Wait for useGoalPrefill's getPlayerCharacter() to resolve (owned, per the beforeEach mock) —
    // before it resolves, isLocked reads its pre-resolution default (locked), which would also
    // include an auto-suggested Unlock in the submission this test isn't testing for.
    await vi.waitFor(() => {
      expect(
        screen.getByTestId("create-goal-type-toggle-Rank")
      ).not.toBeDisabled()
    })
    // No goal type is preselected — turn Rank on explicitly.
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Rank"))
    await vi.waitFor(() => {
      expect(
        screen.getByTestId("create-goal-review").querySelectorAll("li")
      ).toHaveLength(1)
    })
    fireEvent.click(screen.getByTestId("create-goal-submit"))

    await vi.waitFor(() => {
      expect(createCombinedGoals).toHaveBeenCalledTimes(1)
    })
    const [request] = createCombinedGoals.mock.calls[0]
    expect(request).toMatchObject({
      entityType: "Character",
      entityId: "hero1",
      projectIds: undefined,
    })
    expect(request.goals).toHaveLength(1)
    expect(request.goals[0]).toMatchObject({
      goalType: "Rank",
      dependsOnIndex: [],
    })
    expect(request.goals[0].config.rank).toMatchObject({ start: 0, end: 1 })

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onCreated).toHaveBeenCalledTimes(1)
  })

  it("keeps the sheet open and resets the form when 'create another' is checked", async () => {
    createCombinedGoals.mockResolvedValue({ goals: [{ goalId: "goal-1" }] })
    const onOpenChange = vi.fn()
    render(
      <CreateGoalSheet open onOpenChange={onOpenChange} onCreated={vi.fn()} />
    )

    await selectCharacter()
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Rank"))
    fireEvent.click(
      screen.getByRole("checkbox", { name: "goals.create.createAnother" })
    )
    fireEvent.click(screen.getByTestId("create-goal-submit"))

    // Wait for the actual reset (not just the createCombinedGoals call) — the mocked call
    // registers synchronously, before its resolved promise lets handleSubmit's resetForm() run.
    await vi.waitFor(() => {
      expect(
        screen.getByRole("combobox", {
          name: "goals.create.unitPlaceholder",
        })
      ).toHaveTextContent("goals.create.unitPlaceholder")
    })
    expect(createCombinedGoals).toHaveBeenCalledTimes(1)
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it("shows the ApiError message when creation fails", async () => {
    createCombinedGoals.mockRejectedValue(new Error("boom"))
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Rank"))
    fireEvent.click(screen.getByTestId("create-goal-submit"))

    await vi.waitFor(() => {
      expect(screen.getByTestId("create-goal-error")).toHaveTextContent(
        "goals.create.genericError"
      )
    })
  })

  it("shows an estimated completion date in the preview once the required material is farmable", async () => {
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Rank"))

    await vi.waitFor(() => {
      expect(screen.getByTestId("create-goal-estimate")).toBeInTheDocument()
    })
  })

  it("shows a checkpoint-chain preview and explanation that updates with the selected farming strategy", async () => {
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Rank"))

    // Defaults to "Total upgrades" (use-create-goal-form.ts's initial state).
    await vi.waitFor(() => {
      expect(
        screen.getByTestId("create-goal-farming-strategy-preview")
      ).toHaveTextContent(
        "goals.create.farmingStrategy.explanation.TotalUpgrades"
      )
    })

    fireEvent.click(screen.getByTestId("create-goal-farming-strategy"))
    fireEvent.click(
      within(await screen.findByRole("listbox")).getByText(
        "goals.create.farmingStrategy.Milestones"
      )
    )

    await vi.waitFor(() => {
      expect(
        screen.getByTestId("create-goal-farming-strategy-preview")
      ).toHaveTextContent("goals.create.farmingStrategy.explanation.Milestones")
    })
  })

  it("submits only the explicitly toggled types, with no config target for Unlock", async () => {
    createCombinedGoals.mockResolvedValue({ goals: [] })
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()
    // No goal type is preselected — turn Unlock on explicitly.
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Unlock"))
    fireEvent.click(screen.getByTestId("create-goal-submit"))

    await vi.waitFor(() => {
      expect(createCombinedGoals).toHaveBeenCalledTimes(1)
    })
    const [request] = createCombinedGoals.mock.calls[0]
    expect(request.goals).toEqual([
      expect.objectContaining({
        goalType: "Unlock",
        config: {},
        dependsOnIndex: [],
      }),
    ])
  })

  it("creates an Upgrade goal with one target selected from the relevant-upgrades picker", async () => {
    createCombinedGoals.mockResolvedValue({ goals: [] })
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Upgrade"))

    fireEvent.click(
      screen.getByRole("combobox", {
        name: "goals.create.upgrade.add",
      })
    )
    const listbox = await screen.findByRole("listbox")
    fireEvent.click(within(listbox).getByText("Health Base"))

    const quantityInput = screen.getByRole("spinbutton", {
      name: "goals.create.upgrade.quantity",
    })
    fireEvent.change(quantityInput, { target: { value: "3" } })

    fireEvent.click(screen.getByTestId("create-goal-submit"))

    await vi.waitFor(() => {
      expect(createCombinedGoals).toHaveBeenCalledTimes(1)
    })
    const [request] = createCombinedGoals.mock.calls[0]
    expect(request.goals).toEqual([
      expect.objectContaining({
        goalType: "Upgrade",
        config: { upgrade: { targets: [{ upgradeId: "h1", quantity: 3 }] } },
        dependsOnIndex: [],
      }),
    ])
  })

  it("shows the required quantity for each upgrade in the picker and prefills the selected quantity from it", async () => {
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Upgrade"))

    fireEvent.click(
      screen.getByRole("combobox", {
        name: "goals.create.upgrade.add",
      })
    )
    const listbox = await screen.findByRole("listbox")
    expect(within(listbox).getByText("Health Base")).toBeInTheDocument()
    expect(
      within(listbox).getByText("goals.create.upgrade.required")
    ).toBeInTheDocument()
    // "Crafted Attack" (c1) is crafted — never offered as a direct Upgrade-goal target, only its
    // own base upgrade(s) are (see characterRelevantUpgradeQuantities's own doc comment).
    expect(
      within(listbox).queryByText("Crafted Attack")
    ).not.toBeInTheDocument()
    fireEvent.click(within(listbox).getByText("Health Base"))

    const quantityInput = screen.getByRole("spinbutton", {
      name: "goals.create.upgrade.quantity",
    })
    expect(quantityInput).toHaveValue(1)
  })

  it("disables and unchecks Rank/Ascension/Ability/Upgrade once the selected character is already maxed out", async () => {
    getPlayerCharacter.mockResolvedValue({
      rank: lastRank,
      progressionIndex: "Mythic:MythicWings",
      appliedUpgradeSlots: [],
      abilities: [{ level: 60 }, { level: 60 }],
    })
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()

    await vi.waitFor(() => {
      expect(screen.getByTestId("create-goal-type-toggle-Rank")).toBeDisabled()
    })
    expect(screen.getByTestId("create-goal-type-toggle-Rank")).not.toBeChecked()
    expect(
      screen.getByTestId("create-goal-type-toggle-Ascension")
    ).toBeDisabled()
    expect(screen.getByTestId("create-goal-type-toggle-Ability")).toBeDisabled()
    expect(
      screen.getByTestId("create-goal-type-toggle-Ability")
    ).not.toBeChecked()
    expect(screen.getByTestId("create-goal-type-toggle-Upgrade")).toBeDisabled()
  })

  it("disables the Unlock toggle and shows an already-unlocked hint once the selected character resolves as owned", async () => {
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()
    // Wait for getPlayerCharacter() to resolve (owned, per the beforeEach mock) — the pre-resolution
    // window still reads as locked, same caveat the other tests here call out.
    await vi.waitFor(() => {
      expect(
        screen.getByTestId("create-goal-type-toggle-Unlock")
      ).toBeDisabled()
    })
    expect(
      screen.getByText("goals.create.validation.alreadyUnlocked")
    ).toBeVisible()
  })

  it("allows an Unlock goal for a locked Machine of War", async () => {
    getPlayerMow.mockResolvedValue(undefined)
    createCombinedGoals.mockResolvedValue({ goals: [] })
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectMow()
    await vi.waitFor(() => {
      expect(
        screen.getByTestId("create-goal-type-toggle-Unlock")
      ).not.toBeDisabled()
    })
    // No goal type is preselected — turn Unlock on explicitly.
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Unlock"))
    fireEvent.click(screen.getByTestId("create-goal-submit"))

    await vi.waitFor(() => {
      expect(createCombinedGoals).toHaveBeenCalledTimes(1)
    })
    const [request] = createCombinedGoals.mock.calls[0]
    expect(request).toMatchObject({ entityType: "Mow", entityId: "mow1" })
    expect(request.goals).toEqual([
      expect.objectContaining({
        goalType: "Unlock",
        config: {},
        dependsOnIndex: [],
      }),
    ])
  })

  it("auto-suggests and includes Unlock for a locked character, with Rank depending on it, and lists it in the review", async () => {
    getPlayerCharacter.mockResolvedValue(undefined)
    createCombinedGoals.mockResolvedValue({ goals: [] })
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()
    // No goal type is preselected — turn Rank on explicitly, which is what triggers the auto-
    // suggested Unlock prerequisite for a locked entity.
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Rank"))

    const review = await screen.findByTestId("create-goal-review")
    expect(review).toHaveTextContent("goals.create.goalTypes.Unlock")
    expect(review).toHaveTextContent("goals.create.suggestions.unlockRequired")

    fireEvent.click(screen.getByTestId("create-goal-submit"))

    await vi.waitFor(() => {
      expect(createCombinedGoals).toHaveBeenCalledTimes(1)
    })
    const [request] = createCombinedGoals.mock.calls[0]
    expect(request.goals).toHaveLength(2)
    expect(request.goals[0]).toMatchObject({
      goalType: "Unlock",
      dependsOnIndex: [],
    })
    expect(request.goals[1]).toMatchObject({
      goalType: "Rank",
      dependsOnIndex: [0],
    })
  })

  it("creates an Ability goal for the selected Machine of War, with no Rank toggle offered", async () => {
    // Owned (mirrors the Character "plain" tests' getPlayerCharacter override) so this test exercises
    // the no-auto-suggestion path — an undefined playerMow would auto-suggest Unlock, like the locked-
    // character test above.
    getPlayerMow.mockResolvedValue({
      progressionIndex: "Common:None",
      abilities: [],
      appliedUpgradeSlots: [],
    })
    createCombinedGoals.mockResolvedValue({ goals: [{ goalId: "goal-1" }] })
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectMow()
    // Wait for useGoalPrefill's getPlayerMow() to resolve (owned) — before it resolves, isLocked
    // reads its pre-resolution default (locked), which would also auto-suggest Unlock once Ability
    // is turned on below. The Unlock toggle going disabled is the observable sign that the owned
    // data has landed.
    await vi.waitFor(() => {
      expect(
        screen.getByTestId("create-goal-type-toggle-Unlock")
      ).toBeDisabled()
    })

    expect(
      screen.queryByTestId("create-goal-type-toggle-Rank")
    ).not.toBeInTheDocument()
    expect(
      screen.getByTestId("create-goal-type-toggle-Ability")
    ).toBeInTheDocument()

    // No goal type is preselected — turn Ability on explicitly.
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Ability"))

    await vi.waitFor(() => {
      expect(
        screen.getByTestId("create-goal-review").querySelectorAll("li")
      ).toHaveLength(1)
    })

    await vi.waitFor(() => {
      expect(screen.getByTestId("create-goal-submit")).not.toBeDisabled()
    })

    fireEvent.click(screen.getByTestId("create-goal-submit"))

    await vi.waitFor(() => {
      expect(createCombinedGoals).toHaveBeenCalledTimes(1)
    })
    const [request] = createCombinedGoals.mock.calls[0]
    expect(request).toMatchObject({
      entityType: "Mow",
      entityId: "mow1",
      projectIds: undefined,
    })
    expect(request.goals).toHaveLength(1)
    expect(request.goals[0]).toMatchObject({
      goalType: "Ability",
      dependsOnIndex: [],
    })
  })

  it("submits every checked project when several are selected", async () => {
    listProjects.mockResolvedValue({
      projects: [
        { projectId: "proj-1", name: "My Goals", isActivePlan: true },
        { projectId: "proj-2", name: "Event Prep", isActivePlan: false },
      ],
    })
    createCombinedGoals.mockResolvedValue({ goals: [{ goalId: "goal-1" }] })
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Rank"))
    fireEvent.click(await screen.findByTestId("create-goal-project-proj-1"))
    fireEvent.click(await screen.findByTestId("create-goal-project-proj-2"))
    fireEvent.click(screen.getByTestId("create-goal-submit"))

    await vi.waitFor(() => {
      expect(createCombinedGoals).toHaveBeenCalledTimes(1)
    })
    const [request] = createCombinedGoals.mock.calls[0]
    expect(request.projectIds).toEqual(["proj-1", "proj-2"])
  })

  it("creates an UpgradeEquipment goal for the selected equipment and target level", async () => {
    createGoal.mockResolvedValue({ goalId: "goal-1" })
    const onOpenChange = vi.fn()
    const onCreated = vi.fn()
    render(
      <CreateGoalSheet open onOpenChange={onOpenChange} onCreated={onCreated} />
    )

    const user = userEvent.setup()
    await user.click(screen.getByTestId("create-goal-pill-equipment"))
    fireEvent.click(
      screen.getByRole("combobox", {
        name: "goals.create.equipment.placeholder",
      })
    )
    const listbox = await screen.findByRole("listbox")
    fireEvent.click(within(listbox).getByText("Refractor Field"))

    const levelInput = screen.getByDisplayValue("2")
    fireEvent.change(levelInput, { target: { value: "3" } })

    fireEvent.click(screen.getByTestId("create-goal-submit"))

    await vi.waitFor(() => {
      expect(createGoal).toHaveBeenCalledTimes(1)
    })
    expect(createGoal.mock.calls[0][0]).toEqual({
      entityType: "Equipment",
      entityId: "I_Block_C002",
      goalType: "UpgradeEquipment",
      config: { equipment: { targetLevel: 3 } },
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onCreated).toHaveBeenCalledTimes(1)
  })

  it("groups the Equipment picker by rarity (highest first), relics above Mythic, with an icon per option", async () => {
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    const user = userEvent.setup()
    await user.click(screen.getByTestId("create-goal-pill-equipment"))
    fireEvent.click(
      screen.getByRole("combobox", {
        name: "goals.create.equipment.placeholder",
      })
    )
    const listbox = await screen.findByRole("listbox")
    const options = within(listbox).getAllByRole("option")

    // Refractor Field is a relic (rarity Legendary) — its own "Relic" group sorts above even the
    // non-relic Mythic Edge, ahead of Common Blade.
    expect(options.map((option) => option.textContent)).toEqual([
      "Refractor Field",
      "Mythic Edge",
      "Common Blade",
    ])
    expect(
      within(listbox).getByText("goals.create.equipment.relicGroup")
    ).toBeInTheDocument()
    for (const option of options) {
      expect(option.querySelector("img")).not.toBeNull()
    }
  })

  it("disables submit on the Equipment pill until a piece of equipment is selected", async () => {
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    const user = userEvent.setup()
    await user.click(screen.getByTestId("create-goal-pill-equipment"))

    expect(screen.getByTestId("create-goal-submit")).toBeDisabled()
  })
})
