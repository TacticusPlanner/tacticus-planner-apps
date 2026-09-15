import { describe, expect, it } from "vitest"

import type { GameCatalogGuildRaidMeta } from "@workspace/game-catalog"

import {
  buildGuildRaidExactReadinessView,
  buildGuildRaidRosterInvestment,
} from "./build-guild-raid-exact-readiness-view"
import { createGuildRaidMetaPresentationResolver } from "./resolve-guild-raid-meta"
import { resolveGuildRaidExactReadiness } from "./resolve-guild-raid-exact-readiness"

function heroSlots(heroIds: string[]) {
  return heroIds.map((heroId) => ({
    heroId,
    roleId: "flex",
    essential: false,
    replacementCharacterIds: [],
  }))
}

const meta: GameCatalogGuildRaidMeta = {
  sourceId: "terminus-maximus-guild-raid-boss-meta",
  updatedOn: "2026-07-01",
  comps: [
    {
      id: "comp1",
      signatureUnitId: "heroA",
      coreCharacterIds: ["heroA"],
      flexCharacterIds: [],
      mowIds: [],
    },
  ],
  bosses: [
    {
      bossUnitSetId: "Boss1",
      primeUnitSetIds: [],
      recommendations: [
        {
          id: "Boss1-meta",
          kind: "meta",
          heroSlots: heroSlots(["heroA", "heroB", "heroC", "heroD", "heroE"]),
          mowId: "mowX",
          mowReplacementIds: [],
          compIds: ["comp1"],
          efficiency: 1,
        },
      ],
    },
  ],
  primes: [],
}

function presentation() {
  return createGuildRaidMetaPresentationResolver({
    meta,
    charactersById: new Map([
      ["heroA", { id: "heroA", name: "Hero A" }],
      ["heroB", { id: "heroB", name: "Hero B" }],
    ]),
    mowsById: new Map([["mowX", { id: "mowX", name: "Mow X" }]]),
    bossName: (_id, fallback) => fallback,
    roleLabel: (_id, fallback) => fallback,
    kindLabel: (_id, fallback) => fallback,
  })
}

describe("buildGuildRaidExactReadinessView", () => {
  it("passes through absentMeta and noBossRecommendation unchanged", () => {
    expect(
      buildGuildRaidExactReadinessView({
        readiness: { status: "absentMeta" },
        presentation: presentation(),
        meta,
        investmentByCharacterId: new Map(),
        investmentByMowId: new Map(),
      })
    ).toEqual({ status: "absentMeta" })

    expect(
      buildGuildRaidExactReadinessView({
        readiness: { status: "noBossRecommendation" },
        presentation: presentation(),
        meta,
        investmentByCharacterId: new Map(),
        investmentByMowId: new Map(),
      })
    ).toEqual({ status: "noBossRecommendation" })
  })

  it("resolves ideal lineups without ownership when the roster is missing", () => {
    const readiness = resolveGuildRaidExactReadiness({
      bossUnitSetId: "Boss1",
      meta,
      roster: undefined,
    })

    const view = buildGuildRaidExactReadinessView({
      readiness,
      presentation: presentation(),
      meta,
      investmentByCharacterId: new Map(),
      investmentByMowId: new Map(),
    })

    expect(view.status).toBe("missingRoster")
    if (view.status !== "missingRoster") return
    expect(view.source).toEqual({
      sourceId: meta.sourceId,
      name: "Terminus Maximus",
      url: expect.any(String),
    })
    expect(view.updatedOn).toBe(meta.updatedOn)
    expect(view.recommendations).toHaveLength(1)
    expect(view.recommendations[0]!.classification).toBeUndefined()
    expect(
      view.recommendations[0]!.heroes.every((h) => h.owned === undefined)
    ).toBe(true)
    expect(view.recommendations[0]!.heroes.map((h) => h.id)).toEqual([
      "heroA",
      "heroB",
      "heroC",
      "heroD",
      "heroE",
    ])
  })

  it("merges owned/missing state and investment facts without reordering or scoring", () => {
    const readiness = resolveGuildRaidExactReadiness({
      bossUnitSetId: "Boss1",
      meta,
      roster: {
        ownedCharacterIds: new Set(["heroA", "heroC"]),
        ownedMowIds: new Set(["mowX"]),
      },
    })

    const view = buildGuildRaidExactReadinessView({
      readiness,
      presentation: presentation(),
      meta,
      investmentByCharacterId: new Map([
        [
          "heroA",
          {
            xpLevel: 50,
            rank: "Gold2" as never,
            progression: "Rare:FourStars" as never,
            activeAbilityLevel: 12,
            passiveAbilityLevel: 8,
          },
        ],
      ]),
      investmentByMowId: new Map([
        [
          "mowX",
          {
            xpLevel: 10,
            progression: "Common:None" as never,
            activeAbilityLevel: 1,
            passiveAbilityLevel: 1,
          },
        ],
      ]),
    })

    expect(view.status).toBe("populated")
    if (view.status !== "populated") return
    const [recommendation] = view.recommendations
    expect(recommendation!.classification).toBe("partial")
    expect(recommendation!.heroes.map((h) => [h.id, h.owned])).toEqual([
      ["heroA", true],
      ["heroB", false],
      ["heroC", true],
      ["heroD", false],
      ["heroE", false],
    ])
    expect(recommendation!.heroes[0]!.investment).toEqual({
      xpLevel: 50,
      rank: "Gold2",
      progression: "Rare:FourStars",
      activeAbilityLevel: 12,
      passiveAbilityLevel: 8,
    })
    expect(recommendation!.heroes[2]!.investment).toBeUndefined()
    expect(recommendation!.mow).toMatchObject({
      id: "mowX",
      owned: true,
      investment: {
        xpLevel: 10,
        progression: "Common:None",
        activeAbilityLevel: 1,
        passiveAbilityLevel: 1,
      },
    })
    expect(recommendation!.comps).toEqual([
      { id: "comp1", signature: expect.objectContaining({ id: "heroA" }) },
    ])
  })

  it("never uses Comp membership to invent a replacement or reorder recommendations", () => {
    const multiMeta: GameCatalogGuildRaidMeta = {
      ...meta,
      bosses: [
        {
          bossUnitSetId: "Boss1",
          primeUnitSetIds: [],
          recommendations: [
            meta.bosses[0]!.recommendations[0]!,
            {
              id: "Boss1-alternate",
              kind: "alternate",
              heroSlots: heroSlots([
                "heroE",
                "heroD",
                "heroC",
                "heroB",
                "heroA",
              ]),
              mowId: "mowX",
              mowReplacementIds: [],
              compIds: [],
              efficiency: 1,
            },
          ],
        },
      ],
    }
    const readiness = resolveGuildRaidExactReadiness({
      bossUnitSetId: "Boss1",
      meta: multiMeta,
      roster: {
        ownedCharacterIds: new Set(["heroA"]),
        ownedMowIds: new Set(),
      },
    })

    const view = buildGuildRaidExactReadinessView({
      readiness,
      presentation: presentation(),
      meta: multiMeta,
      investmentByCharacterId: new Map(),
      investmentByMowId: new Map(),
    })

    expect(view.status).toBe("populated")
    if (view.status !== "populated") return
    expect(view.recommendations.map((r) => r.kind)).toEqual([
      "meta",
      "alternate",
    ])
    expect(
      view.recommendations.every((r) => r.classification === "partial")
    ).toBe(true)
  })
})

describe("buildGuildRaidRosterInvestment", () => {
  it("carries progressionIndex/activeAbilityLevel/passiveAbilityLevel through from the roster query's fields, defaulting a missing ability track to level 1", () => {
    const result = buildGuildRaidRosterInvestment({
      characters: [
        {
          unitId: "heroA",
          xpLevel: 42,
          rank: "Gold2" as never,
          progressionIndex: "Rare:FourStars" as never,
          abilities: [{ level: 12 }, { level: 8 }],
        },
        {
          unitId: "heroB",
          xpLevel: 1,
          rank: "Stone1" as never,
          progressionIndex: "Common:None" as never,
          // A newly-unlocked character may have no ability records yet.
          abilities: [],
        },
      ],
      mows: [
        {
          unitId: "mowX",
          xpLevel: 5,
          progressionIndex: "Uncommon:TwoStars" as never,
          abilities: [{ level: 3 }],
        },
      ],
    })

    expect(result.ownedCharacterIds).toEqual(new Set(["heroA", "heroB"]))
    expect(result.ownedMowIds).toEqual(new Set(["mowX"]))
    expect(result.investmentByCharacterId.get("heroA")).toEqual({
      xpLevel: 42,
      rank: "Gold2",
      progression: "Rare:FourStars",
      activeAbilityLevel: 12,
      passiveAbilityLevel: 8,
    })
    expect(result.investmentByCharacterId.get("heroB")).toEqual({
      xpLevel: 1,
      rank: "Stone1",
      progression: "Common:None",
      activeAbilityLevel: 1,
      passiveAbilityLevel: 1,
    })
    expect(result.investmentByMowId.get("mowX")).toEqual({
      xpLevel: 5,
      rank: undefined,
      progression: "Uncommon:TwoStars",
      activeAbilityLevel: 3,
      passiveAbilityLevel: 1,
    })
  })
})
