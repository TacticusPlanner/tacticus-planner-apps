import { describe, expect, it } from "vitest"
import {
  battleIdSchema,
  campaignIdSchema,
  upgradeIdSchema,
} from "@workspace/game-domain"

import type { Battle, FarmLocation } from "@/shared/lib"

import {
  computeCampaignInsights,
  dropRate,
  type CampaignInsightUpgrade,
} from "./campaign-insights"

type RawBattle = Omit<Battle, "campaignGroupId"> & { campaignGroupId: string }
type RawUpgrade = Omit<CampaignInsightUpgrade, "id"> & { id: string }
type RawFarmLocation = Omit<FarmLocation, "battleId"> & { battleId: string }

function computeInsights(
  needs: { id: string; count: number }[],
  upgradesById: ReadonlyMap<string, RawUpgrade>,
  battlesById: ReadonlyMap<string, RawBattle>,
  isEventGroup: (campaignGroupId: string) => boolean,
  resolveLabel: Parameters<typeof computeCampaignInsights>[4],
  topN?: number
) {
  return computeCampaignInsights(
    needs.map((need) => ({ ...need, id: upgradeIdSchema.parse(need.id) })),
    new Map(
      [...upgradesById].map(([id, upgrade]) => [
        upgradeIdSchema.parse(id),
        { ...upgrade, id: upgradeIdSchema.parse(upgrade.id) },
      ])
    ),
    new Map(
      [...battlesById].map(([id, battle]) => [
        battleIdSchema.parse(id),
        {
          ...battle,
          campaignGroupId: campaignIdSchema.parse(battle.campaignGroupId),
        },
      ])
    ),
    isEventGroup,
    resolveLabel,
    topN
  )
}

function location(overrides: Partial<RawFarmLocation>): FarmLocation {
  const value = {
    battleId: "battle1",
    guaranteed: false,
    effectiveRate: null,
    numerator: null,
    denominator: null,
    ...overrides,
  }

  return {
    ...value,
    battleId: battleIdSchema.parse(value.battleId),
  }
}

describe("dropRate", () => {
  it("returns 1 for a guaranteed drop regardless of other fields", () => {
    expect(
      dropRate(
        location({
          guaranteed: true,
          effectiveRate: 0.1,
          numerator: 1,
          denominator: 100,
        })
      )
    ).toBe(1)
  })

  it("prefers effectiveRate over numerator/denominator when both are present", () => {
    expect(
      dropRate(location({ effectiveRate: 0.42, numerator: 1, denominator: 2 }))
    ).toBe(0.42)
  })

  it("falls back to numerator/denominator when effectiveRate is missing", () => {
    expect(dropRate(location({ numerator: 1, denominator: 4 }))).toBe(0.25)
  })

  it("returns 0 when no rate info is available at all", () => {
    expect(dropRate(location({}))).toBe(0)
    expect(dropRate(location({ numerator: 1, denominator: null }))).toBe(0)
  })
})

describe("computeCampaignInsights", () => {
  const battlesById = new Map<string, RawBattle>([
    [
      "std-node-1",
      {
        campaignGroupId: "campaign1",
        type: "Standard",
        challenge: false,
        nodeNumber: 1,
        energyCost: 6,
      },
    ],
    [
      "std-node-2",
      {
        campaignGroupId: "campaign1",
        type: "Standard",
        challenge: false,
        nodeNumber: 2,
        energyCost: 6,
      },
    ],
    [
      "elite-node",
      {
        campaignGroupId: "elite2",
        type: "Elite",
        challenge: false,
        nodeNumber: 5,
        energyCost: 12,
      },
    ],
    [
      "event-node",
      {
        campaignGroupId: "eventCampaign1",
        type: "Standard",
        challenge: false,
        nodeNumber: 3,
        energyCost: 5,
      },
    ],
    [
      "event-node-extremis",
      {
        campaignGroupId: "eventCampaign1",
        type: "Extremis",
        challenge: false,
        nodeNumber: 3,
        energyCost: 8,
      },
    ],
  ])

  const isEventGroup = (groupId: string) => groupId === "eventCampaign1"
  // Stand-in for the real i18n-driven resolver (`useCampaignDisplay()`'s bound resolvers) —
  // computeCampaignInsights only needs *some* string back, so this keeps the test decoupled from
  // translation content and just echoes the descriptor's nameKey/difficultyToken.
  const resolveLabel = (
    descriptor: { nameKey: string; difficultyToken: string },
    isEvent: boolean
  ) =>
    isEvent
      ? descriptor.nameKey
      : `${descriptor.nameKey}:${descriptor.difficultyToken}`

  it("dedups energy cost per distinct battle within a chip (two upgrades, same node)", () => {
    const upgradesById = new Map<string, RawUpgrade>([
      [
        "rare1",
        {
          id: "rare1",
          rarity: "Rare",
          farmLocations: [
            location({ battleId: "std-node-1", guaranteed: true }),
          ],
        },
      ],
      [
        "rare2",
        {
          id: "rare2",
          rarity: "Rare",
          farmLocations: [
            location({ battleId: "std-node-1", guaranteed: true }),
          ],
        },
      ],
    ])
    const needs = [
      { id: "rare1", count: 1 },
      { id: "rare2", count: 1 },
    ]

    const { campaignInsights } = computeInsights(
      needs,
      upgradesById,
      battlesById,
      isEventGroup,
      resolveLabel
    )

    expect(campaignInsights).toHaveLength(1)
    // rarityWeight(Rare) = rarityRank("Rare")+1 = 3; value = 3*1*1 + 3*1*1 = 6; energy counted
    // once for the shared battle (6), not twice (12).
    expect(campaignInsights[0]).toMatchObject({
      id: "campaign1:Standard",
      label: "indomitus:standard",
      score: 1,
    })
    expect(campaignInsights[0].contributions).toHaveLength(2)
    expect(campaignInsights[0].contributions[0]).toMatchObject({
      battleId: "std-node-1",
      dropRate: 1,
      value: 3,
    })
  })

  it("ranks a guaranteed high-rarity/cheap-energy node above a low-rarity/expensive, low-chance one", () => {
    const upgradesById = new Map<string, RawUpgrade>([
      [
        "legendary1",
        {
          id: "legendary1",
          rarity: "Legendary",
          farmLocations: [
            location({ battleId: "std-node-1", guaranteed: true }),
          ],
        },
      ],
      [
        "common1",
        {
          id: "common1",
          rarity: "Common",
          farmLocations: [
            location({ battleId: "elite-node", effectiveRate: 0.05 }),
          ],
        },
      ],
    ])
    const needs = [
      { id: "legendary1", count: 1 },
      { id: "common1", count: 1 },
    ]

    const { campaignInsights } = computeInsights(
      needs,
      upgradesById,
      battlesById,
      isEventGroup,
      resolveLabel
    )

    expect(campaignInsights.map((c) => c.id)).toEqual([
      "campaign1:Standard",
      "elite2:Elite",
    ])
  })

  it("splits event campaigns into a separate ranked list", () => {
    const upgradesById = new Map<string, RawUpgrade>([
      [
        "eventMat",
        {
          id: "eventMat",
          rarity: "Epic",
          farmLocations: [
            location({ battleId: "event-node", guaranteed: true }),
          ],
        },
      ],
    ])
    const needs = [{ id: "eventMat", count: 1 }]

    const { campaignInsights, eventInsights } = computeInsights(
      needs,
      upgradesById,
      battlesById,
      isEventGroup,
      resolveLabel
    )

    expect(campaignInsights).toEqual([])
    expect(eventInsights).toHaveLength(1)
    expect(eventInsights[0]).toMatchObject({
      id: "eventCampaign1",
      label: "death-guard-vs-admech",
    })
  })

  it("merges an event's difficulty tiers (Standard + Extremis) into one chip and sums their scores", () => {
    const upgradesById = new Map<string, RawUpgrade>([
      [
        "eventMat",
        {
          id: "eventMat",
          rarity: "Epic",
          farmLocations: [
            location({ battleId: "event-node", guaranteed: true }),
            location({ battleId: "event-node-extremis", guaranteed: true }),
          ],
        },
      ],
    ])
    const needs = [{ id: "eventMat", count: 1 }]

    const { eventInsights } = computeInsights(
      needs,
      upgradesById,
      battlesById,
      isEventGroup,
      resolveLabel
    )

    expect(eventInsights).toHaveLength(1)
    // rarityWeight(Epic) = 4; value = 4*1*1 (Standard) + 4*1*1 (Extremis) = 8;
    // energy = 5 (Standard node) + 8 (Extremis node) = 13.
    expect(eventInsights[0]).toMatchObject({
      id: "eventCampaign1",
      score: 8 / 13,
    })
    expect(eventInsights[0].contributions).toHaveLength(2)
    expect(eventInsights[0].contributions.map((c) => c.type).sort()).toEqual([
      "Extremis",
      "Standard",
    ])
    // Each tier keeps its own value-per-energy score: Standard = 4/5, Extremis = 4/8, independent
    // of the combined chip score above.
    expect(eventInsights[0].tierScores).toEqual([
      { tier: "standard", score: 4 / 5 },
      { tier: "extremis", score: 4 / 8 },
    ])
  })

  it("leaves tierScores unset for a regular (non-event) campaign chip", () => {
    const upgradesById = new Map<string, RawUpgrade>([
      [
        "rare1",
        {
          id: "rare1",
          rarity: "Rare",
          farmLocations: [
            location({ battleId: "std-node-1", guaranteed: true }),
          ],
        },
      ],
    ])
    const { campaignInsights } = computeInsights(
      [{ id: "rare1", count: 1 }],
      upgradesById,
      battlesById,
      isEventGroup,
      resolveLabel
    )

    expect(campaignInsights[0].tierScores).toBeUndefined()
  })

  it("truncates to the requested top-N, sorted by score descending", () => {
    const upgradesById = new Map<string, RawUpgrade>([
      [
        "legendary1",
        {
          id: "legendary1",
          rarity: "Legendary",
          farmLocations: [
            location({ battleId: "std-node-1", guaranteed: true }),
          ],
        },
      ],
      [
        "common1",
        {
          id: "common1",
          rarity: "Common",
          farmLocations: [
            location({ battleId: "elite-node", effectiveRate: 0.5 }),
          ],
        },
      ],
    ])
    const needs = [
      { id: "legendary1", count: 1 },
      { id: "common1", count: 1 },
    ]

    const { campaignInsights } = computeInsights(
      needs,
      upgradesById,
      battlesById,
      isEventGroup,
      resolveLabel,
      1
    )

    expect(campaignInsights).toHaveLength(1)
    expect(campaignInsights[0].id).toBe("campaign1:Standard")
  })

  it("skips a location whose battle id isn't in the catalog", () => {
    const upgradesById = new Map<string, RawUpgrade>([
      [
        "orphan",
        {
          id: "orphan",
          rarity: "Common",
          farmLocations: [
            location({ battleId: "unknown-battle", guaranteed: true }),
          ],
        },
      ],
    ])

    const { campaignInsights, eventInsights } = computeInsights(
      [{ id: "orphan", count: 1 }],
      upgradesById,
      battlesById,
      isEventGroup,
      resolveLabel
    )

    expect(campaignInsights).toEqual([])
    expect(eventInsights).toEqual([])
  })
})
