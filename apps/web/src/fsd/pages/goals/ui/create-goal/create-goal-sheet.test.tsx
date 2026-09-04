import { useEffect, useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@/test/render"
import { lastRank } from "@workspace/game-domain"

// Minimal stand-in for dexie-react-hooks' real `useLiveQuery` — mirrors
// pages/library/.../character-lookup-page.test.tsx's version. The query fns it calls are mocked
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

vi.mock("@/shared/tour", () => ({
  useTourPageSteps: () => undefined,
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
      // Backs the Unlock card's "X out of Y shards required to unlock at R" — R is this.
      initialRarity: "Common",
      // guaranteed: true (dropRate 1) against B1's energyCost: 10 below gives a clean 10-energy-
      // per-shard figure for the shard-location selector's energy math. ASE28 is a mythic-shard
      // node (isMythic: true) — present in the catalog data purely to back the "Unlock never
      // offers a mythic location, Ascension offers it only once its range needs mythic shards"
      // tests below; it must never appear on the Unlock card regardless of range.
      shardLocations: [
        { battleId: "B1", guaranteed: true },
        { battleId: "ASE28", guaranteed: true, isMythic: true },
      ],
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
    // A resolvable campaign/type combo (storyline group "campaign1", per
    // @workspace/game-catalog's campaignDescriptor) so the shard-location field's full-name
    // rendering has something real to resolve, rather than falling back to the raw battle id.
    id: "B1",
    campaignGroupId: "campaign1",
    type: "Standard",
    challenge: false,
    nodeNumber: 1,
    energyCost: 10,
    dailyAttempts: 10,
  },
  {
    id: "ASE28",
    campaignGroupId: "CGM",
    type: "Extremis",
    challenge: false,
    nodeNumber: 28,
    energyCost: 15,
    dailyAttempts: 10,
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
  // Common:None -> Common:OneStar (the default range a locked character's Ascension card lands
  // on) costs 20 regular shards — backs the Ascension card's own energy-for-remaining-shards line.
  getAscensionCostsMap: () =>
    new Map([
      [
        "Common:OneStar",
        {
          progression: "Common:OneStar",
          shards: 20,
          mythicShards: 0,
          orbs: 0,
          orbRarity: null,
        },
      ],
      // Crossing into this step costs mythic shards — backs the "Ascension only offers the
      // mythic shard-location group once its range actually needs mythic shards" test below.
      // "TwoBlueStars" (unlike "OneBlueStar") has no Legendary-tier counterpart in
      // progressionOrder, so its star label is unambiguous in the progression-end picker.
      [
        "Mythic:TwoBlueStars",
        {
          progression: "Mythic:TwoBlueStars",
          shards: 0,
          mythicShards: 8,
          orbs: 0,
          orbRarity: null,
        },
      ],
    ]),
  // Y in the Unlock card's "X out of Y shards required to unlock at R" — 30 total for Common.
  getUnlockShardCostsMap: () =>
    new Map([["Common", { rarity: "Common", shards: 30 }]]),
  getOnslaughtRewards: () => [],
  getEquipmentMap: () => Promise.resolve(equipmentItems),
  // No shop currently offers any unit's shards by default — the acquisition-source picker's
  // Shops group stays hidden unless a test overrides this.
  getShops: () => Promise.resolve([]),
}))

const getPlayerCharacter = vi.fn()
const getPlayerMow = vi.fn()
const getInventoryUpgrades = vi.fn()
const getInventoryXpBooks = vi.fn()
const getPlayerInventoryItems = vi.fn()
const getInventoryShard = vi.fn()
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
  getInventoryXpBooks: () => getInventoryXpBooks(),
  getPlayerInventoryItems: () => getPlayerInventoryItems(),
  getInventoryShard: (...args: unknown[]) => getInventoryShard(...args),
  getLiveProgress: () => undefined,
}))

const createCombinedGoals = vi.fn()
const createGoal = vi.fn()
const listProjects = vi.fn()
const listGoals = vi.fn(() => Promise.resolve({ goals: [] }))

vi.mock("@/entities/goal", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/goal")>()),
  createCombinedGoals: (...args: unknown[]) => createCombinedGoals(...args),
  createGoal: (...args: unknown[]) => createGoal(...args),
  // Backs useGoalTypeConflicts' active/paused-goal lookup — empty by default (no test here asserts
  // on the same-kind-goal-exists disable message, that's covered by use-goal-type-conflicts.test.ts).
  goalQueries: {
    list: (archived: boolean) => ({
      queryKey: ["goals", "list", { archived }],
      queryFn: () => listGoals(),
    }),
    // Backs use-per-project-estimates.ts's per-goal detail fetch — never actually called while
    // projectQueries.goals (above) returns no members, but stubbed defensively all the same.
    detail: (goalId: string) => ({
      queryKey: ["goals", "detail", goalId],
      queryFn: () => Promise.reject(new Error("not stubbed")),
    }),
  },
}))

vi.mock("@/entities/project", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/project")>()),
  listProjects: (...args: unknown[]) => listProjects(...args),
  projectQueries: {
    // Backs use-per-project-estimates.ts's per-project member lookup — empty by default (no test
    // here asserts on the per-project duration preview itself, that's covered by
    // per-project-estimate.test.ts), which also keeps it from ever needing goalQueries.detail.
    goals: (projectId: string) => ({
      queryKey: ["projects", "detail", projectId, "goals"],
      queryFn: () => Promise.resolve({ goals: [] }),
    }),
    list: () => ({
      queryKey: ["projects", "list"],
      queryFn: () => listProjects(),
    }),
  },
}))

vi.mock("@/shared/api", () => ({ ApiError: class ApiError extends Error {} }))

import { CreateGoalSheet } from ".//create-goal-sheet"

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
    listGoals.mockReset()
    listGoals.mockResolvedValue({ goals: [] })

    // Owned, nothing applied yet — numerically identical missingUpgrades/estimate math to an
    // undefined playerCharacter, but not locked, so most tests exercise the plain (no
    // auto-suggestion) composer path. Locked-character tests override this per test.
    getPlayerCharacter.mockReset()
    getPlayerCharacter.mockResolvedValue({
      rank: "Stone1",
      progressionIndex: "Common:None",
      appliedUpgradeSlots: [],
      // High enough that no test's Rank/Ability target implies a level the character hasn't
      // already reached (see needsLevel in use-goal-prerequisites.ts) — otherwise a Level goal
      // gets auto-suggested and included, changing review-item/submitted-goal counts most tests
      // here don't expect. Below MAX_CHARACTER_LEVEL so the Level toggle itself stays enabled.
      // Tests specifically covering Level auto-suggestion/creation override this per test.
      xpLevel: 59,
    })
    getPlayerMow.mockReset()
    getPlayerMow.mockResolvedValue(undefined)
    getInventoryUpgrades.mockReset()
    getInventoryUpgrades.mockReturnValue(undefined)
    getInventoryXpBooks.mockReset()
    getInventoryXpBooks.mockReturnValue(undefined)
    getPlayerInventoryItems.mockReset()
    getPlayerInventoryItems.mockReturnValue(undefined)
    getInventoryShard.mockReset()
    getInventoryShard.mockReturnValue(undefined)
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
      projects: undefined,
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

  it("returns a persisted sheet to idle when reopening after a successful creation", async () => {
    createCombinedGoals.mockResolvedValue({ goals: [{ goalId: "goal-1" }] })
    const onOpenChange = vi.fn()
    const onCreated = vi.fn()
    const { rerender } = render(
      <CreateGoalSheet open onOpenChange={onOpenChange} onCreated={onCreated} />
    )

    await selectCharacter()
    await vi.waitFor(() => {
      expect(
        screen.getByTestId("create-goal-type-toggle-Rank")
      ).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Rank"))
    await vi.waitFor(() => {
      expect(screen.getByTestId("create-goal-submit")).toBeEnabled()
    })
    fireEvent.click(screen.getByTestId("create-goal-submit"))

    await vi.waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    // AppShell keeps CreateGoalSheet mounted while its controlled `open` prop changes.
    rerender(
      <CreateGoalSheet
        open={false}
        onOpenChange={onOpenChange}
        onCreated={onCreated}
      />
    )
    rerender(
      <CreateGoalSheet open onOpenChange={onOpenChange} onCreated={onCreated} />
    )

    await vi.waitFor(() => {
      expect(screen.getByTestId("create-goal-submit")).toBeEnabled()
    })
    expect(
      screen
        .getByTestId("create-goal-submit")
        .querySelector('[data-slot="spinner"]')
    ).toBeNull()
  })

  it("creates a Level goal for the selected character, current level read-only, prefilled from synced xpLevel, with a books/gold cost preview", async () => {
    createCombinedGoals.mockResolvedValue({ goals: [{ goalId: "goal-1" }] })
    getPlayerCharacter.mockResolvedValue({
      rank: "Stone1",
      progressionIndex: "Common:None",
      appliedUpgradeSlots: [],
      xpLevel: 31,
      xp: 0,
    })
    const onOpenChange = vi.fn()
    const onCreated = vi.fn()
    render(
      <CreateGoalSheet open onOpenChange={onOpenChange} onCreated={onCreated} />
    )

    await selectCharacter()
    await vi.waitFor(() => {
      expect(
        screen.getByTestId("create-goal-type-toggle-Level")
      ).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Level"))

    await vi.waitFor(() => {
      expect(screen.getByTestId("create-goal-level-target")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId("create-goal-level-target"))
    fireEvent.click(within(await screen.findByRole("listbox")).getByText("42"))

    // 31 -> 42 with 0 partial xp needs a non-zero books/gold cost (exact figures are covered by
    // level-xp-cost.test.ts's own unit coverage — this file's `t` mock doesn't interpolate options,
    // so the count/gold values themselves aren't observable through rendered text here).
    await vi.waitFor(() => {
      const cost = screen.getByTestId("create-goal-level-cost")
      expect(cost).toHaveTextContent("goals.create.level.booksNeeded")
      expect(cost).toHaveTextContent("goals.create.level.goldToApply")
    })

    fireEvent.click(screen.getByTestId("create-goal-submit"))

    await vi.waitFor(() => {
      expect(createCombinedGoals).toHaveBeenCalledTimes(1)
    })
    const [request] = createCombinedGoals.mock.calls[0]
    expect(request.goals).toHaveLength(1)
    expect(request.goals[0]).toMatchObject({
      goalType: "Level",
      dependsOnIndex: [],
    })
    expect(request.goals[0].config.level).toEqual({ start: 31, end: 42 })

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onCreated).toHaveBeenCalledTimes(1)
  })

  it("applies a prerequisite prefill for the unit, required target, and project memberships", async () => {
    getPlayerCharacter.mockResolvedValue({
      rank: "Stone1",
      progressionIndex: "Common:None",
      appliedUpgradeSlots: [],
      xpLevel: 31,
      xp: 0,
    })
    listProjects.mockResolvedValue({
      projects: [
        { projectId: "proj-1", name: "One", isActivePlan: true },
        { projectId: "proj-2", name: "Two", isActivePlan: false },
      ],
    })
    render(
      <CreateGoalSheet
        onCreated={vi.fn()}
        onOpenChange={vi.fn()}
        open
        prefill={{
          entityType: "Character",
          entityId: "hero1" as never,
          goalType: "Level",
          requiredLevel: 42,
          projectIds: ["proj-2"],
        }}
      />
    )

    expect(
      await screen.findByTestId("create-goal-type-card-Level")
    ).toBeVisible()
    await vi.waitFor(() => {
      expect(screen.getByTestId("create-goal-level-target")).toHaveTextContent(
        "42"
      )
      expect(
        screen.getByTestId("create-goal-project-chip-proj-2")
      ).toBeInTheDocument()
      expect(
        screen.queryByTestId("create-goal-project-chip-proj-1")
      ).not.toBeInTheDocument()
    })
  })

  it("nets a Level goal's cost against owned XP books, hiding the cost preview once fully covered", async () => {
    getPlayerCharacter.mockResolvedValue({
      rank: "Stone1",
      progressionIndex: "Common:None",
      appliedUpgradeSlots: [],
      xpLevel: 31,
      xp: 0,
    })
    // 31 -> 32 needs 94200 - 72200 = 22000 xp; 2 owned Legendary books (25000 xp) fully covers it.
    getInventoryXpBooks.mockReturnValue([
      { xpBookId: "bookLegendary", amount: 2 },
    ])
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()
    await vi.waitFor(() => {
      expect(
        screen.getByTestId("create-goal-type-toggle-Level")
      ).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Level"))

    await vi.waitFor(() => {
      expect(screen.getByTestId("create-goal-level-target")).toBeInTheDocument()
    })
    await vi.waitFor(() => {
      expect(
        screen.queryByTestId("create-goal-level-cost")
      ).not.toBeInTheDocument()
    })
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
    expect(
      screen
        .getByTestId("create-goal-submit")
        .querySelector('[data-slot="spinner"]')
    ).toBeNull()
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

  it("no longer shows a combined duration estimate inside the Resources needed card", async () => {
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Rank"))

    await vi.waitFor(() => {
      expect(screen.getByTestId("create-goal-preview")).toBeInTheDocument()
    })
    expect(screen.queryByTestId("create-goal-estimate")).not.toBeInTheDocument()
  })

  it('shows a per-project estimated duration in "What will be created" once the required material is farmable', async () => {
    listProjects.mockResolvedValue({
      projects: [
        {
          projectId: "proj-1",
          name: "My Goals",
          isActivePlan: true,
          isDefault: true,
          status: "Active",
        },
      ],
    })
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Rank"))
    await vi.waitFor(() => {
      expect(
        screen.getByTestId("create-goal-project-estimate-proj-1")
      ).toHaveTextContent("goals.create.previewEstimate")
    })
  })

  it("estimates against the default project when no project is checked", async () => {
    listProjects.mockResolvedValue({
      projects: [
        {
          projectId: "proj-1",
          name: "My Goals",
          isActivePlan: true,
          isDefault: true,
        },
      ],
    })
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Rank"))

    // No project checkbox clicked — the estimate still resolves, against the default project.
    await vi.waitFor(() => {
      expect(
        screen.getByTestId("create-goal-project-estimate-proj-1")
      ).toHaveTextContent("goals.create.previewEstimate")
    })
  })

  it("renders sections in order: config cards, then prerequisite suggestions, then project selection, then the review", async () => {
    // A locked character (getPlayerCharacter unresolved) is what puts a prerequisite-suggestion
    // checkbox and a config card and the review on screen simultaneously (see the auto-suggests
    // test below) — reused here purely to compare their DOM positions.
    getPlayerCharacter.mockResolvedValue(undefined)
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Rank"))

    const rankCard = await screen.findByTestId("create-goal-type-card-Rank")
    const unlockSuggestion = await screen.findByTestId(
      "create-goal-include-unlock"
    )
    const projectLabel = screen.getByText("goals.detail.projectsTitle")
    const review = await screen.findByTestId("create-goal-review")

    // Node.DOCUMENT_POSITION_FOLLOWING set on the bitmask means the argument comes after `this` in
    // the document.
    expect(
      rankCard.compareDocumentPosition(unlockSuggestion) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(
      unlockSuggestion.compareDocumentPosition(projectLabel) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(
      projectLabel.compareDocumentPosition(review) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it("shows the character's shard farm locations with an energy-per-shard figure on the Unlock card, defaulting farmingLocationIds to the lowest-energy node", async () => {
    createCombinedGoals.mockResolvedValue({ goals: [{ goalId: "goal-1" }] })
    getPlayerCharacter.mockResolvedValue(undefined) // locked, so Unlock is offered
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()
    await vi.waitFor(() => {
      expect(
        screen.getByTestId("create-goal-type-toggle-Unlock")
      ).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Unlock"))

    const location = await screen.findByTestId("create-goal-shard-location-B1")
    // Full campaign battle name (resolved from the "campaign1"/Standard descriptor + node number),
    // not the raw battle id — the mocked t() returns each key's defaultValue, so the campaign's own
    // name resolves to its untranslated nameKey ("indomitus") while the "Standard" difficulty word
    // (no defaultValue passed for it) falls back to its raw i18n key.
    expect(location).toHaveTextContent("indomitus")
    expect(location).toHaveTextContent("campaigns:difficulties.standard 1")
    // B1's energyCost (10) / guaranteed dropRate (1) = 10 energy per shard.
    expect(location).toHaveTextContent(
      "goals.create.shardLocations.energyPerShard"
    )
    // B1 is the character's only regular shard location, so it's selected by default without any
    // click — the user is never required to pick a location before an estimate is available.
    await vi.waitFor(() => {
      expect(
        screen.getByTestId("create-goal-shard-location-checkbox-B1")
      ).toBeChecked()
    })

    fireEvent.click(screen.getByTestId("create-goal-submit"))

    await vi.waitFor(() => {
      expect(createCombinedGoals).toHaveBeenCalledTimes(1)
    })
    const [request] = createCombinedGoals.mock.calls[0]
    const unlockSpec = request.goals.find(
      (goal: { goalType: string }) => goal.goalType === "Unlock"
    )
    expect(unlockSpec.config.acquisitionSources).toEqual([
      { kind: "Campaign", ids: ["B1"] },
    ])
  })

  it('shows "{{owned}} / {{total}} shards" + "{{remaining}} remaining" and an energy/days line on the Unlock card by default, with no mythic shard row', async () => {
    getPlayerCharacter.mockResolvedValue(undefined) // locked, so Unlock is offered
    getInventoryShard.mockResolvedValue({ amount: 12 }) // X = 12 owned shards
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()
    await vi.waitFor(() => {
      expect(
        screen.getByTestId("create-goal-type-toggle-Unlock")
      ).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Unlock"))

    const requirement = await screen.findByTestId(
      "create-goal-unlock-requirement"
    )
    expect(requirement).toHaveTextContent("goals.create.unlock.ownedOfTotal")
    expect(requirement).toHaveTextContent("goals.create.unlock.remaining")
    expect(requirement).not.toHaveTextContent("mythic")

    // The character's only regular shard location (B1) is selected by default, so the energy/days
    // figure is already shown without the user picking anything first.
    await vi.waitFor(() => {
      expect(requirement).toHaveTextContent(
        "goals.create.shardLocations.energyValue"
      )
    })
    expect(requirement).toHaveTextContent(
      "goals.create.shardLocations.daysValue"
    )
    expect(requirement).not.toHaveTextContent(
      "goals.create.unlock.selectLocationPrompt"
    )

    // Unchecking it back down to zero falls back to the "pick a location" prompt, rather than the
    // default being fought back on (a real "no restriction" state, distinct from the initial default).
    fireEvent.click(
      screen.getByTestId("create-goal-shard-location-checkbox-B1")
    )
    await vi.waitFor(() => {
      expect(requirement).toHaveTextContent(
        "goals.create.unlock.selectLocationPrompt"
      )
    })
    expect(requirement).not.toHaveTextContent(
      "goals.create.shardLocations.energyValue"
    )
  })

  it("shows the shard-location selector on the Ascension card too, but only once when Unlock is also enabled", async () => {
    getPlayerCharacter.mockResolvedValue(undefined) // locked, so both Unlock and Ascension are offered
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()
    await vi.waitFor(() => {
      expect(
        screen.getByTestId("create-goal-type-toggle-Ascension")
      ).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Ascension"))

    // The default Common:None -> Common:None range needs no shards at all, so the selector
    // correctly stays hidden until the target actually crosses a step that costs regular shards —
    // advance to Common:OneStar (20 regular shards per the ascension-costs fixture above).
    fireEvent.click(screen.getByTestId("create-goal-ascension-end"))
    const listbox = await screen.findByRole("listbox")
    fireEvent.click(
      within(listbox).getByAltText("OneStar").closest('[role="option"]')!
    )

    // Ascension alone: the shared selector shows on its card.
    await screen.findByTestId("create-goal-shard-location-B1")
    expect(screen.getAllByTestId("create-goal-shard-location-B1")).toHaveLength(
      1
    )

    // Enabling Unlock alongside it moves the (shared, single) selector to Unlock's card — never
    // duplicated across both at once.
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Unlock"))
    await vi.waitFor(() => {
      expect(
        screen.getAllByTestId("create-goal-shard-location-B1")
      ).toHaveLength(1)
    })
  })

  it("never offers a mythic shard location on the Unlock card, even though the character has one in its catalog data", async () => {
    getPlayerCharacter.mockResolvedValue(undefined) // locked, so Unlock is offered
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()
    await vi.waitFor(() => {
      expect(
        screen.getByTestId("create-goal-type-toggle-Unlock")
      ).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Unlock"))

    await screen.findByTestId("create-goal-shard-locations-regular")
    expect(
      screen.queryByTestId("create-goal-shard-locations-mythic")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("create-goal-shard-location-ASE28")
    ).not.toBeInTheDocument()
  })

  it("offers the mythic shard-location group on the Ascension card once the target range needs mythic shards", async () => {
    getPlayerCharacter.mockResolvedValue(undefined) // locked, so Ascension is offered
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()
    await vi.waitFor(() => {
      expect(
        screen.getByTestId("create-goal-type-toggle-Ascension")
      ).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Ascension"))

    // Default Common:None -> Common:None range needs nothing yet — no mythic group.
    expect(
      screen.queryByTestId("create-goal-shard-locations-mythic")
    ).not.toBeInTheDocument()

    // Advance all the way to Mythic:TwoBlueStars (8 mythic shards per the fixture above) — now the
    // mythic group appears, listing ASE28 (never B1, which is regular-only).
    fireEvent.click(screen.getByTestId("create-goal-ascension-end"))
    const listbox = await screen.findByRole("listbox")
    fireEvent.click(
      within(listbox).getByAltText("TwoBlueStars").closest('[role="option"]')!
    )

    await screen.findByTestId("create-goal-shard-location-ASE28")
    expect(
      within(
        screen.getByTestId("create-goal-shard-locations-mythic")
      ).queryByTestId("create-goal-shard-location-B1")
    ).not.toBeInTheDocument()
  })

  it("keeps Ascension-only mythic sources selectable once Unlock is also enabled (tacticus-planner-apps#103)", async () => {
    getPlayerCharacter.mockResolvedValue(undefined) // locked, so both Unlock and Ascension are offered
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()
    await vi.waitFor(() => {
      expect(
        screen.getByTestId("create-goal-type-toggle-Ascension")
      ).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Ascension"))

    // Advance to a range needing mythic shards before Unlock is enabled — same fixture/target as
    // "offers the mythic shard-location group..." above.
    fireEvent.click(screen.getByTestId("create-goal-ascension-end"))
    const listbox = await screen.findByRole("listbox")
    fireEvent.click(
      within(listbox).getByAltText("TwoBlueStars").closest('[role="option"]')!
    )
    await screen.findByTestId("create-goal-shard-location-ASE28")

    // Enabling Unlock alongside it moves the shared Campaigns group's regular-only sources to
    // Unlock's card, but the mythic-only node — which Unlock's card never offers — must stay
    // selectable somewhere, not disappear entirely.
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Unlock"))
    const mythicBlock = await screen.findByTestId(
      "create-goal-ascension-only-mythic-sources"
    )
    const mythicCheckbox = within(mythicBlock).getByTestId(
      "create-goal-shard-location-checkbox-ASE28"
    )
    expect(mythicCheckbox).toBeInTheDocument()
    const wasChecked = mythicCheckbox.getAttribute("aria-checked") === "true"

    fireEvent.click(mythicCheckbox)
    await vi.waitFor(() => {
      expect(mythicCheckbox.getAttribute("aria-checked")).toBe(
        wasChecked ? "false" : "true"
      )
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

    // Milestones needs a range spanning at least 2 milestone tiers — the default Stone1 -> Stone2
    // range is too short, so widen the target first.
    fireEvent.click(screen.getByTestId("create-goal-rank-end"))
    fireEvent.click(
      within(await screen.findByRole("listbox")).getByText("Silver1")
    )

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

  it("formats additional rank targets as the target rank plus applied slots", async () => {
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Rank"))

    fireEvent.click(screen.getByTestId("create-goal-rank-additional-target"))
    let listbox = await screen.findByRole("listbox")
    expect(
      within(listbox).getByRole("option", {
        name: "goals.create.rank.additionalTarget.none",
      })
    ).toBeInTheDocument()
    expect(
      within(listbox).getByRole("option", { name: /Stone2\s*\(3\/6\)/ })
    ).toBeInTheDocument()
    expect(within(listbox).getAllByRole("option")).toHaveLength(2)

    fireEvent.click(
      within(listbox).getByRole("option", {
        name: "goals.create.rank.additionalTarget.none",
      })
    )
    fireEvent.click(screen.getByTestId("create-goal-rank-end"))
    listbox = await screen.findByRole("listbox")
    fireEvent.click(within(listbox).getByText("Adamantine1"))

    fireEvent.click(screen.getByTestId("create-goal-rank-additional-target"))
    listbox = await screen.findByRole("listbox")
    expect(
      within(listbox).getByRole("option", {
        name: /Adamantine1\s*\(5\/6\)/,
      })
    ).toBeInTheDocument()

    fireEvent.click(
      within(listbox).getByRole("option", {
        name: "goals.create.rank.additionalTarget.none",
      })
    )
    fireEvent.click(screen.getByTestId("create-goal-rank-end"))
    listbox = await screen.findByRole("listbox")
    fireEvent.click(within(listbox).getByText("Adamantine2"))

    fireEvent.click(screen.getByTestId("create-goal-rank-additional-target"))
    listbox = await screen.findByRole("listbox")
    expect(within(listbox).getAllByRole("option")).toHaveLength(1)
    expect(
      within(listbox).getByRole("option", {
        name: "goals.create.rank.additionalTarget.none",
      })
    ).toBeInTheDocument()
  })

  it("submits only the explicitly toggled types, with no rank/progression/ability target for Unlock", async () => {
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
        // The Campaigns source defaults to the character's only regular shard location (B1) —
        // no rank/progression/ability target exists for Unlock, which is what this test guards.
        config: { acquisitionSources: [{ kind: "Campaign", ids: ["B1"] }] },
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

  it("disables and unchecks Rank/Ascension/Ability/Level/Upgrade once the selected character is already maxed out", async () => {
    getPlayerCharacter.mockResolvedValue({
      rank: lastRank,
      progressionIndex: "Mythic:MythicWings",
      appliedUpgradeSlots: [],
      abilities: [{ level: 60 }, { level: 60 }],
      xpLevel: 60,
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
    expect(screen.getByTestId("create-goal-type-toggle-Level")).toBeDisabled()
    expect(
      screen.getByTestId("create-goal-type-toggle-Level")
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
        // A MoW has no campaign shard locations at all — the Campaigns source still defaults to
        // enabled, just with nothing to restrict to (unrestricted/auto-pick, the pre-picker
        // default), rather than an empty config.
        config: { acquisitionSources: [{ kind: "Campaign", ids: [] }] },
        dependsOnIndex: [],
      }),
    ])
  })

  it("auto-suggests and includes Unlock and Level for a locked character, with Rank depending on both, and lists them in the review", async () => {
    getPlayerCharacter.mockResolvedValue(undefined)
    createCombinedGoals.mockResolvedValue({ goals: [] })
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()
    // No goal type is preselected — turn Rank on explicitly, which is what triggers the auto-
    // suggested Unlock prerequisite for a locked entity, and (Stone1 -> Stone2 implies level 3, a
    // locked character conservatively assumed to start at level 1) the auto-suggested Level goal.
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Rank"))

    const review = await screen.findByTestId("create-goal-review")
    expect(review).toHaveTextContent("goals.create.goalTypes.Unlock")
    expect(review).toHaveTextContent("goals.create.suggestions.unlockRequired")
    expect(review).toHaveTextContent("goals.create.goalTypes.Level")
    expect(review).toHaveTextContent("goals.create.suggestions.levelRequired")

    fireEvent.click(screen.getByTestId("create-goal-submit"))

    await vi.waitFor(() => {
      expect(createCombinedGoals).toHaveBeenCalledTimes(1)
    })
    const [request] = createCombinedGoals.mock.calls[0]
    expect(request.goals).toHaveLength(3)
    expect(request.goals[0]).toMatchObject({
      goalType: "Unlock",
      dependsOnIndex: [],
    })
    expect(request.goals[1]).toMatchObject({
      goalType: "Level",
      dependsOnIndex: [0],
    })
    expect(request.goals[1].config.level).toEqual({ start: 1, end: 3 })
    expect(request.goals[2]).toMatchObject({
      goalType: "Rank",
      dependsOnIndex: [0, 1],
    })
  })

  it("omits the suggested Level goal once its checkbox is unchecked", async () => {
    getPlayerCharacter.mockResolvedValue({
      rank: "Stone1",
      progressionIndex: "Common:None",
      appliedUpgradeSlots: [],
      xpLevel: 1,
    })
    createCombinedGoals.mockResolvedValue({ goals: [] })
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()
    await vi.waitFor(() => {
      expect(
        screen.getByTestId("create-goal-type-toggle-Rank")
      ).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Rank"))

    fireEvent.click(await screen.findByTestId("create-goal-include-level"))
    fireEvent.click(screen.getByTestId("create-goal-submit"))

    await vi.waitFor(() => {
      expect(createCombinedGoals).toHaveBeenCalledTimes(1)
    })
    const [request] = createCombinedGoals.mock.calls[0]
    expect(
      request.goals.map((goal: { goalType: string }) => goal.goalType)
    ).toEqual(["Rank"])
  })

  it("shows the selected owned character's shard count, level, ability levels, rank, and progression", async () => {
    getPlayerCharacter.mockResolvedValue({
      rank: "Stone2",
      progressionIndex: "Epic:RedOneStar",
      appliedUpgradeSlots: [],
      xpLevel: 20,
      xp: 100,
      shards: 45,
      mythicShards: 0,
      abilities: [
        { abilityId: "a1", level: 3 },
        { abilityId: "a2", level: 2 },
      ],
    })
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()

    const info = await screen.findByTestId("create-goal-unit-info")
    await vi.waitFor(() => expect(info).toHaveTextContent("45"))
    expect(info).toHaveTextContent("goals.create.info.shards")
    expect(info).toHaveTextContent("20")
    expect(info).toHaveTextContent("3")
    expect(info).toHaveTextContent("2")
    expect(info).toHaveTextContent("Stone2")
    expect(within(info).getByAltText("RedOneStar")).toBeInTheDocument()
  })

  it("shows only the Mythic Shard count once an owned character's progression reaches the Mythic tier", async () => {
    getPlayerCharacter.mockResolvedValue({
      rank: "Adamantine1",
      progressionIndex: "Mythic:OneBlueStar",
      appliedUpgradeSlots: [],
      xpLevel: 55,
      xp: 0,
      shards: 999,
      mythicShards: 12,
      abilities: [],
    })
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()

    const info = await screen.findByTestId("create-goal-unit-info")
    await vi.waitFor(() => expect(info).toHaveTextContent("12"))
    expect(info).toHaveTextContent("goals.create.info.mythicShards")
    expect(info).not.toHaveTextContent("999")
  })

  it("shows only a shard count for a locked character", async () => {
    getPlayerCharacter.mockResolvedValue(undefined)
    getInventoryShard.mockReturnValue({
      unitId: "hero1",
      amount: 7,
      mythicAmount: 0,
    })
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()

    const info = await screen.findByTestId("create-goal-unit-info")
    await vi.waitFor(() => expect(info).toHaveTextContent("7"))
    expect(info).toHaveTextContent("goals.create.info.shards")
    expect(info).not.toHaveTextContent("goals.create.level.current")
    expect(info).not.toHaveTextContent("goals.create.rank.current")
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
      projects: undefined,
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
        {
          projectId: "proj-1",
          name: "My Goals",
          isActivePlan: true,
          isDefault: true,
          status: "Active",
        },
        {
          projectId: "proj-2",
          name: "Event Prep",
          isActivePlan: false,
          isDefault: false,
          status: "Active",
        },
      ],
    })
    createCombinedGoals.mockResolvedValue({ goals: [{ goalId: "goal-1" }] })
    render(<CreateGoalSheet open onOpenChange={vi.fn()} onCreated={vi.fn()} />)

    await selectCharacter()
    fireEvent.click(screen.getByTestId("create-goal-type-toggle-Rank"))
    fireEvent.click(await screen.findByTestId("create-goal-add-project"))
    fireEvent.click(await screen.findByText("Event Prep"))
    await vi.waitFor(() => {
      expect(screen.getByTestId("create-goal-submit")).not.toBeDisabled()
    })
    fireEvent.click(screen.getByTestId("create-goal-submit"))

    await vi.waitFor(() => {
      expect(createCombinedGoals).toHaveBeenCalledTimes(1)
    })
    const [request] = createCombinedGoals.mock.calls[0]
    expect(request.projects).toEqual([
      { projectId: "proj-1" },
      { projectId: "proj-2" },
    ])
  })
})
