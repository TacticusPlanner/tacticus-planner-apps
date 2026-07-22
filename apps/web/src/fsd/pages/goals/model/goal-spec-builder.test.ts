import { describe, expect, it } from "vitest"
import { unitIdSchema, upgradeIdSchema } from "@workspace/game-domain"

import type { MowStorageModel } from "@workspace/game-catalog"
import type {
  Character,
  UpgradeWithFarmLocations,
} from "@/features/rank-lookup"

import {
  buildCombinedGoalSpecs,
  buildReviewItems,
  characterRelevantUpgradeIds,
  characterRelevantUpgradeQuantities,
  computeUpgradeGoalNeed,
  mowRelevantUpgradeIds,
  mowRelevantUpgradeQuantities,
} from "./goal-spec-builder"

const upgradeId = upgradeIdSchema.parse
const upgradeIds = (values: string[]) => values.map((value) => upgradeId(value))

const baseSpecParams = {
  includesLevel: false,
  ascensionSuggestion: null,
  levelSuggestion: null,
  rankStart: "Stone1" as const,
  rankEnd: "Stone2" as const,
  rankEndPointFive: false,
  rankEndAppliedUpgrades: 0,
  progressionStart: "Common:None" as const,
  progressionEnd: "Common:OneStar" as const,
  ascensionFarmingSource: "Campaign" as const,
  abilityActiveStart: 0,
  abilityActiveEnd: 0,
  abilityPassiveStart: 0,
  abilityPassiveEnd: 0,
  levelStart: 1,
  levelEnd: 2,
  farmingStrategy: "TotalUpgrades" as const,
  upgradeTargets: [],
  selectedRegularShardLocationIds: [],
  selectedMythicShardLocationIds: [],
}

describe("buildReviewItems", () => {
  it("flags an auto-included Unlock, Ascension and Level as suggested, not the user's own selections", () => {
    const items = buildReviewItems(new Set(["Rank"]), true, true, true)
    expect(items).toEqual([
      { goalType: "Unlock", autoSuggested: true },
      { goalType: "Ascension", autoSuggested: true },
      { goalType: "Level", autoSuggested: true },
      { goalType: "Rank", autoSuggested: false },
    ])
  })

  it("does not flag Unlock/Ascension/Level as auto-suggested once explicitly toggled", () => {
    const items = buildReviewItems(
      new Set(["Unlock", "Ascension", "Level", "Rank"]),
      true,
      true,
      true
    )
    expect(items).toEqual([
      { goalType: "Unlock", autoSuggested: false },
      { goalType: "Ascension", autoSuggested: false },
      { goalType: "Level", autoSuggested: false },
      { goalType: "Rank", autoSuggested: false },
    ])
  })

  it("is empty when nothing is enabled or suggested", () => {
    expect(buildReviewItems(new Set(), false, false, false)).toEqual([])
  })

  it("includes an enabled Upgrade goal, never auto-suggested", () => {
    const items = buildReviewItems(new Set(["Upgrade"]), false, false, false)
    expect(items).toEqual([{ goalType: "Upgrade", autoSuggested: false }])
  })

  it("orders an included Level goal after Unlock/Ascension and before Rank/Ability", () => {
    const items = buildReviewItems(
      new Set(["Rank", "Ability"]),
      false,
      false,
      true
    )
    expect(items.map((item) => item.goalType)).toEqual([
      "Level",
      "Rank",
      "Ability",
    ])
  })
})

describe("buildCombinedGoalSpecs", () => {
  it("builds a single Rank spec with no dependencies when nothing else is included", () => {
    const specs = buildCombinedGoalSpecs({
      ...baseSpecParams,
      enabledTypes: new Set(["Rank"]),
      includesUnlock: false,
      includesAscension: false,
    })

    expect(specs).toHaveLength(1)
    expect(specs[0].goalType).toBe("Rank")
    expect(specs[0].dependsOnIndex).toEqual([])
  })

  it("chains Unlock -> Ascension -> Rank -> Ability by index, in that order", () => {
    const specs = buildCombinedGoalSpecs({
      ...baseSpecParams,
      enabledTypes: new Set(["Unlock", "Ascension", "Rank", "Ability"]),
      includesUnlock: true,
      includesAscension: true,
    })

    expect(specs.map((spec) => spec.goalType)).toEqual([
      "Unlock",
      "Ascension",
      "Rank",
      "Ability",
    ])
    expect(specs[0].dependsOnIndex).toEqual([]) // Unlock
    expect(specs[1].dependsOnIndex).toEqual([0]) // Ascension -> Unlock
    expect(specs[2].dependsOnIndex).toEqual([0, 1]) // Rank -> Unlock, Ascension
    expect(specs[3].dependsOnIndex).toEqual([0]) // Ability -> Unlock only, not Ascension
  })

  it("uses the auto-suggested Ascension target when Ascension wasn't explicitly toggled", () => {
    const specs = buildCombinedGoalSpecs({
      ...baseSpecParams,
      enabledTypes: new Set(["Rank"]),
      includesUnlock: false,
      includesAscension: true,
      ascensionSuggestion: { start: "Common:None", end: "Epic:RedOneStar" },
    })

    const ascension = specs.find((spec) => spec.goalType === "Ascension")
    expect(ascension?.config.progression).toEqual({
      start: "Common:None",
      end: "Epic:RedOneStar",
    })
  })

  it("prefers the user's own Ascension fields over the suggestion when explicitly toggled", () => {
    const specs = buildCombinedGoalSpecs({
      ...baseSpecParams,
      enabledTypes: new Set(["Ascension", "Rank"]),
      includesUnlock: false,
      includesAscension: true,
      ascensionSuggestion: { start: "Common:None", end: "Epic:RedOneStar" },
      progressionStart: "Rare:FourStars",
      progressionEnd: "Legendary:RedThreeStars",
    })

    const ascension = specs.find((spec) => spec.goalType === "Ascension")
    expect(ascension?.config.progression).toEqual({
      start: "Rare:FourStars",
      end: "Legendary:RedThreeStars",
    })
  })

  it("persists the selected farming strategy on rank goals", () => {
    const specs = buildCombinedGoalSpecs({
      ...baseSpecParams,
      enabledTypes: new Set(["Rank"]),
      includesUnlock: false,
      includesAscension: false,
      farmingStrategy: "Milestones",
    })

    expect(specs[0]?.config.farmingStrategy).toBe("Milestones")
  })

  it("builds an Upgrade spec from the target list, depending on Unlock when included", () => {
    const specs = buildCombinedGoalSpecs({
      ...baseSpecParams,
      enabledTypes: new Set(["Unlock", "Upgrade"]),
      includesUnlock: true,
      includesAscension: false,
      upgradeTargets: [{ upgradeId: upgradeId("h1"), quantity: 3 }],
    })

    expect(specs.map((spec) => spec.goalType)).toEqual(["Unlock", "Upgrade"])
    expect(specs[1].config.upgrade).toEqual({
      targets: [{ upgradeId: upgradeId("h1"), quantity: 3 }],
    })
    expect(specs[1].dependsOnIndex).toEqual([0])
  })

  it("omits the Upgrade spec entirely when no targets are selected, even if toggled on", () => {
    const specs = buildCombinedGoalSpecs({
      ...baseSpecParams,
      enabledTypes: new Set(["Upgrade"]),
      includesUnlock: false,
      includesAscension: false,
      upgradeTargets: [],
    })

    expect(specs).toHaveLength(0)
  })

  it("builds a Level spec from the current/target levels, depending on Unlock when included", () => {
    const specs = buildCombinedGoalSpecs({
      ...baseSpecParams,
      enabledTypes: new Set(["Unlock", "Level"]),
      includesUnlock: true,
      includesAscension: false,
      includesLevel: true,
      levelStart: 31,
      levelEnd: 42,
    })

    expect(specs.map((spec) => spec.goalType)).toEqual(["Unlock", "Level"])
    expect(specs[1].config.level).toEqual({ start: 31, end: 42 })
    expect(specs[1].dependsOnIndex).toEqual([0])
  })

  it("uses the auto-suggested Level target when Level wasn't explicitly toggled, and gates Rank/Ability on it", () => {
    const specs = buildCombinedGoalSpecs({
      ...baseSpecParams,
      enabledTypes: new Set(["Rank", "Ability"]),
      includesUnlock: false,
      includesAscension: false,
      includesLevel: true,
      levelSuggestion: { start: 20, end: 35 },
    })

    expect(specs.map((spec) => spec.goalType)).toEqual([
      "Level",
      "Rank",
      "Ability",
    ])
    expect(specs[0].config.level).toEqual({ start: 20, end: 35 })
    expect(specs[0].dependsOnIndex).toEqual([])
    expect(specs[1].dependsOnIndex).toEqual([0]) // Rank -> Level
    expect(specs[2].dependsOnIndex).toEqual([0]) // Ability -> Level
  })

  it("prefers the user's own Level fields over the suggestion when explicitly toggled", () => {
    const specs = buildCombinedGoalSpecs({
      ...baseSpecParams,
      enabledTypes: new Set(["Level"]),
      includesUnlock: false,
      includesAscension: false,
      includesLevel: true,
      levelSuggestion: { start: 20, end: 35 },
      levelStart: 31,
      levelEnd: 42,
    })

    expect(specs[0]?.config.level).toEqual({ start: 31, end: 42 })
  })
})

// 6 upgrades per rank, mirroring rank-lookup-calc.test.ts's fixture shape.
const character: Character = {
  id: unitIdSchema.parse("astarCyrus"),
  name: "Cyrus",
  rankUpUpgrades: [
    {
      rank: "Stone1",
      upgradeIds: upgradeIds(["h1", "h2", "d1", "d2", "a1", "a2"]),
    },
    {
      rank: "Stone2",
      upgradeIds: upgradeIds(["h1", "h3", "d3", "d4", "a3", "a4"]),
    },
  ],
}

const mow: MowStorageModel = {
  id: unitIdSchema.parse("astraOrdnanceBattery"),
  name: "Malleus Rocket Launcher",
  faction: "AstraMilitarum",
  primaryAbility: {
    name: "Primary",
    recipes: [upgradeIds(["h1", "d1"]), upgradeIds(["h1", "a1"])],
  },
  secondaryAbility: {
    name: "Secondary",
    recipes: [upgradeIds(["h2", "d2"])],
  },
} as MowStorageModel

describe("characterRelevantUpgradeIds", () => {
  it("flattens every rank's upgrade ids into a deduplicated set", () => {
    expect(characterRelevantUpgradeIds(character)).toEqual(
      new Set(
        upgradeIds([
          "h1",
          "h2",
          "d1",
          "d2",
          "a1",
          "a2",
          "h3",
          "d3",
          "d4",
          "a3",
          "a4",
        ])
      )
    )
  })
})

describe("mowRelevantUpgradeIds", () => {
  it("flattens both ability tracks' recipes into a deduplicated set", () => {
    expect(mowRelevantUpgradeIds(mow)).toEqual(
      new Set(upgradeIds(["h1", "d1", "a1", "h2", "d2"]))
    )
  })
})

const noCraftedUpgrades = new Map<
  ReturnType<typeof upgradeId>,
  UpgradeWithFarmLocations
>()

describe("characterRelevantUpgradeQuantities", () => {
  it("counts occurrences within the given rank range only", () => {
    expect(
      characterRelevantUpgradeQuantities(
        character,
        "Stone1",
        "Stone2",
        noCraftedUpgrades
      )
    ).toEqual(
      new Map([
        [upgradeId("h1"), 1],
        [upgradeId("h2"), 1],
        [upgradeId("d1"), 1],
        [upgradeId("d2"), 1],
        [upgradeId("a1"), 1],
        [upgradeId("a2"), 1],
      ])
    )
  })

  it("sums an id's occurrences across multiple rank steps in range", () => {
    const quantities = characterRelevantUpgradeQuantities(
      character,
      "Stone1",
      "Stone3",
      noCraftedUpgrades
    )
    expect(quantities.get(upgradeId("h1"))).toBe(2)
    expect(quantities.get(upgradeId("h3"))).toBe(1)
  })

  it("is empty for an empty/inverted range", () => {
    expect(
      characterRelevantUpgradeQuantities(
        character,
        "Stone2",
        "Stone1",
        noCraftedUpgrades
      )
    ).toEqual(new Map())
  })

  it("excludes crafted upgrades — only base upgrades are selectable", () => {
    const upgradesById = new Map([
      [upgradeId("h1"), { crafted: true } as UpgradeWithFarmLocations],
    ])
    const quantities = characterRelevantUpgradeQuantities(
      character,
      "Stone1",
      "Stone2",
      upgradesById
    )
    expect(quantities.has(upgradeId("h1"))).toBe(false)
    expect(quantities.get(upgradeId("h2"))).toBe(1)
  })
})

describe("mowRelevantUpgradeQuantities", () => {
  it("counts occurrences across both ability tracks' whole recipe lists", () => {
    expect(mowRelevantUpgradeQuantities(mow, noCraftedUpgrades)).toEqual(
      new Map([
        [upgradeId("h1"), 2],
        [upgradeId("d1"), 1],
        [upgradeId("a1"), 1],
        [upgradeId("h2"), 1],
        [upgradeId("d2"), 1],
      ])
    )
  })
})

describe("computeUpgradeGoalNeed", () => {
  const upgradesById = new Map<
    ReturnType<typeof upgradeId>,
    UpgradeWithFarmLocations
  >([
    [
      upgradeId("h1"),
      {
        id: upgradeId("h1"),
        label: "Health Base",
        rarity: "Common",
        stat: "Health",
        crafted: false,
        recipe: [],
        farmLocations: [],
      },
    ],
  ])

  it("is empty when the goal type isn't enabled or there are no targets", () => {
    expect(
      computeUpgradeGoalNeed({
        upgradeEnabled: false,
        targets: [{ upgradeId: upgradeId("h1"), quantity: 5 }],
        inventoryUpgrades: undefined,
        upgradesById,
      })
    ).toEqual([])
    expect(
      computeUpgradeGoalNeed({
        upgradeEnabled: true,
        targets: [],
        inventoryUpgrades: undefined,
        upgradesById,
      })
    ).toEqual([])
  })

  it("nets the target quantity against inventory only, with no rank-applied contribution", () => {
    const result = computeUpgradeGoalNeed({
      upgradeEnabled: true,
      targets: [{ upgradeId: upgradeId("h1"), quantity: 5 }],
      inventoryUpgrades: [{ upgradeId: upgradeId("h1"), amount: 2 }],
      upgradesById,
    })

    expect(result).toEqual([
      {
        id: upgradeId("h1"),
        label: "Health Base",
        required: 5,
        inventoryContribution: 2,
        missing: 3,
      },
    ])
  })

  it("drops a fully-covered target unless includeCovered is set", () => {
    const params = {
      upgradeEnabled: true,
      targets: [{ upgradeId: upgradeId("h1"), quantity: 2 }],
      inventoryUpgrades: [{ upgradeId: upgradeId("h1"), amount: 5 }],
      upgradesById,
    }

    expect(computeUpgradeGoalNeed(params)).toEqual([])
    expect(computeUpgradeGoalNeed({ ...params, includeCovered: true })).toEqual(
      [
        {
          id: upgradeId("h1"),
          label: "Health Base",
          required: 2,
          inventoryContribution: 2,
          missing: 0,
        },
      ]
    )
  })
})
