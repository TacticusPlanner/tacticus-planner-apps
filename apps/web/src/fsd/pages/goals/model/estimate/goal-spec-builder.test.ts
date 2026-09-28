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
  characterRelevantUpgradeQuantities,
  computeUpgradeGoalNeed,
  mowRelevantUpgradeQuantities,
} from ".//goal-spec-builder"
import { emptyAcquisitionPlan } from "../goal-creation-form/acquisition-plan"

const upgradeId = upgradeIdSchema.parse
const upgradeIds = (values: string[]) => values.map((value) => upgradeId(value))

/** A catalog where each listed id is crafted from the given ingredients; everything else reads as a
 * base upgrade (an id absent from the map is counted directly, same as in production). */
const craftedUpgradesById = (
  entries: readonly (readonly [
    string,
    readonly { material: string; count: number }[],
  ])[]
) =>
  new Map(
    entries.map(([id, recipe]) => [
      upgradeId(id),
      {
        crafted: true,
        recipe: recipe.map((ingredient) => ({
          material: upgradeId(ingredient.material),
          count: ingredient.count,
        })),
      } as UpgradeWithFarmLocations,
    ])
  )

const baseSpecParams = {
  ascensionSuggestion: null,
  rankStart: "Stone1" as const,
  rankEnd: "Stone2" as const,
  rankEndPointFive: false,
  rankEndAppliedUpgrades: 0,
  progressionStart: "Common:None" as const,
  progressionEnd: "Common:OneStar" as const,
  abilityActiveStart: 0,
  abilityActiveEnd: 0,
  abilityPassiveStart: 0,
  abilityPassiveEnd: 0,
  farmingStrategy: "TotalUpgrades" as const,
  upgradeTargets: [],
  plan: emptyAcquisitionPlan(),
}

describe("buildReviewItems", () => {
  it("flags an auto-included Unlock and Ascension as suggested, not the user's own selections", () => {
    const items = buildReviewItems(new Set(["Rank"]), true, true)
    expect(items).toEqual([
      { goalType: "Unlock", autoSuggested: true },
      { goalType: "Ascension", autoSuggested: true },
      { goalType: "Rank", autoSuggested: false },
    ])
  })

  it("does not flag Unlock/Ascension as auto-suggested once explicitly toggled", () => {
    const items = buildReviewItems(
      new Set(["Unlock", "Ascension", "Rank"]),
      true,
      true
    )
    expect(items).toEqual([
      { goalType: "Unlock", autoSuggested: false },
      { goalType: "Ascension", autoSuggested: false },
      { goalType: "Rank", autoSuggested: false },
    ])
  })

  it("is empty when nothing is enabled or suggested", () => {
    expect(buildReviewItems(new Set(), false, false)).toEqual([])
  })

  it("includes an enabled Upgrade goal, never auto-suggested", () => {
    const items = buildReviewItems(new Set(["Upgrade"]), false, false)
    expect(items).toEqual([{ goalType: "Upgrade", autoSuggested: false }])
  })

  it("never lists a Level goal for a Rank/Ability target, however high its level requirement", () => {
    const items = buildReviewItems(new Set(["Rank", "Ability"]), false, false)
    expect(items.map((item) => item.goalType)).toEqual(["Rank", "Ability"])
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
    expect(specs[3].dependsOnIndex).toEqual([0, 1]) // Ability -> Unlock, Ascension
  })

  it("gates Ability on an auto-suggested Ascension it wasn't explicitly toggled for (8.1)", () => {
    const specs = buildCombinedGoalSpecs({
      ...baseSpecParams,
      enabledTypes: new Set(["Ability"]),
      includesUnlock: false,
      includesAscension: true,
      ascensionSuggestion: {
        start: "Common:None",
        end: "Legendary:RedThreeStars",
      },
    })

    expect(specs.map((spec) => spec.goalType)).toEqual(["Ascension", "Ability"])
    expect(specs[0].dependsOnIndex).toEqual([])
    expect(specs[1].dependsOnIndex).toEqual([0]) // Ability -> Ascension
  })

  it("submits campaign+shop+Onslaught for Ascension but drops Onslaught and mythic for Unlock", () => {
    const shopOffer = {
      offerId: "guild:shards_hero1",
      shopId: "guild",
      unitId: "hero1",
      rewardType: "shards_hero1",
      isMythic: false,
      rewardQty: 5,
      cost: { currency: "guildCredits", amount: 525 },
      maxPerDay: 2,
      days: ["MON" as const],
      probabilityByDay: { MON: 1 },
    }
    const mythicShopOffer = {
      ...shopOffer,
      offerId: "rogue-trader:mythicShards_hero1",
      shopId: "rogue-trader",
      rewardType: "mythicShards_hero1",
      isMythic: true,
    }
    const specs = buildCombinedGoalSpecs({
      ...baseSpecParams,
      enabledTypes: new Set(["Unlock", "Ascension"]),
      includesUnlock: true,
      includesAscension: true,
      plan: {
        campaign: {
          enabled: true,
          regularBattleIds: ["node-regular"],
          mythicBattleIds: ["node-mythic"],
        },
        onslaught: { enabled: true },
        shops: { enabled: true, offers: [shopOffer, mythicShopOffer] },
      },
    })

    const unlock = specs.find((spec) => spec.goalType === "Unlock")!
    const ascension = specs.find((spec) => spec.goalType === "Ascension")!

    expect(unlock.config.acquisitionSources).toEqual([
      { kind: "Campaign", ids: ["node-regular"] },
      { kind: "Shop", ids: ["guild:shards_hero1"] },
    ])
    expect(ascension.config.acquisitionSources).toEqual([
      { kind: "Campaign", ids: ["node-regular", "node-mythic"] },
      { kind: "Onslaught", ids: [] },
      {
        kind: "Shop",
        ids: ["guild:shards_hero1", "rogue-trader:mythicShards_hero1"],
      },
    ])
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

  it("creates no Level spec or dependency for a Rank/Ability pair, only Ascension/Unlock", () => {
    const specs = buildCombinedGoalSpecs({
      ...baseSpecParams,
      enabledTypes: new Set(["Rank", "Ability"]),
      includesUnlock: true,
      includesAscension: true,
      ascensionSuggestion: { start: "Common:None", end: "Uncommon:TwoStars" },
      // A target far above any current level: the level requirement lives on the goals, not as a spec.
      rankEnd: "Gold1",
      abilityActiveEnd: 40,
    })

    expect(specs.map((spec) => spec.goalType)).toEqual([
      "Unlock",
      "Ascension",
      "Rank",
      "Ability",
    ])
    expect(specs[2].dependsOnIndex).toEqual([0, 1])
    expect(specs[3].dependsOnIndex).toEqual([0, 1])
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

  it("decomposes a crafted upgrade into the base ingredients it needs", () => {
    const upgradesById = craftedUpgradesById([
      ["h1", [{ material: "b1", count: 2 }]],
    ])
    const quantities = characterRelevantUpgradeQuantities(
      character,
      "Stone1",
      "Stone2",
      upgradesById
    )
    expect(quantities.has(upgradeId("h1"))).toBe(false)
    expect(quantities.get(upgradeId("b1"))).toBe(2)
    expect(quantities.get(upgradeId("h2"))).toBe(1)
  })

  it("decomposes recursively and sums a shared ingredient across recipes", () => {
    const upgradesById = craftedUpgradesById([
      ["h1", [{ material: "c1", count: 2 }]],
      ["c1", [{ material: "b1", count: 3 }]],
      ["h2", [{ material: "b1", count: 1 }]],
    ])
    const quantities = characterRelevantUpgradeQuantities(
      character,
      "Stone1",
      "Stone2",
      upgradesById
    )
    // h1 -> 2 x c1 -> 6 x b1, plus h2's own single b1.
    expect(quantities.get(upgradeId("b1"))).toBe(7)
    expect(quantities.has(upgradeId("c1"))).toBe(false)
  })

  it("never offers an empty selection when every upgrade in range is crafted", () => {
    const upgradesById = craftedUpgradesById(
      (["h1", "h2", "d1", "d2", "a1", "a2"] as const).map((id) => [
        id,
        [{ material: `${id}-base`, count: 1 }],
      ])
    )
    expect(
      characterRelevantUpgradeQuantities(
        character,
        "Stone1",
        "Stone2",
        upgradesById
      ).size
    ).toBe(6)
  })
})

describe("mowRelevantUpgradeQuantities", () => {
  it("decomposes a crafted ingredient in an ability recipe into base materials", () => {
    const quantities = mowRelevantUpgradeQuantities(
      mow,
      craftedUpgradesById([["h1", [{ material: "b1", count: 3 }]]])
    )
    // h1 appears in two of the primary track's recipes, each needing 3 x b1.
    expect(quantities.get(upgradeId("b1"))).toBe(6)
    expect(quantities.has(upgradeId("h1"))).toBe(false)
  })

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
