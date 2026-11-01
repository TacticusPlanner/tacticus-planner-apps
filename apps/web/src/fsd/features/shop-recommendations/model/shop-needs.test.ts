import { describe, expect, it } from "vitest"
import { unitIdSchema, upgradeIdSchema } from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"
import type {
  FarmingCharacter,
  FarmingUpgrade,
} from "@/features/goal-farming/@x/shop-recommendations"

import { aggregateShopNeeds, type AggregateShopNeedsParams } from "./shop-needs"

const heroId = unitIdSchema.parse("eldarFarseer")
const otherId = unitIdSchema.parse("eldarAutarch")
const mythicMatId = upgradeIdSchema.parse("upgHpM001")

const mythicMaterial: FarmingUpgrade = {
  id: mythicMatId,
  label: "Imperial Aquila",
  rarity: "Mythic",
  stat: "health",
  crafted: false,
  recipe: [],
  farmLocations: [],
}

const rankCharacter: FarmingCharacter = {
  id: heroId,
  name: "Farseer",
  rankUpUpgrades: [
    {
      rank: "Stone1",
      upgradeIds: [
        mythicMatId,
        mythicMatId,
        mythicMatId,
        mythicMatId,
        mythicMatId,
        mythicMatId,
      ],
    },
  ],
}

const stoneOneToTwo = {
  start: 0,
  startPointFive: false,
  startAppliedUpgrades: 0,
  end: 1,
  endPointFive: false,
  endAppliedUpgrades: 0,
}

function member(
  goalId: string,
  entityId: string,
  goalType: GoalDetail["goalType"],
  status: GoalDetail["status"],
  priority = 1
): { goal: GoalDetail } {
  return {
    goal: {
      goalId,
      entityType: "Character",
      entityId,
      goalType,
      status,
      notes: null,
      dependsOn: [],
      createdAt: "",
      updatedAt: "",
      globalPriority: priority,
      config: {} as GoalDetail["config"],
      snapshot: null,
      projectIds: [],
      revision: 1,
    },
  }
}

function detail(
  goalId: string,
  entityId: string,
  goalType: string,
  config: Partial<GoalDetail["config"]> = {}
): GoalDetail {
  return {
    goalId,
    entityType: "Character",
    entityId,
    goalType,
    status: "Active",
    config: { rank: null, progression: null, ability: null, ...config },
  } as GoalDetail
}

function baseParams(
  overrides: Partial<AggregateShopNeedsParams>
): AggregateShopNeedsParams {
  return {
    members: [],
    details: [],
    playerCharacterById: new Map(),
    playerMowById: new Map(),
    inventoryShardById: new Map(),
    inventoryUpgradeAmountById: new Map(),
    upgradesById: new Map(),
    charactersById: new Map(),
    mowsById: new Map(),
    ascensionCostsById: new Map(),
    unlockShardCostsById: new Map(),
    getCharacter: () => undefined,
    getUnitLabel: (goalDetail) =>
      goalDetail.entityId === heroId ? "Farseer" : "Autarch",
    ...overrides,
  }
}

describe("aggregateShopNeeds", () => {
  it("aggregates an Unlock goal's outstanding character-shard need", () => {
    const needs = aggregateShopNeeds(
      baseParams({
        members: [member("g1", heroId, "Unlock", "Active")],
        details: [detail("g1", heroId, "Unlock")],
        charactersById: new Map([
          [
            heroId,
            { id: heroId, name: "Farseer", initialRarity: "Rare" } as never,
          ],
        ]),
        unlockShardCostsById: new Map([
          ["Rare", { rarity: "Rare", shards: 130 } as never],
        ]),
        inventoryShardById: new Map([[heroId, { amount: 30 } as never]]),
      })
    )

    expect(needs.get("shards_eldarFarseer")).toEqual({
      acquired: 30,
      required: 130,
      neededBy: [{ unitId: heroId, unitName: "Farseer", count: 100 }],
    })
  })

  it("derives no shard need for an already-owned Unlock goal (fix-goal-progress-consistency)", () => {
    const needs = aggregateShopNeeds(
      baseParams({
        members: [member("g1", heroId, "Unlock", "Active")],
        details: [detail("g1", heroId, "Unlock")],
        charactersById: new Map([
          [
            heroId,
            { id: heroId, name: "Farseer", initialRarity: "Rare" } as never,
          ],
        ]),
        unlockShardCostsById: new Map([
          ["Rare", { rarity: "Rare", shards: 130 } as never],
        ]),
        inventoryShardById: new Map([[heroId, { amount: 30 } as never]]),
        playerCharacterById: new Map([[heroId, { unitId: heroId } as never]]),
      })
    )

    expect(needs.has("shards_eldarFarseer")).toBe(false)
  })

  it("aggregates a Rank goal's mythic uncraftable upgrade-material need", () => {
    const needs = aggregateShopNeeds(
      baseParams({
        members: [member("g2", heroId, "Rank", "Active")],
        details: [
          detail("g2", heroId, "Rank", {
            rank: {
              start: 0,
              startPointFive: false,
              startAppliedUpgrades: 0,
              end: 1,
              endPointFive: false,
              endAppliedUpgrades: 0,
            },
          }),
        ],
        getCharacter: () => rankCharacter,
        upgradesById: new Map([[mythicMatId, mythicMaterial]]),
      })
    )

    const need = needs.get("upgHpM001")
    expect(need).toBeDefined()
    expect(need!.required).toBeGreaterThan(0)
    expect(need!.acquired).toBe(0)
    expect(need!.neededBy[0]?.unitId).toBe(heroId)
  })

  it("nets a mythic-material need against owned inventory", () => {
    const needs = aggregateShopNeeds(
      baseParams({
        members: [member("g2", heroId, "Rank", "Active")],
        details: [
          detail("g2", heroId, "Rank", {
            rank: {
              start: 0,
              startPointFive: false,
              startAppliedUpgrades: 0,
              end: 1,
              endPointFive: false,
              endAppliedUpgrades: 0,
            },
          }),
        ],
        getCharacter: () => rankCharacter,
        upgradesById: new Map([[mythicMatId, mythicMaterial]]),
        inventoryUpgradeAmountById: new Map([["upgHpM001", 2]]),
      })
    )

    // The rank need is gross (6 slots), so owned stock counts toward it rather than on top of it.
    expect(needs.get("upgHpM001")).toEqual({
      acquired: 2,
      required: 6,
      neededBy: [{ unitId: heroId, unitName: "Farseer", count: 6 }],
    })
  })

  it("reads a mythic-material need as met when owned stock covers it", () => {
    const needs = aggregateShopNeeds(
      baseParams({
        members: [member("g2", heroId, "Rank", "Active")],
        details: [detail("g2", heroId, "Rank", { rank: stoneOneToTwo })],
        getCharacter: () => rankCharacter,
        upgradesById: new Map([[mythicMatId, mythicMaterial]]),
        inventoryUpgradeAmountById: new Map([["upgHpM001", 6]]),
      })
    )

    const need = needs.get("upgHpM001")!
    expect(need.acquired).toBe(6)
    expect(need.required).toBe(6)
  })

  it("counts owned mythic-material stock once across goals for different units", () => {
    const otherCharacter: FarmingCharacter = { ...rankCharacter, id: otherId }
    const needs = aggregateShopNeeds(
      baseParams({
        members: [
          member("g1", heroId, "Rank", "Active"),
          member("g2", otherId, "Rank", "Active"),
        ],
        details: [
          detail("g1", heroId, "Rank", { rank: stoneOneToTwo }),
          detail("g2", otherId, "Rank", { rank: stoneOneToTwo }),
        ],
        getCharacter: (unitId) =>
          unitId === heroId ? rankCharacter : otherCharacter,
        upgradesById: new Map([[mythicMatId, mythicMaterial]]),
        inventoryUpgradeAmountById: new Map([["upgHpM001", 6]]),
      })
    )

    expect(needs.get("upgHpM001")).toEqual({
      acquired: 6,
      required: 12,
      neededBy: [
        { unitId: heroId, unitName: "Farseer", count: 6 },
        { unitId: otherId, unitName: "Autarch", count: 6 },
      ],
    })
  })

  it("keeps owned shards a later Unlock goal supplies after an Ascension goal for the same unit", () => {
    const needs = aggregateShopNeeds(
      baseParams({
        members: [
          member("g1", heroId, "Ascension", "Active"),
          member("g2", heroId, "Unlock", "Active"),
        ],
        details: [
          detail("g1", heroId, "Ascension", {
            progression: {
              start: "Common:None",
              end: "Common:OneStar",
            } as never,
          }),
          detail("g2", heroId, "Unlock"),
        ],
        charactersById: new Map([
          [
            heroId,
            { id: heroId, name: "Farseer", initialRarity: "Rare" } as never,
          ],
        ]),
        ascensionCostsById: new Map([
          ["Common:OneStar", { shards: 20, mythicShards: 0, orbs: 0 } as never],
        ]),
        unlockShardCostsById: new Map([
          ["Rare", { rarity: "Rare", shards: 130 } as never],
        ]),
        inventoryShardById: new Map([[heroId, { amount: 30 } as never]]),
      })
    )

    // Ascension (20, seeded with 0 owned) + Unlock (130 less the 30 inventory shards).
    expect(needs.get("shards_eldarFarseer")).toEqual({
      acquired: 30,
      required: 150,
      neededBy: [
        { unitId: heroId, unitName: "Farseer", count: 20 },
        { unitId: heroId, unitName: "Farseer", count: 100 },
      ],
    })
  })

  it("ignores goals that are not Active", () => {
    const needs = aggregateShopNeeds(
      baseParams({
        members: [
          member("g1", heroId, "Unlock", "Active"),
          member("g3", otherId, "Unlock", "Paused"),
          member("g4", otherId, "Unlock", "Completed"),
          member("g5", otherId, "Unlock", "Archived"),
        ],
        details: [
          detail("g1", heroId, "Unlock"),
          detail("g3", otherId, "Unlock"),
          detail("g4", otherId, "Unlock"),
          detail("g5", otherId, "Unlock"),
        ],
        charactersById: new Map([
          [
            heroId,
            { id: heroId, name: "Farseer", initialRarity: "Rare" } as never,
          ],
          [
            otherId,
            { id: otherId, name: "Autarch", initialRarity: "Rare" } as never,
          ],
        ]),
        unlockShardCostsById: new Map([
          ["Rare", { rarity: "Rare", shards: 130 } as never],
        ]),
        inventoryShardById: new Map([
          [heroId, { amount: 30 } as never],
          [otherId, { amount: 0 } as never],
        ]),
      })
    )

    expect(needs.has("shards_eldarFarseer")).toBe(true)
    expect(needs.has("shards_eldarAutarch")).toBe(false)
  })
})
