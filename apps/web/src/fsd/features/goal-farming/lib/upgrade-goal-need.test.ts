import { describe, expect, it } from "vitest"
import { unitIdSchema, upgradeIdSchema } from "@workspace/game-domain"
import type { MowStorageModel } from "@workspace/game-catalog"

import type { GoalDetail } from "@/entities/goal"

import type { FarmingCharacter, FarmingUpgrade } from "../model/estimate.domain"
import {
  calculateGoalResourceNeed,
  createUnitCoverage,
} from "./goal-requirements"

const armor = upgradeIdSchema.parse("upgArmC002")
const damage = upgradeIdSchema.parse("upgDmgC002")
const other = upgradeIdSchema.parse("upgOther")
const upgradesById = new Map(
  [armor, damage, other].map((id) => [
    id,
    {
      id,
      label: id,
      rarity: "Common",
      stat: "health",
      crafted: false,
      recipe: [],
      farmLocations: [],
    } as FarmingUpgrade,
  ])
)

// Incisus: Stone1 and Stone2 rank-ups each hold one `upgArmC002`; Stone3 holds none.
const character: FarmingCharacter = {
  id: unitIdSchema.parse("ultraApothecary"),
  name: "Incisus",
  rankUpUpgrades: [
    { rank: "Stone1", upgradeIds: [armor, other] },
    { rank: "Stone2", upgradeIds: [armor, other] },
    { rank: "Stone3", upgradeIds: [other] },
  ],
}

// Astra Ordnance Battery primary track: rows 0 and 3 hold `upgDmgC002`, rows 1 and 2 none.
const mow = {
  primaryAbility: { recipes: [[damage], [other], [other], [damage]] },
  secondaryAbility: { recipes: [[other], [other]] },
} as unknown as MowStorageModel

const rankGoal = (end: number) =>
  ({
    goalType: "Rank",
    entityType: "Character",
    entityId: "ultraApothecary",
    config: {
      farmingStrategy: "TotalUpgrades",
      rank: {
        start: 0,
        startPointFive: false,
        startAppliedUpgrades: 0,
        end,
        endPointFive: false,
        endAppliedUpgrades: 0,
      },
    },
  }) as GoalDetail

const upgradeGoal = (
  entityType: "Character" | "Mow",
  upgrade: NonNullable<GoalDetail["config"]["upgrade"]>
) =>
  ({
    goalType: "Upgrade",
    entityType,
    entityId: entityType === "Mow" ? "astraOrdnanceBattery" : "ultraApothecary",
    config: { farmingStrategy: "TotalUpgrades", upgrade },
  }) as GoalDetail

const abilityGoal = (activeEnd: number) =>
  ({
    goalType: "Ability",
    entityType: "Mow",
    entityId: "astraOrdnanceBattery",
    config: {
      farmingStrategy: "TotalUpgrades",
      ability: { activeStart: 1, activeEnd, passiveStart: 1, passiveEnd: 1 },
    },
  }) as GoalDetail

type Coverage = ReturnType<typeof createUnitCoverage>
const need = (
  detail: GoalDetail,
  coverage: Coverage = createUnitCoverage(),
  playerCharacter?: unknown
) =>
  calculateGoalResourceNeed({
    detail,
    character,
    characterView: undefined,
    mow,
    playerCharacter: playerCharacter as never,
    playerMow: undefined,
    inventoryShard: undefined,
    upgradesById,
    ascensionCostsById: new Map(),
    unlockShardCostsById: new Map(),
    coveredAbilityTransitions: coverage,
    coveredRankSlots: coverage.rankSlots,
  })

const count = (result: ReturnType<typeof need>, id = armor) =>
  result?.upgrades.find((entry) => entry.id === id)?.count ?? 0

const characterUpgrade = (quantity: number, range = { start: 1, end: 3 }) =>
  upgradeGoal("Character", {
    targets: [{ upgradeId: armor, quantity }],
    rankRange: range,
  })

describe("Upgrade goal need", () => {
  it("is the targets as base upgrades with no stages or slots", () => {
    const result = need(
      upgradeGoal("Character", { targets: [{ upgradeId: armor, quantity: 5 }] })
    )
    expect(result?.upgrades).toEqual([{ id: armor, count: 5 }])
    expect(result?.upgradeSlotsRemaining).toBeNull()
  })

  it("is null with no targets", () => {
    expect(need(upgradeGoal("Character", { targets: [] }))).toBeNull()
  })

  it("is additive without a range (7)", () => {
    const coverage = createUnitCoverage()
    const rank = count(need(rankGoal(2), coverage))
    const upgrade = count(
      need(
        upgradeGoal("Character", {
          targets: [{ upgradeId: armor, quantity: 5 }],
        }),
        coverage
      )
    )
    expect(rank + upgrade).toBe(7)
  })

  it("de-duplicates with a Rank goal, Rank first (6)", () => {
    const coverage = createUnitCoverage()
    const rank = count(need(rankGoal(3), coverage))
    const upgrade = count(
      need(characterUpgrade(5, { start: 1, end: 4 }), coverage)
    )
    expect([rank, upgrade, rank + upgrade]).toEqual([2, 4, 6])
  })

  it("de-duplicates with a Rank goal, Upgrade first (6)", () => {
    const coverage = createUnitCoverage()
    const upgrade = count(
      need(characterUpgrade(5, { start: 1, end: 4 }), coverage)
    )
    const rank = count(need(rankGoal(3), coverage))
    expect([upgrade, rank, upgrade + rank]).toEqual([5, 1, 6])
  })

  it("caps the deduction at the Upgrade quantity (2)", () => {
    const coverage = createUnitCoverage()
    const rank = count(need(rankGoal(3), coverage))
    const upgrade = count(need(characterUpgrade(1), coverage))
    expect([rank, upgrade]).toEqual([2, 0])
  })

  it("does not count slots the player already applied", () => {
    const coverage = createUnitCoverage()
    const player = { rank: "Stone1", appliedUpgradeSlots: [0] }
    // The Rank goal skips the applied Stone1 slot, so only the Stone2 slot overlaps the range.
    const rank = count(need(rankGoal(3), coverage, player))
    const upgrade = count(need(characterUpgrade(5), coverage, player))
    expect([rank, upgrade]).toEqual([1, 4])
  })

  describe("Machine of War", () => {
    const mowUpgrade = (range?: { start: number; end: number }) =>
      upgradeGoal("Mow", {
        targets: [{ upgradeId: damage, quantity: 3 }],
        activeRange: range,
      })

    it("de-duplicates per track (3)", () => {
      const coverage = createUnitCoverage()
      const ability = count(need(abilityGoal(3), coverage), damage)
      const upgrade = count(
        need(mowUpgrade({ start: 1, end: 5 }), coverage),
        damage
      )
      expect([ability, upgrade]).toEqual([1, 2])
    })

    it("is additive for a track left unset", () => {
      const coverage = createUnitCoverage()
      const ability = count(need(abilityGoal(3), coverage), damage)
      const upgrade = count(need(mowUpgrade(), coverage), damage)
      expect([ability, upgrade]).toEqual([1, 3])
    })
  })
})
