import { describe, expect, it } from "vitest"

import {
  computeCampaignInsights,
  dropRate,
  type BattleLike,
  type FarmLocationLike,
  type UpgradeWithFarmLocations,
} from "./campaign-insights"

function location(overrides: Partial<FarmLocationLike>): FarmLocationLike {
  return {
    battleId: "battle1",
    guaranteed: false,
    effectiveRate: null,
    numerator: null,
    denominator: null,
    ...overrides,
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
  const battlesById = new Map<string, BattleLike>([
    [
      "std-node-1",
      {
        campaignGroupId: "indomitus",
        difficulty: "standard",
        nodeNumber: 1,
        energyCost: 6,
      },
    ],
    [
      "std-node-2",
      {
        campaignGroupId: "indomitus",
        difficulty: "standard",
        nodeNumber: 2,
        energyCost: 6,
      },
    ],
    [
      "elite-node",
      {
        campaignGroupId: "fall-of-cadia",
        difficulty: "elite",
        nodeNumber: 5,
        energyCost: 12,
      },
    ],
    [
      "event-node",
      {
        campaignGroupId: "death-guard-vs-admech",
        difficulty: "eventStandard",
        nodeNumber: 3,
        energyCost: 5,
      },
    ],
    [
      "event-node-extremis",
      {
        campaignGroupId: "death-guard-vs-admech",
        difficulty: "eventExtremis",
        nodeNumber: 3,
        energyCost: 8,
      },
    ],
  ])

  const isEventGroup = (groupId: string) => groupId === "death-guard-vs-admech"
  // Stand-in for the real i18n-driven resolver (`campaignDisplayFullLabel`/`campaignDisplayName`)
  // — computeCampaignInsights only needs *some* string back, so this keeps the test decoupled
  // from translation content and just echoes the descriptor's nameKey/difficultyToken.
  const resolveLabel = (
    descriptor: { nameKey: string; difficultyToken: string },
    isEvent: boolean
  ) =>
    isEvent
      ? descriptor.nameKey
      : `${descriptor.nameKey}:${descriptor.difficultyToken}`

  it("dedups energy cost per distinct battle within a chip (two upgrades, same node)", () => {
    const upgradesById = new Map<string, UpgradeWithFarmLocations>([
      [
        "rare1",
        {
          id: "rare1",
          label: "Rare 1",
          rarity: "Rare",
          stat: "Health",
          crafted: false,
          recipe: [],
          farmLocations: [
            location({ battleId: "std-node-1", guaranteed: true }),
          ],
        },
      ],
      [
        "rare2",
        {
          id: "rare2",
          label: "Rare 2",
          rarity: "Rare",
          stat: "Damage",
          crafted: false,
          recipe: [],
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

    const { campaignInsights } = computeCampaignInsights(
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
      id: "indomitus:standard",
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
    const upgradesById = new Map<string, UpgradeWithFarmLocations>([
      [
        "legendary1",
        {
          id: "legendary1",
          label: "Legendary 1",
          rarity: "Legendary",
          stat: "Health",
          crafted: false,
          recipe: [],
          farmLocations: [
            location({ battleId: "std-node-1", guaranteed: true }),
          ],
        },
      ],
      [
        "common1",
        {
          id: "common1",
          label: "Common 1",
          rarity: "Common",
          stat: "Health",
          crafted: false,
          recipe: [],
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

    const { campaignInsights } = computeCampaignInsights(
      needs,
      upgradesById,
      battlesById,
      isEventGroup,
      resolveLabel
    )

    expect(campaignInsights.map((c) => c.id)).toEqual([
      "indomitus:standard",
      "fall-of-cadia:elite",
    ])
  })

  it("splits event campaigns into a separate ranked list", () => {
    const upgradesById = new Map<string, UpgradeWithFarmLocations>([
      [
        "eventMat",
        {
          id: "eventMat",
          label: "Event Material",
          rarity: "Epic",
          stat: "Armour",
          crafted: false,
          recipe: [],
          farmLocations: [
            location({ battleId: "event-node", guaranteed: true }),
          ],
        },
      ],
    ])
    const needs = [{ id: "eventMat", count: 1 }]

    const { campaignInsights, eventInsights } = computeCampaignInsights(
      needs,
      upgradesById,
      battlesById,
      isEventGroup,
      resolveLabel
    )

    expect(campaignInsights).toEqual([])
    expect(eventInsights).toHaveLength(1)
    expect(eventInsights[0]).toMatchObject({
      id: "death-guard-vs-admech",
      label: "death-guard-vs-admech",
    })
  })

  it("merges an event's difficulty tiers (Standard + Extremis) into one chip and sums their scores", () => {
    const upgradesById = new Map<string, UpgradeWithFarmLocations>([
      [
        "eventMat",
        {
          id: "eventMat",
          label: "Event Material",
          rarity: "Epic",
          stat: "Armour",
          crafted: false,
          recipe: [],
          farmLocations: [
            location({ battleId: "event-node", guaranteed: true }),
            location({ battleId: "event-node-extremis", guaranteed: true }),
          ],
        },
      ],
    ])
    const needs = [{ id: "eventMat", count: 1 }]

    const { eventInsights } = computeCampaignInsights(
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
      id: "death-guard-vs-admech",
      score: 8 / 13,
    })
    expect(eventInsights[0].contributions).toHaveLength(2)
    expect(
      eventInsights[0].contributions.map((c) => c.difficulty).sort()
    ).toEqual(["eventExtremis", "eventStandard"])
    // Each tier keeps its own value-per-energy score: Standard = 4/5, Extremis = 4/8, independent
    // of the combined chip score above.
    expect(eventInsights[0].tierScores).toEqual([
      { tier: "standard", score: 4 / 5 },
      { tier: "extremis", score: 4 / 8 },
    ])
  })

  it("leaves tierScores unset for a regular (non-event) campaign chip", () => {
    const upgradesById = new Map<string, UpgradeWithFarmLocations>([
      [
        "rare1",
        {
          id: "rare1",
          label: "Rare 1",
          rarity: "Rare",
          stat: "Health",
          crafted: false,
          recipe: [],
          farmLocations: [
            location({ battleId: "std-node-1", guaranteed: true }),
          ],
        },
      ],
    ])
    const { campaignInsights } = computeCampaignInsights(
      [{ id: "rare1", count: 1 }],
      upgradesById,
      battlesById,
      isEventGroup,
      resolveLabel
    )

    expect(campaignInsights[0].tierScores).toBeUndefined()
  })

  it("truncates to the requested top-N, sorted by score descending", () => {
    const upgradesById = new Map<string, UpgradeWithFarmLocations>([
      [
        "legendary1",
        {
          id: "legendary1",
          label: "Legendary 1",
          rarity: "Legendary",
          stat: "Health",
          crafted: false,
          recipe: [],
          farmLocations: [
            location({ battleId: "std-node-1", guaranteed: true }),
          ],
        },
      ],
      [
        "common1",
        {
          id: "common1",
          label: "Common 1",
          rarity: "Common",
          stat: "Health",
          crafted: false,
          recipe: [],
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

    const { campaignInsights } = computeCampaignInsights(
      needs,
      upgradesById,
      battlesById,
      isEventGroup,
      resolveLabel,
      1
    )

    expect(campaignInsights).toHaveLength(1)
    expect(campaignInsights[0].id).toBe("indomitus:standard")
  })

  it("skips a location whose battle id isn't in the catalog", () => {
    const upgradesById = new Map<string, UpgradeWithFarmLocations>([
      [
        "orphan",
        {
          id: "orphan",
          label: "Orphan",
          rarity: "Common",
          stat: "Health",
          crafted: false,
          recipe: [],
          farmLocations: [
            location({ battleId: "unknown-battle", guaranteed: true }),
          ],
        },
      ],
    ])

    const { campaignInsights, eventInsights } = computeCampaignInsights(
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
