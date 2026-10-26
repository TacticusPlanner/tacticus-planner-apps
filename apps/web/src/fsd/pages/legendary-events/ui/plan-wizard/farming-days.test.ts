import { describe, expect, it, vi } from "vitest"
import type {
  AscensionCostStorageModel,
  CharacterStorageModel,
  UnlockShardCostStorageModel,
} from "@workspace/game-catalog"
import {
  battleIdSchema,
  campaignIdSchema,
  rankIndex,
  unitIdSchema,
  upgradeIdSchema,
  type UnitId,
} from "@workspace/game-domain"

import type { LegendaryEventRosterUnit } from "@/entities/legendary-event"
import type { Battle, FarmingCharacter } from "@/features/goal-farming"
import type { UpgradeWithFarmLocations } from "@/features/rank-lookup"

import {
  createFarmingDaysEstimator,
  upgradeChainGoalSpecs,
  type FarmingDaysInputs,
} from "./farming-days"

const unitId = unitIdSchema.parse
const upgradeId = upgradeIdSchema.parse
const battleId = battleIdSchema.parse

const owned = (
  overrides: Partial<LegendaryEventRosterUnit> = {}
): LegendaryEventRosterUnit => ({
  unitId: unitId("hero1"),
  rank: "Stone1",
  progressionIndex: "Common:OneStar",
  ...overrides,
})

describe("upgradeChainGoalSpecs", () => {
  it("chains Unlock, Ascension and Rank for an unowned unit, each depending on the earlier ones", () => {
    const specs = upgradeChainGoalSpecs(
      {
        unitId: "hero1",
        from: undefined,
        progressionEnd: "Rare:FourStars",
        rankEnd: "Iron1",
      },
      "Uncommon:TwoStars"
    )

    expect(specs).toEqual([
      { goalType: "Unlock", config: {}, dependsOnIndex: [] },
      {
        goalType: "Ascension",
        config: {
          progression: { start: "Uncommon:TwoStars", end: "Rare:FourStars" },
        },
        dependsOnIndex: [0],
      },
      {
        goalType: "Rank",
        config: {
          farmingStrategy: "TotalUpgrades",
          rank: {
            start: 0,
            startPointFive: false,
            startAppliedUpgrades: 0,
            end: rankIndex("Iron1"),
            endPointFive: false,
            endAppliedUpgrades: 0,
          },
        },
        dependsOnIndex: [0, 1],
      },
    ])
  })

  it("starts an owned unit's chain at its current rank and progression", () => {
    const specs = upgradeChainGoalSpecs({
      unitId: "hero1",
      from: owned({ rank: "Bronze1", progressionIndex: "Rare:FourStars" }),
      progressionEnd: "Epic:RedOneStar",
      rankEnd: "Silver1",
    })

    expect(specs.map((spec) => spec.goalType)).toEqual(["Ascension", "Rank"])
    expect(specs[0]?.config.progression).toEqual({
      start: "Rare:FourStars",
      end: "Epic:RedOneStar",
    })
    expect(specs[0]?.dependsOnIndex).toEqual([])
    expect(specs[1]?.config.rank?.start).toBe(rankIndex("Bronze1"))
    expect(specs[1]?.dependsOnIndex).toEqual([0])
  })

  it("skips targets that are not above the current state", () => {
    expect(
      upgradeChainGoalSpecs({
        unitId: "hero1",
        from: owned({ rank: "Iron1" }),
        progressionEnd: "Common:OneStar",
        rankEnd: "Stone3",
      })
    ).toEqual([])
    expect(
      upgradeChainGoalSpecs({
        unitId: "hero1",
        from: owned(),
        rankEnd: "Stone2",
      }).map((spec) => spec.dependsOnIndex)
    ).toEqual([[]])
  })
})

describe("createFarmingDaysEstimator", () => {
  const character: FarmingCharacter = {
    id: unitId("hero1"),
    name: "Hero One",
    rankUpUpgrades: [
      { rank: "Stone1", upgradeIds: Array(6).fill(upgradeId("mat1")) },
    ],
  }
  const characterView = {
    id: "hero1",
    name: "Hero One",
    initialRarity: "Common",
    alliance: "Xenos",
    shardLocations: [{ battleId: "S1", guaranteed: true }],
  } as unknown as CharacterStorageModel

  const upgrade: UpgradeWithFarmLocations = {
    id: upgradeId("mat1"),
    label: "Material One",
    rarity: "Common",
    stat: "health",
    crafted: false,
    recipe: [],
    farmLocations: [
      {
        battleId: battleId("B1"),
        guaranteed: true,
        numerator: null,
        denominator: null,
        effectiveRate: null,
        isMythic: false,
      },
    ],
  }

  const battle: Battle = {
    campaignGroupId: campaignIdSchema.parse("campaign1"),
    type: "Normal",
    challenge: false,
    nodeNumber: 1,
    battleIndex: 0,
    energyCost: 10,
    dailyAttempts: 1,
  }

  const inputs = (
    overrides: Partial<FarmingDaysInputs> = {}
  ): FarmingDaysInputs => ({
    charactersById: new Map([["hero1", characterView]]),
    getCharacter: (id: UnitId) => (id === character.id ? character : undefined),
    upgradesById: new Map([[upgrade.id, upgrade]]),
    battlesById: new Map([
      [battleId("B1"), battle],
      [battleId("S1"), battle],
    ]),
    ascensionCostsById: new Map<string, AscensionCostStorageModel>(),
    unlockShardCostsById: new Map<string, UnlockShardCostStorageModel>([
      ["Common", { id: "Common", shards: 3 } as UnlockShardCostStorageModel],
    ]),
    playerCharacterById: new Map(),
    inventoryShardById: new Map(),
    inventoryUpgrades: [],
    dailyEnergy: 288,
    referenceDate: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  })

  const rankUp = { unitId: "hero1", from: owned(), rankEnd: "Stone2" } as const

  it("estimates a Rank chain from the farmable materials", () => {
    const result = createFarmingDaysEstimator(inputs())(rankUp)

    // Six guaranteed drops at one raid a day, the completion day counted inclusively.
    expect(result).toEqual({ days: 6, date: "2026-01-06" })
  })

  it("nets the account's inventory before farming", () => {
    const estimate = createFarmingDaysEstimator(
      inputs({ inventoryUpgrades: [{ upgradeId: "mat1", amount: 6 }] })
    )

    expect(estimate(rankUp)).toEqual({ days: 0, date: "2026-01-01" })
  })

  it("adds the unlock to an unowned unit's chain", () => {
    const estimate = createFarmingDaysEstimator(inputs())
    const ranked = estimate({ ...rankUp, from: undefined })
    const unlocked = estimate({ unitId: "hero1", from: undefined })

    expect(unlocked?.days).toBeGreaterThan(0)
    expect(ranked?.days).toBeGreaterThanOrEqual(unlocked?.days ?? Infinity)
  })

  it("returns no days for a chain with nothing to do", () => {
    const estimate = createFarmingDaysEstimator(inputs())

    expect(estimate({ unitId: "hero1", from: owned() })).toEqual({
      days: 0,
      date: "2026-01-01",
    })
  })

  it("returns null when a need has no farmable node or the unit is unknown", () => {
    const estimate = createFarmingDaysEstimator(
      inputs({ battlesById: new Map() })
    )

    expect(estimate(rankUp)).toBeNull()
    expect(
      createFarmingDaysEstimator(inputs())({ ...rankUp, unitId: "nobody" })
    ).toBeNull()
  })

  it("memoizes results by request", () => {
    const getCharacter = vi.fn(inputs().getCharacter)
    const estimate = createFarmingDaysEstimator(inputs({ getCharacter }))

    const first = estimate(rankUp)
    const calls = getCharacter.mock.calls.length
    const second = estimate({ ...rankUp, from: owned() })

    expect(second).toBe(first)
    expect(getCharacter).toHaveBeenCalledTimes(calls)
  })
  it("gives each request the same estimate whether or not it reuses the shared maps", () => {
    const requests = [
      rankUp,
      { ...rankUp, from: undefined },
      { unitId: "hero1", from: undefined },
      { unitId: "hero1", from: owned() },
    ] as const
    const shared = createFarmingDaysEstimator(inputs())

    for (const request of requests) {
      expect(shared(request)).toEqual(
        createFarmingDaysEstimator(inputs())(request)
      )
    }
  })
})
