import { describe, expect, it } from "vitest"
import type { ShopRewardOffer } from "@workspace/game-catalog"
import {
  battleIdSchema,
  campaignIdSchema,
  upgradeIdSchema,
} from "@workspace/game-domain"

import type {
  Battle,
  EstimateUpgrade,
  FarmLocation,
  GoalNeed,
} from "../model/estimate.domain"
import { estimateGoal } from "./estimate"
import { projectShopSupply } from "./shop-supply"
import {
  estimateBonusRaids,
  estimatePlanSchedule,
  estimateTodaySchedule,
} from "./estimate-plan"

const upgradeId = upgradeIdSchema.parse
const battleId = battleIdSchema.parse
const referenceDate = new Date("2026-01-01T00:00:00.000Z")

const location = (id: string): FarmLocation => ({
  battleId: battleId(id),
  guaranteed: true,
  effectiveRate: null,
  numerator: null,
  denominator: null,
  isMythic: false,
})

const battle = (
  id: string,
  dailyAttempts = 999
): [ReturnType<typeof battleId>, Battle] => [
  battleId(id),
  {
    campaignGroupId: campaignIdSchema.parse("CG1"),
    type: "Normal",
    challenge: false,
    nodeNumber: 1,
    battleIndex: 0,
    energyCost: 10,
    dailyAttempts,
  },
]

const resources = (...entries: [string, string][]) =>
  new Map(
    entries.map(([resource, node]) => [
      upgradeId(resource),
      {
        id: upgradeId(resource),
        farmLocations: [location(node)],
      } satisfies EstimateUpgrade,
    ])
  )

describe("plan reflects selectFarmNodes' gold tie-break (fix-daily-raid-location-recommendations)", () => {
  it("Raids Plan's Day 1 (== Today's schedule) picks the higher-expectedGold tied battle", () => {
    const tiedLocations: FarmLocation[] = [
      { ...location("FoCE13"), expectedGold: 137 },
      { ...location("SHME19"), expectedGold: 151.5 },
    ]
    const day = estimateTodaySchedule({
      goals: [
        {
          goalId: "goal",
          priority: 1,
          needs: [{ id: upgradeId("upgDmgC010"), count: 1 }],
        },
      ],
      upgradesById: new Map([
        [
          upgradeId("upgDmgC010"),
          { id: upgradeId("upgDmgC010"), farmLocations: tiedLocations },
        ],
      ]),
      battlesById: new Map([battle("FoCE13"), battle("SHME19")]),
      dailyEnergy: 100,
      inventory: [],
      referenceDate,
    })

    expect(day.entries).toHaveLength(1)
    expect(day.entries[0]?.battleId).toEqual(battleId("SHME19"))
  })
})

describe("raid schedule breakdown", () => {
  it("tags entries by goal and enforces one shared battle cap across goals", () => {
    const goals: GoalNeed[] = [
      { goalId: "a", priority: 1, needs: [{ id: upgradeId("U1"), count: 3 }] },
      { goalId: "b", priority: 2, needs: [{ id: upgradeId("U2"), count: 3 }] },
    ]
    const day = estimateTodaySchedule({
      goals,
      upgradesById: resources(["U1", "B1"], ["U2", "B1"]),
      battlesById: new Map([battle("B1", 5)]),
      dailyEnergy: 100,
      inventory: [],
      referenceDate,
    })

    expect(
      day.entries.map(({ goalId, raidsPerformed }) => ({
        goalId,
        raidsPerformed,
      }))
    ).toEqual([
      { goalId: "a", raidsPerformed: 3 },
      { goalId: "b", raidsPerformed: 2 },
    ])
    expect(day.attemptsUsedByBattle.get(battleId("B1"))).toBe(5)
    expect(day.energyTotal).toBe(
      day.entries.reduce((total, entry) => total + entry.energySpent, 0)
    )
    expect(day.raidsTotal).toBe(
      day.entries.reduce((total, entry) => total + entry.raidsPerformed, 0)
    )
  })

  it("carries inventory forward and resets battle caps on later days", () => {
    const plan = estimatePlanSchedule({
      goals: [
        {
          goalId: "goal",
          priority: 1,
          needs: [{ id: upgradeId("U1"), count: 7 }],
        },
      ],
      upgradesById: resources(["U1", "B1"]),
      battlesById: new Map([battle("B1", 2)]),
      dailyEnergy: 100,
      inventory: [{ id: upgradeId("U1"), count: 2 }],
      referenceDate,
    })

    expect(plan.days.map((day) => day.raidsTotal)).toEqual([2, 2, 1])
    expect(plan.summary).toEqual({
      totalDays: 3,
      totalEnergy: 50,
      totalRaids: 5,
      daysWithUnusedEnergy: 3,
      completionDate: "2026-01-03",
    })
  })

  it("uses Today as the completion date for a one-day plan", () => {
    const plan = estimatePlanSchedule({
      goals: [
        {
          goalId: "goal",
          priority: 1,
          needs: [{ id: upgradeId("U1"), count: 1 }],
        },
      ],
      upgradesById: resources(["U1", "B1"]),
      battlesById: new Map([battle("B1")]),
      dailyEnergy: 100,
      inventory: [],
      referenceDate,
    })

    expect(plan.summary.totalDays).toBe(1)
    expect(plan.summary.completionDate).toBe("2026-01-01")
  })
})

describe("bonus raids", () => {
  it("excludes a resource that was partially raided in the real schedule", () => {
    const bonus = estimateBonusRaids({
      goals: [
        {
          goalId: "goal",
          priority: 1,
          needs: [
            { id: upgradeId("U1"), count: 3 },
            { id: upgradeId("U2"), count: 2 },
          ],
        },
      ],
      upgradesById: resources(["U1", "B1"], ["U2", "B2"]),
      battlesById: new Map([battle("B1"), battle("B2")]),
      dailyEnergy: 20,
      inventory: [],
      referenceDate,
    })

    expect(bonus.entries.map((entry) => entry.resourceId)).toEqual([
      upgradeId("U2"),
    ])
    expect([...bonus.attemptsUsedByBattle]).toEqual([[battleId("B2"), 2]])
  })

  it("keeps qualifying entries in goal-priority order", () => {
    const bonus = estimateBonusRaids({
      goals: [
        {
          goalId: "third",
          priority: 3,
          needs: [{ id: upgradeId("U3"), count: 1 }],
        },
        {
          goalId: "first",
          priority: 1,
          needs: [{ id: upgradeId("U1"), count: 1 }],
        },
        {
          goalId: "second",
          priority: 2,
          needs: [{ id: upgradeId("U2"), count: 1 }],
        },
      ],
      upgradesById: resources(["U1", "B1"], ["U2", "B2"], ["U3", "B3"]),
      battlesById: new Map([battle("B1"), battle("B2"), battle("B3")]),
      dailyEnergy: 10,
      inventory: [],
      referenceDate,
    })

    expect(bonus.entries.map((entry) => entry.goalId)).toEqual([
      "second",
      "third",
    ])
    expect([...bonus.attemptsUsedByBattle]).toEqual([
      [battleId("B2"), 1],
      [battleId("B3"), 1],
    ])
  })
})

describe("shared daily energy budget (goal-farming-estimates)", () => {
  // The spec's worked example: one 100-energy day, a 10-energy node per raid with no binding
  // attempt cap, so each day funds 10 raids that the goals must share in priority order.
  const workedExample = (trajannPriority: number, aesothPriority: number) =>
    estimatePlanSchedule({
      goals: [
        {
          goalId: "trajann",
          priority: trajannPriority,
          needs: [{ id: upgradeId("U1"), count: 25 }],
        },
        {
          goalId: "aesoth",
          priority: aesothPriority,
          needs: [{ id: upgradeId("U2"), count: 10 }],
        },
      ],
      upgradesById: resources(["U1", "B1"], ["U2", "B2"]),
      battlesById: new Map([battle("B1"), battle("B2")]),
      dailyEnergy: 100,
      inventory: [],
      referenceDate,
    })

  it("makes a lower-priority goal wait for the energy a higher-priority goal leaves", () => {
    const plan = workedExample(1, 2)

    // Days 1-2 go entirely to Trajann (10 raids each); day 3 finishes its last 5 raids and hands
    // the surviving 50 energy to Aesoth; day 4 finishes Aesoth's last 5.
    expect(plan.outcomes.get("trajann")?.days).toBe(3)
    expect(plan.outcomes.get("aesoth")?.days).toBe(4)
    expect(plan.days.map((day) => day.raidsTotal)).toEqual([10, 10, 10, 5])
  })

  it("estimates the same lower-priority goal alone in a single day", () => {
    const plan = estimatePlanSchedule({
      goals: [
        {
          goalId: "aesoth",
          priority: 2,
          needs: [{ id: upgradeId("U2"), count: 10 }],
        },
      ],
      upgradesById: resources(["U2", "B2"]),
      battlesById: new Map([battle("B2")]),
      dailyEnergy: 100,
      inventory: [],
      referenceDate,
    })

    // The divergence V1 reports: per-material budgeting would date Aesoth here, not on day 4.
    expect(plan.outcomes.get("aesoth")?.days).toBe(1)
  })

  it("reorders the dates when the priorities are reordered", () => {
    const plan = workedExample(2, 1)

    // Not a mirror of the 3/4 base case: Aesoth alone finishes in one day, and Trajann then farms
    // on the remainder for four.
    expect(plan.outcomes.get("aesoth")?.days).toBe(1)
    expect(plan.outcomes.get("trajann")?.days).toBe(4)
  })

  it("lets an energy-free supplier complete a goal on a day the pool is exhausted", () => {
    const plan = estimatePlanSchedule({
      goals: [
        {
          goalId: "trajann",
          priority: 1,
          needs: [{ id: upgradeId("U1"), count: 25 }],
        },
        {
          goalId: "aesoth",
          priority: 2,
          needs: [{ id: upgradeId("U2"), count: 10 }],
          flatSuppliers: [
            {
              key: "shop:daily",
              resourceId: upgradeId("U2"),
              supplyOnDay: () => 10,
            },
          ],
        },
      ],
      upgradesById: resources(["U1", "B1"], ["U2", "B2"]),
      battlesById: new Map([battle("B1"), battle("B2")]),
      dailyEnergy: 100,
      inventory: [],
      referenceDate,
    })

    expect(plan.outcomes.get("aesoth")?.days).toBe(1)
    expect(plan.outcomes.get("trajann")?.days).toBe(3)
    // Day 1's energy all went to Trajann; Aesoth finished without spending any.
    expect(plan.days[0]?.energyTotal).toBe(100)
  })
})

describe("partial plans: blocked needs do not discard actionable peers (PLAN-014)", () => {
  // Modelled on the reported Rank goal: A (upgDmgC010) has a node, B (upgHpM004) has none.
  const A = upgradeId("A")
  const B = upgradeId("B")
  const upgradesById = new Map([
    [A, { id: A, farmLocations: [location("N1")] }],
    [B, { id: B, farmLocations: [] }],
  ])
  const battlesById = new Map([battle("N1")])
  const base = {
    upgradesById,
    battlesById,
    dailyEnergy: 100,
    referenceDate,
  }
  const mixed: GoalNeed = {
    goalId: "rank",
    priority: 1,
    needs: [
      { id: A, count: 2 },
      { id: B, count: 1 },
    ],
  }

  it("schedules the obtainable need, reports the blocker, withholds completion", () => {
    const plan = estimatePlanSchedule({
      ...base,
      goals: [mixed],
      inventory: [{ id: A, count: 1 }],
    })

    expect(plan.days).toHaveLength(1)
    expect(plan.days[0]?.entries).toMatchObject([
      { goalId: "rank", resourceId: A, raidsPerformed: 1, energySpent: 10 },
    ])
    expect(plan.outcomes.get("rank")).toEqual({
      status: "Blocked",
      reason: "NoFarmLocation",
      resourceIds: [B],
      blockers: [{ resourceId: B, reason: "NoFarmLocation", remaining: 1 }],
      actionableResourceIds: [A],
    })
    expect(plan.summary.completionDate).toBeNull()
  })

  it("all-blocked goal schedules nothing and reports every requirement", () => {
    const plan = estimatePlanSchedule({
      ...base,
      goals: [{ ...mixed, needs: [{ id: B, count: 3 }] }],
      inventory: [],
    })

    expect(plan.days).toHaveLength(0)
    expect(plan.outcomes.get("rank")).toMatchObject({
      status: "Blocked",
      blockers: [{ resourceId: B, remaining: 3 }],
      actionableResourceIds: [],
    })
  })

  it("all-actionable goal is unchanged and keeps a completion date", () => {
    const plan = estimatePlanSchedule({
      ...base,
      goals: [{ ...mixed, needs: [{ id: A, count: 2 }] }],
      inventory: [],
    })

    expect(plan.outcomes.get("rank")).toMatchObject({
      status: "Estimated",
      days: 1,
    })
    expect(plan.summary.completionDate).toBe("2026-01-01")
  })

  it("a blocked goal still consumes shared energy ahead of a lower-priority goal", () => {
    const plan = estimatePlanSchedule({
      ...base,
      dailyEnergy: 20,
      goals: [
        mixed,
        { goalId: "other", priority: 2, needs: [{ id: A, count: 2 }] },
      ],
      inventory: [],
    })

    const day1 = plan.days[0]!.entries.map((entry) => [
      entry.goalId,
      entry.raidsPerformed,
    ])
    expect(day1).toEqual([["rank", 2]])
    expect(plan.outcomes.get("other")).toMatchObject({ status: "Estimated" })
  })

  it("a supported flat supplier removes the blocker", () => {
    const plan = estimatePlanSchedule({
      ...base,
      goals: [
        {
          ...mixed,
          flatSuppliers: [{ key: "shop", resourceId: B, supplyOnDay: () => 1 }],
        },
      ],
      inventory: [],
    })

    expect(plan.outcomes.get("rank")).toMatchObject({ status: "Estimated" })
  })

  it("inventory covering the blocker allows a completion estimate", () => {
    const plan = estimatePlanSchedule({
      ...base,
      goals: [mixed],
      inventory: [{ id: B, count: 1 }],
    })

    expect(plan.outcomes.get("rank")).toMatchObject({ status: "Estimated" })
  })

  it("estimateGoal keeps the same blocker and no date", () => {
    const outcome = estimateGoal({ ...base, needs: mixed.needs })

    expect(outcome).toMatchObject({
      status: "Blocked",
      blockers: [{ resourceId: B, reason: "NoFarmLocation", remaining: 1 }],
      actionableResourceIds: [A],
    })
  })
})

describe("shop schedule entries (add-shop-purchases-to-schedule)", () => {
  const A = upgradeId("A")
  const B = upgradeId("B")
  const upgradesById = new Map<ReturnType<typeof upgradeId>, EstimateUpgrade>([
    [A, { id: A, farmLocations: [location("N1")] }],
    [B, { id: B, farmLocations: [] }],
  ])
  const battlesById = new Map([battle("N1")])
  const base = { upgradesById, battlesById, dailyEnergy: 100, referenceDate }
  const goal = (key: string): GoalNeed => ({
    goalId: "unlock",
    priority: 1,
    needs: [{ id: B, count: 5 }],
    flatSuppliers: [{ key, resourceId: B, supplyOnDay: () => 2 }],
  })

  it("records each day's expected shards per selected offer, summing to the attribution", () => {
    const plan = estimatePlanSchedule({
      ...base,
      goals: [goal("war:shards_unit")],
      inventory: [],
    })

    expect(plan.days.map((day) => day.shopEntries)).toEqual([
      [{ goalId: "unlock", offerId: "war:shards_unit", expectedAmount: 2 }],
      [{ goalId: "unlock", offerId: "war:shards_unit", expectedAmount: 2 }],
      [{ goalId: "unlock", offerId: "war:shards_unit", expectedAmount: 1 }],
    ])
    const outcome = plan.outcomes.get("unlock")
    expect(outcome).toMatchObject({ status: "Estimated", days: 3 })
    expect(
      plan.days
        .flatMap((day) => day.shopEntries)
        .reduce((total, entry) => total + entry.expectedAmount, 0)
    ).toBe(5)
  })

  it("leaves campaign-only goals and Onslaught suppliers without shop entries", () => {
    const campaign = estimatePlanSchedule({
      ...base,
      goals: [{ goalId: "rank", priority: 1, needs: [{ id: A, count: 2 }] }],
      inventory: [],
    })
    const onslaught = estimatePlanSchedule({
      ...base,
      goals: [goal("onslaught:regular")],
      inventory: [],
    })

    expect(campaign.days.every((day) => day.shopEntries.length === 0)).toBe(
      true
    )
    expect(onslaught.days.every((day) => day.shopEntries.length === 0)).toBe(
      true
    )
  })

  it("does not change the estimate: a shop supplier and an Onslaught supplier plan identically", () => {
    const shop = estimatePlanSchedule({
      ...base,
      goals: [goal("war:shards_unit")],
      inventory: [],
    })
    const onslaught = estimatePlanSchedule({
      ...base,
      goals: [goal("onslaught:regular")],
      inventory: [],
    })

    expect(shop.summary).toEqual(onslaught.summary)
    expect(shop.days.map((day) => day.entries)).toEqual(
      onslaught.days.map((day) => day.entries)
    )
  })

  describe("shop spend", () => {
    const shop = {
      perPurchase: 5,
      currency: "guildWarCurrency",
      cost: 900,
    }
    const supplier = {
      key: "war:shards_unit",
      resourceId: B,
      supplyOnDay: () => 2,
      shop,
    }

    it("prices only the shards still missing: owned inventory is not bought", () => {
      const run = (owned: number) =>
        estimatePlanSchedule({
          ...base,
          goals: [
            {
              goalId: "unlock",
              priority: 1,
              needs: [{ id: B, count: 5 }],
              flatSuppliers: [supplier],
            },
          ],
          inventory: owned > 0 ? [{ id: B, count: owned }] : [],
        }).outcomes.get("unlock")

      // 5 shards at 5 per purchase = 1 purchase = 900; with 1 shard owned, 4 shards = 720.
      expect(run(0)).toMatchObject({
        shopSpend: new Map([["guildWarCurrency", 900]]),
      })
      expect(run(1)).toMatchObject({
        shopSpend: new Map([["guildWarCurrency", 720]]),
      })
    })

    it("prices only the shop share when campaign nodes farm the rest, and omits the field without shops", () => {
      const outcome = estimatePlanSchedule({
        ...base,
        goals: [
          {
            goalId: "mixed",
            priority: 1,
            needs: [
              { id: A, count: 3 },
              { id: B, count: 5 },
            ],
            flatSuppliers: [supplier],
          },
        ],
        inventory: [],
      }).outcomes.get("mixed")
      const campaignOnly = estimatePlanSchedule({
        ...base,
        goals: [{ goalId: "rank", priority: 1, needs: [{ id: A, count: 3 }] }],
        inventory: [],
      }).outcomes.get("rank")

      expect(outcome).toMatchObject({
        shopSpend: new Map([["guildWarCurrency", 900]]),
      })
      expect(campaignOnly).not.toHaveProperty("shopSpend")
    })
  })

  describe("onslaught schedule entries", () => {
    const onslaught = {
      key: "onslaught:regular",
      resourceId: B,
      supplyOnDay: () => 6,
      shardsPerRun: 4,
    }
    const goalWith = (flatSuppliers: GoalNeed["flatSuppliers"]): GoalNeed => ({
      goalId: "ascend",
      priority: 1,
      needs: [{ id: B, count: 12 }],
      flatSuppliers,
    })

    it("records each day's expected shards and runs, with no shop entries", () => {
      const plan = estimatePlanSchedule({
        ...base,
        goals: [goalWith([onslaught])],
        inventory: [],
      })

      expect(plan.days.map((day) => day.onslaughtEntries)).toEqual([
        [{ goalId: "ascend", expectedShards: 6, runs: 1.5 }],
        [{ goalId: "ascend", expectedShards: 6, runs: 1.5 }],
      ])
      expect(plan.days.every((day) => day.shopEntries.length === 0)).toBe(true)
    })

    it("has no entries without an Onslaught supplier and leaves the token total and estimate untouched", () => {
      const withShop = estimatePlanSchedule({
        ...base,
        goals: [
          goalWith([
            { key: "war:shards_unit", resourceId: B, supplyOnDay: () => 6 },
          ]),
        ],
        inventory: [],
      })
      const withOnslaught = estimatePlanSchedule({
        ...base,
        goals: [goalWith([onslaught])],
        inventory: [],
      })

      expect(
        withShop.days.every((day) => day.onslaughtEntries.length === 0)
      ).toBe(true)
      expect(withOnslaught.outcomes.get("ascend")).toMatchObject({
        status: "Estimated",
        days: 2,
        onslaughtTokens: 3,
      })
    })
  })
})

describe("shop offers shared across goals (add-mythic-material-shop-sources)", () => {
  // Venerable Battle Mark's real offers for a roster owning a blue-star unit (spec worked examples).
  const VENERABLE = upgradeId("upgHpM004")
  const offer = (
    shopId: string,
    maxPerDay: number,
    probabilityByDay: ShopRewardOffer["probabilityByDay"],
    currency: string,
    amount: number
  ): ShopRewardOffer => ({
    offerId: `${shopId}:upgHpM004`,
    shopId,
    rewardType: "upgHpM004",
    rewardQty: 1,
    cost: { currency, amount },
    maxPerDay,
    days: Object.keys(probabilityByDay) as ShopRewardOffer["days"],
    probabilityByDay,
  })
  const monday = new Date(Date.UTC(2026, 9, 5))
  const suppliers = [
    offer("guild", 2, { TUE: 1, SAT: 0.25, SUN: 0.25 }, "guildCredits", 900),
    offer(
      "crusade",
      3,
      { TUE: 1, SAT: 0.25, SUN: 0.25 },
      "crusadeCurrency",
      430
    ),
    offer("rogue-trader", 1, { SUN: 1 }, "elderShopCurrency", 35),
  ].map((venerable) => projectShopSupply(venerable, monday))
  const venerableGoal = (goalId: string, priority: number, count: number) => ({
    goalId,
    priority,
    needs: [{ id: VENERABLE, count }],
    flatSuppliers: suppliers,
  })
  const plan = (...goals: GoalNeed[]) =>
    estimatePlanSchedule({
      goals,
      inventory: [],
      upgradesById: new Map(),
      battlesById: new Map(),
      dailyEnergy: 100,
      referenceDate: monday,
    })

  it("meets Ragnar's 6 Venerable Battle Mark on Day 6 (2026-10-10)", () => {
    const ragnar = plan(venerableGoal("ragnar", 1, 6)).outcomes.get("ragnar")
    if (ragnar?.status === "Blocked") throw new Error("blocked")

    expect(ragnar).toMatchObject({
      status: "Estimated",
      days: 6,
      date: "2026-10-10",
      energyTotal: 0,
      raidsTotal: 0,
    })
    expect(ragnar!.flatSupplyBySupplier?.get("crusade:upgHpM004")).toBeCloseTo(
      3.75
    )
    expect(ragnar!.flatSupplyBySupplier?.get("guild:upgHpM004")).toBeCloseTo(
      2.25
    )
    expect(
      ragnar!.flatSupplyBySupplier?.get("rogue-trader:upgHpM004") ?? 0
    ).toBe(0)
  })

  it("shares each offer's daily cap in priority order: the Dreadnought finishes on Day 9, not Day 2", () => {
    const result = plan(
      venerableGoal("ragnar", 1, 6),
      venerableGoal("dreadnought", 2, 3)
    )

    expect(result.outcomes.get("ragnar")).toMatchObject({
      days: 6,
      date: "2026-10-10",
    })
    expect(result.outcomes.get("dreadnought")).toMatchObject({
      days: 9,
      date: "2026-10-13",
    })
    const tuesday = result.days[1]!.shopEntries
    expect(tuesday.filter((entry) => entry.goalId === "dreadnought")).toEqual(
      []
    )
    const saturdayGuild = result.days[5]!.shopEntries.filter(
      (entry) => entry.offerId === "guild:upgHpM004"
    )
    expect(saturdayGuild.map((entry) => entry.goalId)).toEqual([
      "ragnar",
      "dreadnought",
    ])
  })

  it("no longer double-counts one unit's shard offer selected by both its Unlock and Ascension goals", () => {
    const SHARDS = upgradeId("upgHpM001") // any resource id; the pool is keyed by offer, not resource
    const warOffer = {
      key: "war:shards_unit",
      resourceId: SHARDS,
      supplyOnDay: () => 2,
      shop: { perPurchase: 1, currency: "guildWarCurrency", cost: 100 },
    }
    const result = plan(
      {
        goalId: "unlock",
        priority: 1,
        needs: [{ id: SHARDS, count: 5 }],
        flatSuppliers: [warOffer],
      },
      {
        goalId: "ascension",
        priority: 2,
        needs: [{ id: SHARDS, count: 5 }],
        flatSuppliers: [warOffer],
      }
    )

    // 2 shards/day in total: Unlock takes 2, 2, 1 (Day 3); Ascension gets 1 then 2, 2 (Day 5).
    expect(result.outcomes.get("unlock")).toMatchObject({ days: 3 })
    expect(result.outcomes.get("ascension")).toMatchObject({ days: 5 })
  })

  it("leaves two goals that use different offers independent", () => {
    const onlyGuild = {
      ...venerableGoal("a", 1, 2),
      flatSuppliers: [suppliers[0]!],
    }
    const onlyCrusade = {
      ...venerableGoal("b", 2, 3),
      flatSuppliers: [suppliers[1]!],
    }
    const result = plan(onlyGuild, onlyCrusade)

    expect(result.outcomes.get("a")).toMatchObject({ days: 2 })
    expect(result.outcomes.get("b")).toMatchObject({ days: 2 })
  })
})
