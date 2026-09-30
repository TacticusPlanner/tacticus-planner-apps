import { describe, expect, it } from "vitest"
import type { CharacterStorageModel } from "@workspace/game-catalog"
import {
  battleIdSchema,
  campaignIdSchema,
  rankIndex,
  unitIdSchema,
  upgradeIdSchema,
  type Rank,
  type UnitId,
} from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"
import {
  calculateGoalResourceNeed,
  createCraftedInventoryPool,
  createUnitCoverage,
  type Battle,
} from "@/features/goal-farming"
import type {
  Character,
  UpgradeWithFarmLocations,
} from "@/features/rank-lookup"

import { filterUnlockedBattles } from "@/shared/lib"

import catalog from "./__fixtures__/arjac-catalog.json"
import { computePlanInsights } from "./plan-insights-calc"

/**
 * goals-overview-v1-parity 8.1: why is a second Arjac Rank goal's energy 3,224 in V1 but 971 in V2?
 *
 * Two goals for Arjac (`spaceRockfist`): A = Silver1 -> Gold1 (priority 2), B = Silver1 -> Gold2 (priority 4),
 * point-five off, no filters. B contains all of A's slots.
 *
 * DATA. `__fixtures__/arjac-catalog.json` is the served catalog (upgrade views, campaign battles and the
 * character's rank-up ladder for Silver1..Gold2, plus the recipe closure), dumped from the API's own
 * `GameCatalogLoader`. The `v1` golden values below were captured by running V1's real
 * `GoalsService.prepareGoals` -> `UpgradesService.getUpgradesEstimatedDays` -> `GoalsService.buildGoalEstimates`
 * (goalPriority order, 288 daily energy, least-energy strategy, event campaigns off, every standing campaign
 * unlocked) on the same two goals in a temporary spec that was deleted afterwards.
 *
 * FINDING. Per goal the two engines agree: same slots, same material counts, energy within a few percent
 * (V2 A vs V1 A; V2 B run alone vs V1 B). The whole gap is one deliberate difference: V1 charges each goal
 * its full range, so B pays for A's slots again (V1 B = A + extra), while V2 allocates each slot once
 * (`rank-milestone-planning`: "Overlapping Rank progression is allocated once"), so B is charged only for
 * Gold1 -> Gold2. V1 B - V2 B is therefore about the energy of A's gross demand, so the gap grows with the
 * distance from the current rank to Gold1 (bounded by A, not a constant).
 */

const ARJAC = "spaceRockfist"
type BattleRow = [
  string,
  string,
  string,
  boolean,
  number,
  number,
  number,
  number,
  string,
]

/** `standing` keeps only standing campaigns' nodes, which is what V1 farms with campaign events off. */
function catalogData(standing: boolean) {
  const rows = catalog.battles as unknown as BattleRow[]
  const keep = new Set(
    rows.filter((row) => !standing || row[8] !== "event").map((row) => row[0])
  )
  const battlesById = new Map(
    rows
      .filter((row) => keep.has(row[0]))
      .map((row) => [
        battleIdSchema.parse(row[0]),
        {
          id: row[0],
          campaignGroupId: campaignIdSchema.parse(row[1]),
          type: row[2],
          challenge: row[3],
          nodeNumber: row[4],
          battleIndex: row[5],
          energyCost: row[6],
          dailyAttempts: row[7],
        } as unknown as Battle & { id: string },
      ])
  )
  const upgradesById = new Map(
    catalog.upgrades.map((upgrade) => [
      upgradeIdSchema.parse(upgrade.id),
      {
        ...upgrade,
        id: upgradeIdSchema.parse(upgrade.id),
        farmLocations: upgrade.farmLocations.filter((location) =>
          keep.has(location.battleId)
        ),
      } as unknown as UpgradeWithFarmLocations,
    ])
  )
  return { battlesById, upgradesById }
}

const character: Character = {
  id: unitIdSchema.parse(ARJAC),
  name: "Arjac",
  rankUpUpgrades:
    catalog.rankUpUpgrades as unknown as Character["rankUpUpgrades"],
}

function rankGoal(goalId: string, end: Rank): GoalDetail {
  return {
    goalId,
    entityType: "Character",
    entityId: ARJAC,
    goalType: "Rank",
    status: "Active",
    notes: null,
    createdAt: "",
    updatedAt: "",
    globalPriority: 1,
    config: {
      rank: {
        start: rankIndex("Silver1"),
        startPointFive: false,
        startAppliedUpgrades: 0,
        end: rankIndex(end),
        endPointFive: false,
        endAppliedUpgrades: 0,
      },
      progression: null,
      ability: null,
      farmingStrategy: "TotalUpgrades",
      acquisitionSources: null,
      farmingLocationIds: null,
      upgrade: null,
    },
    snapshot: null,
    events: [],
    dependsOn: [],
    projectIds: [],
    revision: 1,
  } as unknown as GoalDetail
}

type GoalSpec = [goalId: string, end: Rank, priority: number]
const A: GoalSpec = ["A", "Gold1", 2]
const B: GoalSpec = ["B", "Gold2", 4]

type Scenario = {
  rank: Rank
  /** Slot indices already applied at the current rank. */
  applied?: number[]
  standing?: boolean
  /** Highest completed battle index on every standing track; absent = every campaign unlocked. */
  progressCap?: number
  inventory?: Record<string, number>
  goals: GoalSpec[]
}

type GoalOutcome = {
  slots: number
  standaloneSlots: number
  materials: number
  energy: number
  standalone: { slots: number; energy: number } | undefined
  levelChainedFrom: number | undefined
  levelChargedXp: number | undefined
}

/** The real planning path: per-goal need (shared slot coverage, like `computePlanInsights`) and the
 *  plan-wide energy estimate. Slots/materials are the goal's own charge after overlap allocation. */
function simulate({
  rank,
  applied = [],
  standing = true,
  progressCap,
  inventory = {},
  goals,
}: Scenario) {
  const catalogBattles = catalogData(standing)
  const { upgradesById } = catalogBattles
  const battlesById =
    progressCap === undefined
      ? catalogBattles.battlesById
      : filterUnlockedBattles(
          catalogBattles.battlesById,
          [
            ...new Set(
              [...catalogBattles.battlesById.values()].map(
                (b) => `${b.campaignGroupId}:${b.type}`
              )
            ),
          ].map((key) => ({
            tacticusCampaignId: key.split(":")[0]!,
            type: key.split(":")[1]!,
            highestCompletedBattleIndex: progressCap,
          })),
          new Set()
        )
  const details = goals.map(([goalId, end]) => rankGoal(goalId, end))
  const player = new Map([
    [
      ARJAC,
      {
        rank,
        appliedUpgradeSlots: applied,
        progressionIndex: "Legendary:RedThreeStars",
        level: 33,
        xpLevel: 33,
        xp: 0,
      } as never,
    ],
  ])
  const inventoryUpgrades = Object.entries(inventory).map(
    ([upgradeId, amount]) => ({ upgradeId, amount })
  )

  const result = computePlanInsights({
    details,
    priorityByGoalId: new Map(
      goals.map(([goalId, , priority]) => [goalId, priority])
    ),
    playerCharacterById: player,
    playerMowById: new Map(),
    inventoryShardById: new Map(),
    inventoryUpgrades,
    upgradesById,
    battlesById,
    charactersById: new Map([
      [
        ARJAC,
        {
          id: ARJAC,
          name: "Arjac",
          initialRarity: "Rare",
          alliance: "Imperial",
          shardLocations: [],
        } as unknown as CharacterStorageModel,
      ],
    ]),
    mowsById: new Map(),
    ascensionCostsById: new Map(),
    unlockShardCostsById: new Map(),
    releaseTypeByGroupId: new Map(),
    getCharacter: (id: UnitId) => (id === character.id ? character : undefined),
    campaignName: (descriptor) => descriptor.nameKey,
    campaignFullLabel: (descriptor) => descriptor.nameKey,
  })

  const coverage = createUnitCoverage()
  const pool = createCraftedInventoryPool(inventoryUpgrades, upgradesById)
  const materials = details.map((detail) => {
    const need = calculateGoalResourceNeed({
      detail,
      character,
      playerCharacter: player.get(ARJAC),
      upgradesById,
      ascensionCostsById: new Map(),
      unlockShardCostsById: new Map(),
      coveredAbilityTransitions: coverage,
      coveredRankSlots: coverage.rankSlots,
      craftedInventory: pool,
    } as never)
    return need?.upgrades.reduce((sum, upgrade) => sum + upgrade.count, 0) ?? 0
  })

  const energyOf = (goalId: string) => {
    const outcome = result.estimates.get(goalId)
    return outcome?.status === "Estimated" ? outcome.energyTotal : 0
  }
  const byGoal: Record<string, GoalOutcome> = {}
  goals.forEach(([goalId], index) => {
    byGoal[goalId] = {
      slots: result.rankSlotsByGoalId.get(goalId)?.allocated ?? 0,
      standaloneSlots: result.rankSlotsByGoalId.get(goalId)?.standalone ?? 0,
      materials: materials[index] ?? 0,
      energy: energyOf(goalId),
      standalone: result.planNetByGoalId.get(goalId)?.standalone,
      levelChainedFrom: result.planNetByGoalId.get(goalId)?.levelChainedFrom,
      levelChargedXp: result.levelChargedXpByGoalId.get(goalId),
    }
  })
  return { energyTotal: result.energyTotal, goals: byGoal }
}

const within = (actual: number, golden: number, tolerance: number) =>
  expect(Math.abs(actual - golden)).toBeLessThanOrEqual(golden * tolerance)

/** Empty inventory, every standing campaign unlocked. V1 `slots`/`materials` are the goal's own charge, which
 *  for V1 is always the whole standalone range (no cross-goal overlap logic). */
const EMPTY_INVENTORY_CASES = [
  {
    label: "current rank Silver1",
    rank: "Silver1" as Rank,
    applied: [] as number[],
    v1: {
      a: { slots: 18, materials: 369, energy: 2976 },
      b: { slots: 24, materials: 592, energy: 4704 },
      total: 7680,
    },
    v2: { aEnergy: 2990, bEnergy: 1995, bAloneEnergy: 4915, total: 4985 },
  },
  {
    label: "current rank Silver3",
    rank: "Silver3" as Rank,
    applied: [] as number[],
    v1: {
      a: { slots: 6, materials: 179, energy: 1437 },
      b: { slots: 12, materials: 402, energy: 3274 },
      total: 4711,
    },
    v2: { aEnergy: 1445, bEnergy: 1995, bAloneEnergy: 3410, total: 3440 },
  },
  {
    label: "current rank Silver3 with 2 slots applied (A = 4 slots)",
    rank: "Silver3" as Rank,
    applied: [0, 1],
    v1: {
      a: { slots: 4, materials: 101, energy: 811 },
      b: { slots: 10, materials: 324, energy: 2716 },
      total: 3527,
    },
    v2: { aEnergy: 815, bEnergy: 1995, bAloneEnergy: 2800, total: 2810 },
  },
]

describe("Arjac Silver1->Gold1 (A) and Silver1->Gold2 (B): V1 vs V2 Rank planning", () => {
  describe.each(EMPTY_INVENTORY_CASES)(
    "$label, empty inventory",
    ({ rank, applied, v1, v2 }) => {
      const plan = simulate({ rank, applied, goals: [A, B] })
      const aAlone = simulate({ rank, applied, goals: [A] })
      const bAlone = simulate({ rank, applied, goals: [B] })

      it("need level: V2's standalone goals match V1's slots and material counts exactly", () => {
        expect(aAlone.goals.A?.slots).toBe(v1.a.slots)
        expect(aAlone.goals.A?.materials).toBe(v1.a.materials)
        expect(bAlone.goals.B?.slots).toBe(v1.b.slots)
        expect(bAlone.goals.B?.materials).toBe(v1.b.materials)
      })

      it("need level: V2 charges B only what A does not cover; V1 charges B the whole range again", () => {
        expect(plan.goals.A?.slots).toBe(v1.a.slots)
        expect(plan.goals.A?.materials).toBe(v1.a.materials)
        // Gold1 -> Gold2 is 6 slots / 223 materials whatever the current rank is.
        expect(plan.goals.B?.slots).toBe(6)
        expect(plan.goals.B?.materials).toBe(223)
        expect(plan.goals.B?.standaloneSlots).toBe(v1.b.slots)
        // What V1 double-charges is exactly goal A's own charge.
        expect(v1.b.slots - (plan.goals.B?.slots ?? 0)).toBe(v1.a.slots)
        expect(v1.b.materials - (plan.goals.B?.materials ?? 0)).toBe(
          v1.a.materials
        )
      })

      it("energy: the engines agree per goal when nothing overlaps (A, and B run alone)", () => {
        expect(plan.goals.A?.energy).toBe(v2.aEnergy)
        within(plan.goals.A?.energy ?? 0, v1.a.energy, 0.02)
        expect(bAlone.goals.B?.energy).toBe(v2.bAloneEnergy)
        within(bAlone.goals.B?.energy ?? 0, v1.b.energy, 0.06)
      })

      it("energy: V2's B is only the Gold1 -> Gold2 marginal cost; V1's B carries A's demand again", () => {
        expect(plan.goals.B?.energy).toBe(v2.bEnergy)
        expect(plan.energyTotal).toBe(v2.total)
        // V1 total = A + B(full range); V2 total = A + B(extra only).
        expect(v1.total).toBe(v1.a.energy + v1.b.energy)
        within(v1.total - plan.energyTotal, v1.a.energy, 0.2)
      })
    }
  )

  describe("with stock: current rank Silver2, inventory = 70% of B's gross base need (closest fit found)", () => {
    // The same inventory was fed to both engines. V1 goldens: A 406, B 3,446, total 3,852. The account's real
    // inventory is not available, so this stands in for it; the shape (A about equal, B about 3x apart, gap
    // about 2.2k) is what the real account shows (V1 421 / 3,224, V2 431 / 971).
    const inventory: Record<string, number> = {
      upgHpR031: 18,
      upgHpR018: 2,
      upgDmgC014: 2,
      upgHpR002: 8,
      upgArmC002: 16,
      upgArmU001: 22,
      upgDmgR031: 31,
      upgArmR031: 31,
      upgArmE010: 2,
      upgHpL111: 6,
      upgHpE003: 7,
      upgDmgU012: 8,
      upgHpE017: 1,
      upgHpU012: 7,
      upgArmC003: 5,
      upgHpC013: 2,
      upgDmgU003: 21,
      upgArmC001: 21,
      upgHpC016: 18,
      upgHpR005: 8,
      upgHpU007: 8,
      upgHpU016: 7,
      upgDmgC013: 7,
      upgDmgC010: 12,
      upgArmR015: 8,
      upgArmU005: 8,
      upgDmgR006: 4,
      upgHpU014: 4,
      upgArmU008: 7,
      upgArmR006: 5,
      upgArmC011: 5,
      upgDmgC011: 16,
      upgDmgC003: 8,
      upgHpC002: 4,
      upgDmgU010: 7,
      upgArmC012: 5,
      upgDmgC007: 2,
    }
    const v1 = { a: 406, b: 3446, total: 3852 }
    const plan = simulate({ rank: "Silver2", inventory, goals: [A, B] })

    it("A matches V1; B is about a third of V1's; the gap is the overlap", () => {
      expect(plan.goals.A?.energy).toBe(410)
      within(plan.goals.A?.energy ?? 0, v1.a, 0.02)
      expect(plan.goals.B?.energy).toBe(1185)
      expect(v1.b - (plan.goals.B?.energy ?? 0)).toBeGreaterThan(2000)
      expect(plan.energyTotal).toBe(1595)
      expect(v1.total).toBe(v1.a + v1.b)
    })

    it("B's charge stays 6 slots however much stock there is; only its energy shrinks", () => {
      expect(plan.goals.A?.slots).toBe(12)
      expect(plan.goals.B?.slots).toBe(6)
    })
  })

  describe("node selection is not the cause", () => {
    it("using every node, event campaigns included (V2 today), moves a goal's energy by under 3% vs standing campaigns only (V1 default)", () => {
      const standing = simulate({ rank: "Silver3", goals: [A, B] })
      const everyNode = simulate({
        rank: "Silver3",
        standing: false,
        goals: [A, B],
      })
      expect(everyNode.goals.A?.energy).toBe(1427)
      expect(everyNode.goals.B?.energy).toBe(1985)
      within(
        everyNode.goals.A?.energy ?? 0,
        standing.goals.A?.energy ?? 0,
        0.03
      )
      within(
        everyNode.goals.B?.energy ?? 0,
        standing.goals.B?.energy ?? 0,
        0.03
      )
    })
  })

  describe("priority order decides which goal carries the overlap (rank-milestone-planning)", () => {
    it("with B ahead of A, B carries the whole range and A is wholly covered", () => {
      const plan = simulate({
        rank: "Silver3",
        goals: [
          ["A", "Gold1", 4],
          ["B", "Gold2", 2],
        ],
      })
      expect(plan.goals.B?.standaloneSlots).toBe(12)
      expect(plan.goals.B?.slots).toBe(12)
      expect(plan.goals.A?.slots).toBe(0)
      expect(plan.goals.A?.energy).toBe(0)
      expect(plan.goals.B?.energy).toBe(3410)
    })
  })
})

describe("campaign progress gates the farm nodes (goals-overview-v1-parity 8.5)", () => {
  it("costs more energy when the cheaper, later nodes are still locked", () => {
    const open = simulate({ rank: "Silver1", goals: [A] })
    const partial = simulate({ rank: "Silver1", progressCap: 30, goals: [A] })
    expect(open.goals.A?.energy).toBe(2990)
    expect(partial.goals.A?.energy).toBe(3070)
  })

  it("blocks the goal (no energy attributed) when a needed material has no unlocked node", () => {
    const early = simulate({ rank: "Silver1", progressCap: 10, goals: [A] })
    expect(early.goals.A?.energy).toBe(0)
    expect(early.energyTotal).toBe(0)
  })
})

describe("standalone figures for a partly covered Rank goal (goals-overview-v1-parity 8.9)", () => {
  const plan = simulate({ rank: "Silver3", goals: [A, B] })
  const bAlone = simulate({ rank: "Silver3", goals: [B] })

  it("B, partly covered by A, carries its own standalone slots and energy", () => {
    expect(plan.goals.B?.slots).toBe(6)
    expect(plan.goals.B?.standalone).toEqual({
      slots: 12,
      energy: bAlone.goals.B?.energy,
    })
    // The chip keeps the marginal figure, well below the standalone one.
    expect(plan.goals.B?.energy).toBeLessThan(
      plan.goals.B?.standalone?.energy ?? 0
    )
  })

  it("A, with no overlap, and a goal alone expose no standalone figures", () => {
    expect(plan.goals.A?.standalone).toBeUndefined()
    expect(bAlone.goals.B?.standalone).toBeUndefined()
  })
})

describe("chained level requirement (goals-overview-v1-parity 8.10)", () => {
  const plan = simulate({ rank: "Silver3", goals: [A, B] })
  const aLevel = plan.goals.A?.levelChargedXp
  const bLevel = plan.goals.B?.levelChargedXp

  it("the first goal reads from the current level; the second chains from the first's required level", () => {
    expect(plan.goals.A?.levelChainedFrom).toBeUndefined()
    expect(plan.goals.B?.levelChainedFrom).toBeGreaterThan(33)
  })

  it("the second goal is charged only the XP beyond the first's interval", () => {
    expect(aLevel).toBeGreaterThan(0)
    expect(bLevel).toBeGreaterThan(0)
    const alone = simulate({ rank: "Silver3", goals: [B] })
    expect((aLevel ?? 0) + (bLevel ?? 0)).toBe(alone.goals.B?.levelChargedXp)
  })
})
