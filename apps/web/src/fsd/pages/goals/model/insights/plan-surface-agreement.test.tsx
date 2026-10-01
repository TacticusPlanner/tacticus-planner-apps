import { describe, expect, it, vi } from "vitest"
import {
  battleIdSchema,
  campaignIdSchema,
  rankIndex,
  rankOrder,
  unitIdSchema,
  upgradeIdSchema,
  type BattleId,
} from "@workspace/game-domain"

import { render, screen } from "@/test/render"
import type { GoalDetail } from "@/entities/goal"
import {
  availableCampaignBattles,
  calculateDailyRaids,
} from "@/features/daily-raids"
import type { RaidsFilters } from "@/features/daily-raids"
import type { FarmingCharacter, FarmingUpgrade } from "@/features/goal-farming"

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: vi.fn() },
  useTranslation: () => ({ t: (key: string) => key }),
}))

import { computeGoalBlockers } from "../blockers/goal-blockers"
import { BlockedIndicator } from "../../ui/shared/status-badge"
import { computePlanInsights } from "./plan-insights-calc"

// Goals (computePlanInsights), Today and Raids Plan (calculateDailyRaids) fed the SAME eligible node
// set (the daily-raids rule the Goals catalog now consumes) must agree on blocker, date and
// Restricted-vs-Blocked presentation.

const hero = unitIdSchema.parse("hero1")
const farmable = upgradeIdSchema.parse("farmable")
const eventOnly = upgradeIdSchema.parse("eventOnly")
const standingNode = battleIdSchema.parse("STANDING")
const eventNode = battleIdSchema.parse("EVENT")

const storageBattles = [
  {
    id: standingNode,
    campaignGroupId: "CG1",
    type: "Normal",
    challenge: false,
    nodeNumber: 1,
    battleIndex: 0,
    energyCost: 6,
    dailyAttempts: 999,
  },
  {
    id: eventNode,
    campaignGroupId: "EV1",
    type: "Normal",
    challenge: false,
    nodeNumber: 1,
    battleIndex: 0,
    energyCost: 6,
    dailyAttempts: 999,
  },
]

const upgrade = (id: typeof farmable, node: string) =>
  ({
    id,
    label: id,
    rarity: "Common",
    stat: "health",
    crafted: false,
    recipe: [],
    farmLocations: [
      {
        battleId: node,
        guaranteed: true,
        effectiveRate: null,
        numerator: null,
        denominator: null,
        isMythic: false,
      },
    ],
  }) as unknown as FarmingUpgrade

const upgradesById = new Map([
  [farmable, upgrade(farmable, standingNode)],
  [eventOnly, upgrade(eventOnly, eventNode)],
])

function eligibleBattles(activeCampaignEventId: string | null) {
  return new Map(
    availableCampaignBattles(
      storageBattles,
      new Set(["EV1"]),
      activeCampaignEventId,
      new Map([
        [
          "EV1:Normal",
          { completedBattleCount: 0, completedChallengeBattlesIds: [] },
        ],
      ])
    ).map((b) => [
      b.id as BattleId,
      { ...b, campaignGroupId: campaignIdSchema.parse(b.campaignGroupId) },
    ])
  )
}

function rankGoal(): GoalDetail {
  return {
    goalId: "goal-1",
    entityType: "Character",
    entityId: hero,
    goalType: "Rank",
    status: "Active",
    notes: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    config: {
      rank: {
        start: rankIndex(rankOrder[0]),
        startPointFive: false,
        startAppliedUpgrades: 0,
        end: rankIndex(rankOrder[1]!),
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
    projectIds: ["project-1"],
    revision: 1,
    globalPriority: 1,
  } as GoalDetail
}

// Only Today and Bonus Raids read these; the Plan and Goals ignore a Raids Filter by design.
const noFilters: RaidsFilters = {
  alliesAlliances: [],
  alliesFactions: [],
  enemiesAlliances: [],
  enemiesFactions: [],
  enemiesTraits: [],
  campaignTypes: [],
  upgradeRarities: [],
  slots: [],
  enemiesTypes: [],
}
const filterBattlesById = new Map(
  [standingNode, eventNode].map((id) => [
    id as string,
    {
      slots: 5,
      alliesAlliance: "Imperial",
      alliesFactions: [],
      enemiesAlliances: [],
      enemiesFactions: [],
      enemiesTraits: [],
      enemiesTotal: 5,
      enemiesTypes: [],
      campaignType: "Normal" as const,
    },
  ])
)

function surfaces(
  upgradeIds: (typeof farmable)[],
  raidsFilters: RaidsFilters = noFilters
) {
  const detail = rankGoal()
  const character = {
    id: hero,
    name: "Synthetic hero",
    rankUpUpgrades: [{ rank: rankOrder[0], upgradeIds }],
  } as unknown as FarmingCharacter
  const battlesById = eligibleBattles(null)
  const shared = {
    details: [detail],
    playerCharacterById: new Map(),
    playerMowById: new Map(),
    inventoryShardById: new Map(),
    inventoryUpgrades: [],
    upgradesById,
    battlesById,
    charactersById: new Map(),
    mowsById: new Map(),
    ascensionCostsById: new Map(),
    unlockShardCostsById: new Map(),
    getCharacter: () => character,
    dailyEnergy: 100,
  }
  const plan = calculateDailyRaids({
    ...shared,
    members: [{ goal: detail }] as never,
    referenceDate: new Date("2026-01-01T00:00:00.000Z"),
    raidsFilters,
    filterBattlesById,
  })
  const insights = computePlanInsights({
    ...shared,
    priorityByGoalId: new Map([["goal-1", 1]]),
    releaseTypeByGroupId: new Map(),
    campaignName: (d: { nameKey: string }) => d.nameKey,
    campaignFullLabel: (d: { nameKey: string }) => d.nameKey,
  } as never)
  const estimate = insights.estimates.get("goal-1")
  const blockers = computeGoalBlockers({
    estimateReason:
      estimate?.status === "Blocked" ? estimate.reason : undefined,
    estimatePartial:
      estimate?.status === "Blocked" &&
      (estimate.actionableResourceIds?.length ?? 0) > 0,
    unreachedPrerequisiteGoalIds: [],
    playerDataUnavailable: false,
    catalogDataUnavailable: false,
  })
  return { plan, estimate, blockers }
}

describe("Goals, Today and Raids Plan agree on a partly blocked goal", () => {
  it("shares one eligibility rule: an inactive-event-only material is unavailable, the active event's reached node is not", () => {
    expect([...eligibleBattles(null).keys()]).toEqual([standingNode])
    expect([...eligibleBattles("EV1").keys()]).toEqual([
      standingNode,
      eventNode,
    ])
  })

  it("mixed (Ragnar-like): Restricted on Goals, one blocker, no date, farmable work in Today and Plan", () => {
    const { plan, estimate, blockers } = surfaces([farmable, eventOnly])

    expect(plan?.status).toBe("ready")
    expect(plan?.today.entries.map((e) => e.resourceId)).toEqual([farmable])
    expect(plan?.today).toEqual(plan?.planDays[0])
    expect(plan?.blockedGoals).toEqual([
      {
        goalId: "goal-1",
        partial: true,
        blockers: [
          { resourceId: eventOnly, reason: "NoFarmLocation", remaining: 1 },
        ],
      },
    ])
    expect(plan?.planSummary.completionDate).toBeNull()

    expect(estimate).toMatchObject({
      status: "Blocked",
      actionableResourceIds: [farmable],
      blockers: plan?.blockedGoals[0]?.blockers,
    })

    render(<BlockedIndicator blockers={blockers} />)
    expect(screen.getByTestId("goal-restricted-indicator")).toBeInTheDocument()
    expect(screen.queryByTestId("goal-blocked-indicator")).toBeNull()
  })

  it("all blocked: Blocked on Goals, nothing scheduled, no date", () => {
    const { plan, estimate, blockers } = surfaces([eventOnly])

    expect(plan?.today.entries).toEqual([])
    expect(plan?.blockedGoals).toEqual([
      {
        goalId: "goal-1",
        partial: false,
        blockers: [
          { resourceId: eventOnly, reason: "NoFarmLocation", remaining: 1 },
        ],
      },
    ])
    expect(plan?.planSummary.completionDate).toBeNull()
    expect(estimate?.status).toBe("Blocked")

    render(<BlockedIndicator blockers={blockers} />)
    expect(screen.getByTestId("goal-blocked-indicator")).toBeInTheDocument()
    expect(screen.queryByTestId("goal-restricted-indicator")).toBeNull()
  })

  it("an active Raids Filter changes Today only: Goals, the Plan and the blockers still agree", () => {
    const unfiltered = surfaces([farmable])
    const filtered = surfaces([farmable], { ...noFilters, slots: [4] })

    // Today lost its only node and says why; the unfiltered Plan day 1 still raids it.
    expect(filtered.plan?.status).toBe("ready")
    expect(filtered.plan?.today.entries).toEqual([])
    expect(filtered.plan?.filteredOut).toEqual([
      { goalId: "goal-1", resourceId: farmable, remaining: 1, pinned: false },
    ])
    expect(unfiltered.plan?.filteredOut).toEqual([])
    expect(
      filtered.plan?.planDays[0]?.entries.map((e) => e.resourceId)
    ).toEqual([farmable])

    // Plan, blockers and the Goals estimate are identical with and without the filter.
    expect(filtered.plan?.planDays).toEqual(unfiltered.plan?.planDays)
    expect(filtered.plan?.planSummary).toEqual(unfiltered.plan?.planSummary)
    expect(filtered.plan?.blockedGoals).toEqual(unfiltered.plan?.blockedGoals)
    expect(filtered.plan?.resourceUrgencyByGoalAndResource).toEqual(
      unfiltered.plan?.resourceUrgencyByGoalAndResource
    )
    expect(filtered.estimate).toEqual(unfiltered.estimate)
    expect(filtered.blockers).toEqual(unfiltered.blockers)
  })
})
