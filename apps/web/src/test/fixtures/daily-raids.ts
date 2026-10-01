import { battleIdSchema } from "@workspace/game-domain"

import type { DailyRaidsReadyViewModel } from "@/features/daily-raids"

// Shared by the Today page tests (pages/dailies) and the Schedule page tests (pages/goals):
// both render the same `useDailyRaids` view model, one for Day 1 and one for every day.
export const battle = battleIdSchema.parse("B1")
// A node the player raided today that this project's plan never mentions — its resource can only
// come from the catalog-wide index (tacticus-planner-apps#121).
export const offPlanBattle = battleIdSchema.parse("B2")
export function ready(
  overrides: Partial<DailyRaidsReadyViewModel> = {}
): DailyRaidsReadyViewModel {
  const goalsById = new Map([
    [
      "g1",
      {
        goalId: "g1",
        priority: 1,
        unitId: "bellator" as never,
        unitType: "Character" as const,
        unitLabel: "Bellator",
        targetLabel: "Rank Gold1",
        goalKind: "Rank" as const,
        targetRank: "Gold1" as never,
      },
    ],
    [
      "g2",
      {
        goalId: "g2",
        priority: 2,
        unitId: "alephNull" as never,
        unitType: "Character" as const,
        unitLabel: "Aleph-Null",
        targetLabel: "Rank Silver1",
        goalKind: "Rank" as const,
        targetRank: "Silver1" as never,
      },
    ],
  ])
  const entry = (goalId: string, resourceId: string, raidsPerformed = 2) => ({
    goalId,
    resourceId: resourceId as never,
    battleId: battle,
    raidsPerformed,
    itemsFarmed: raidsPerformed,
    energySpent: raidsPerformed * 6,
    dailyAttempts: 10,
  })
  const todayEntries = [entry("g1", "U1", 4), entry("g2", "U1", 3)]
  const day = (number: number) => ({
    day: number,
    entries: [entry("g1", `U${number}`)],
    attemptsUsedByBattle: new Map([[battle, 2]]),
    energyTotal: 12,
    raidsTotal: 2,
  })
  return {
    status: "ready",
    today: {
      day: 1,
      entries: todayEntries,
      attemptsUsedByBattle: new Map([[battle, 7]]),
      energyTotal: 42,
      raidsTotal: 7,
    },
    bonus: {
      day: 1,
      entries: [
        entry("g1", "B1"),
        entry("g1", "B2"),
        entry("g2", "B3"),
        entry("g2", "B4"),
      ],
      attemptsUsedByBattle: new Map([[battle, 8]]),
      energyTotal: 48,
      raidsTotal: 8,
    },
    planDays: [day(1), day(2), day(3), day(4), day(5)],
    planSummary: {
      totalDays: 5,
      totalEnergy: 200,
      totalRaids: 30,
      daysWithUnusedEnergy: 2,
      completionDate: "2026-01-06",
    },
    dailyEnergy: 288,
    goalsById,
    resourceLabels: new Map([
      ["U1", "Ceramite"],
      ["B1", "Bonus 1"],
      ["B2", "Bonus 2"],
      ["B3", "Bonus 3"],
      ["B4", "Bonus 4"],
      ["U2", "Day 2"],
      ["U3", "Day 3"],
      ["U4", "Day 4"],
      ["U5", "Day 5"],
    ]),
    resourceVisuals: new Map(
      ["U1", "B1", "B2", "B3", "B4", "U2", "U3", "U4", "U5"].map((id) => [
        id,
        { kind: "shard" as const, unitId: "bellator" as never },
      ])
    ),
    blockedGoals: [],
    filteredOut: [],
    resourceUrgencyByGoalAndResource: new Map(),
    resourceTotals: new Map([["U1", { owned: 265, target: 500 }]]),
    resourceProgressByDay: new Map(
      [1, 2, 3, 4, 5].map((n) => [
        n,
        new Map([
          [`g1:U${n}`, { owned: n === 1 ? 265 : 0, target: n === 1 ? 500 : 5 }],
          ...(n === 1
            ? [
                ["g2:U1", { owned: 20, target: 40 }],
                ["g2:B1", { owned: 0, target: 5 }],
              ]
            : []),
        ] as [string, { owned: number; target: number }][]),
      ])
    ),
    locationsByBattleId: new Map([
      [
        battle,
        {
          id: battle,
          campaignName: "Indomitus",
          nodeLabel: "Elite 1",
          shortLabel: "Indomitus I 1",
          challenge: false,
          icon: "/campaign.png",
        },
      ],
      [
        offPlanBattle,
        {
          id: offPlanBattle,
          campaignName: "Death Guard",
          nodeLabel: "Extremis 3",
          shortLabel: "Death Guard EX 3",
          challenge: false,
          icon: "/campaign.png",
        },
      ],
    ]),
    resourceByBattleId: new Map([
      [
        offPlanBattle,
        {
          label: "Adamantium",
          visual: {
            kind: "upgrade" as const,
            id: "adamantium" as never,
            rarity: "Epic" as never,
            crafted: false,
          },
        },
      ],
    ]),
    attemptsUsedByBattle: new Map([[battle, 7]]),
    realEnergyUsedToday: 120,
    attemptsLeftByBattle: new Map([[battle, 3]]),
    todaysAttempts: [],
    ...overrides,
  }
}

// Day 1: g1/U1 on B1 and g2/U1 on B2. Day 2 repeats B1 (g1/U2) so the same battle ID appears on
// today and a future day, which real attempts-left data (keyed by battle, not day) must not touch.
export function raidedPlan(attemptsLeft: [typeof battle, number][]) {
  const planEntry = (
    goalId: string,
    resourceId: string,
    battleId: typeof battle
  ) => ({
    goalId,
    resourceId: resourceId as never,
    battleId,
    raidsPerformed: 2,
    itemsFarmed: 2,
    energySpent: 12,
    dailyAttempts: 10,
  })
  const base = ready()
  const planDay = (day: number, entries: ReturnType<typeof planEntry>[]) => ({
    day,
    entries,
    attemptsUsedByBattle: new Map([[battle, 2]]),
    energyTotal: 12,
    raidsTotal: 2,
  })
  return ready({
    planDays: [
      planDay(1, [
        planEntry("g1", "U1", battle),
        planEntry("g2", "B1", offPlanBattle),
      ]),
      planDay(2, [planEntry("g1", "U2", battle)]),
      base.planDays[2]!,
    ],
    attemptsLeftByBattle: new Map(attemptsLeft),
  })
}
