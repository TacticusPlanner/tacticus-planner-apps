import { describe, expect, it } from "vitest"

import type { GameCatalogGuildRaidMeta } from "@workspace/game-catalog"

import { resolveGuildRaidExactReadiness } from "./resolve-guild-raid-exact-readiness"

const heroA = "heroA"
const heroB = "heroB"
const heroC = "heroC"
const heroD = "heroD"
const heroE = "heroE"

function heroSlots(heroIds: string[]) {
  return heroIds.map((heroId) => ({
    heroId,
    roleId: "flex",
    essential: false,
    replacementCharacterIds: [],
  }))
}

function meta(
  overrides: Partial<GameCatalogGuildRaidMeta> = {}
): GameCatalogGuildRaidMeta {
  return {
    sourceId: "terminus-maximus-guild-raid-boss-meta",
    updatedOn: "2026-07-01",
    comps: [
      {
        id: "comp1",
        signatureUnitId: heroA,
        coreCharacterIds: [heroA, heroB],
        flexCharacterIds: [],
        mowIds: ["mowX"],
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
            heroSlots: heroSlots([heroA, heroB, heroC, heroD, heroE]),
            mowId: "mowX",
            mowReplacementIds: [],
            compIds: ["comp1"],
            efficiency: 1,
          },
        ],
      },
    ],
    primes: [],
    ...overrides,
  }
}

describe("resolveGuildRaidExactReadiness", () => {
  it("reports absentMeta when no local Meta dataset exists", () => {
    expect(
      resolveGuildRaidExactReadiness({
        bossUnitSetId: "Boss1",
        meta: null,
        roster: { ownedCharacterIds: new Set(), ownedMowIds: new Set() },
      })
    ).toEqual({ status: "absentMeta" })
  })

  it("reports noBossRecommendation when the boss has no authored group", () => {
    expect(
      resolveGuildRaidExactReadiness({
        bossUnitSetId: "UnknownBoss",
        meta: meta(),
        roster: { ownedCharacterIds: new Set(), ownedMowIds: new Set() },
      })
    ).toEqual({ status: "noBossRecommendation" })
  })

  it("reports noBossRecommendation when the boss group has zero recommendations", () => {
    expect(
      resolveGuildRaidExactReadiness({
        bossUnitSetId: "Boss1",
        meta: meta({
          bosses: [
            {
              bossUnitSetId: "Boss1",
              primeUnitSetIds: [],
              recommendations: [],
            },
          ],
        }),
        roster: { ownedCharacterIds: new Set(), ownedMowIds: new Set() },
      })
    ).toEqual({ status: "noBossRecommendation" })
  })

  it("reports missingRoster with the authored recommendations when roster data is absent", () => {
    const result = resolveGuildRaidExactReadiness({
      bossUnitSetId: "Boss1",
      meta: meta(),
      roster: undefined,
    })

    expect(result).toEqual({
      status: "missingRoster",
      recommendations: meta().bosses[0]!.recommendations,
    })
  })

  it.each([
    {
      name: "Ready when all five exact heroes are owned",
      owned: [heroA, heroB, heroC, heroD, heroE],
      expected: "ready",
    },
    {
      name: "Partial when one exact hero is owned",
      owned: [heroA],
      expected: "partial",
    },
    {
      name: "Partial when four exact heroes are owned",
      owned: [heroA, heroB, heroC, heroD],
      expected: "partial",
    },
    {
      name: "Unavailable when none of the five exact heroes are owned",
      owned: [],
      expected: "unavailable",
    },
  ])("classifies as $expected — $name", ({ owned, expected }) => {
    const result = resolveGuildRaidExactReadiness({
      bossUnitSetId: "Boss1",
      meta: meta(),
      roster: {
        ownedCharacterIds: new Set(owned),
        ownedMowIds: new Set(),
      },
    })

    expect(result.status).toBe("populated")
    if (result.status !== "populated") return
    expect(result.recommendations[0]!.classification).toBe(expected)
  })

  it("preserves authored heroSlots order and reports each hero owned/missing", () => {
    const result = resolveGuildRaidExactReadiness({
      bossUnitSetId: "Boss1",
      meta: meta(),
      roster: {
        ownedCharacterIds: new Set([heroA, heroC, heroE]),
        ownedMowIds: new Set(),
      },
    })

    expect(result.status).toBe("populated")
    if (result.status !== "populated") return
    expect(result.recommendations[0]!.heroes).toEqual([
      { id: heroA, owned: true },
      { id: heroB, owned: false },
      { id: heroC, owned: true },
      { id: heroD, owned: false },
      { id: heroE, owned: true },
    ])
  })

  it("tolerates a recommendation cached before variant rules existed, without heroSlots", () => {
    const legacyMeta = meta({
      bosses: [
        {
          bossUnitSetId: "Boss1",
          primeUnitSetIds: [],
          recommendations: [
            {
              kind: "meta",
              mowId: "mowX",
              compIds: ["comp1"],
              // `heroSlots` is absent, as an older cached row would be.
            } as unknown as ReturnType<
              typeof meta
            >["bosses"][0]["recommendations"][0],
          ],
        },
      ],
    })

    const result = resolveGuildRaidExactReadiness({
      bossUnitSetId: "Boss1",
      meta: legacyMeta,
      roster: { ownedCharacterIds: new Set(), ownedMowIds: new Set() },
    })

    expect(result.status).toBe("populated")
    if (result.status !== "populated") return
    expect(result.recommendations[0]!.heroes).toEqual([])
    expect(result.recommendations[0]!.classification).toBe("unavailable")
  })

  it("reports Machine-of-War ownership separately without changing hero classification", () => {
    const owningMowOnly = resolveGuildRaidExactReadiness({
      bossUnitSetId: "Boss1",
      meta: meta(),
      roster: { ownedCharacterIds: new Set(), ownedMowIds: new Set(["mowX"]) },
    })
    expect(owningMowOnly.status).toBe("populated")
    if (owningMowOnly.status !== "populated") return
    expect(owningMowOnly.recommendations[0]!.mowOwned).toBe(true)
    expect(owningMowOnly.recommendations[0]!.classification).toBe("unavailable")

    const missingMowOnly = resolveGuildRaidExactReadiness({
      bossUnitSetId: "Boss1",
      meta: meta(),
      roster: {
        ownedCharacterIds: new Set([heroA, heroB, heroC, heroD, heroE]),
        ownedMowIds: new Set(),
      },
    })
    expect(missingMowOnly.status).toBe("populated")
    if (missingMowOnly.status !== "populated") return
    expect(missingMowOnly.recommendations[0]!.mowOwned).toBe(false)
    expect(missingMowOnly.recommendations[0]!.classification).toBe("ready")
  })

  it("never lets Comp membership invent a replacement or change classification", () => {
    // Owning every Comp-listed unit (signature + core + flex + mow) without owning any exact hero
    // must still classify as Unavailable — Comp ids are attribution only.
    const result = resolveGuildRaidExactReadiness({
      bossUnitSetId: "Boss1",
      meta: meta(),
      roster: {
        ownedCharacterIds: new Set(["someOtherComp1Member"]),
        ownedMowIds: new Set(["mowX"]),
      },
    })

    expect(result.status).toBe("populated")
    if (result.status !== "populated") return
    expect(result.recommendations[0]!.classification).toBe("unavailable")
    expect(result.recommendations[0]!.heroes.every((hero) => !hero.owned)).toBe(
      true
    )
  })

  it("recomputes recommendations when the boss changes", () => {
    const twoBossMeta = meta({
      bosses: [
        ...meta().bosses,
        {
          bossUnitSetId: "Boss2",
          primeUnitSetIds: [],
          recommendations: [
            {
              id: "Boss2-alternate",
              kind: "alternate",
              heroSlots: heroSlots([heroB, heroC, heroD, heroE, heroA]),
              mowId: "mowY",
              mowReplacementIds: [],
              compIds: [],
              efficiency: 1,
            },
          ],
        },
      ],
    })
    const roster = {
      ownedCharacterIds: new Set([heroA]),
      ownedMowIds: new Set<string>(),
    }

    const boss1Result = resolveGuildRaidExactReadiness({
      bossUnitSetId: "Boss1",
      meta: twoBossMeta,
      roster,
    })
    const boss2Result = resolveGuildRaidExactReadiness({
      bossUnitSetId: "Boss2",
      meta: twoBossMeta,
      roster,
    })

    expect(boss1Result.status).toBe("populated")
    expect(boss2Result.status).toBe("populated")
    if (
      boss1Result.status !== "populated" ||
      boss2Result.status !== "populated"
    )
      return
    expect(boss1Result.recommendations[0]!.recommendation.mowId).toBe("mowX")
    expect(boss2Result.recommendations[0]!.recommendation.mowId).toBe("mowY")
  })

  it("recomputes recommendations when the roster changes", () => {
    const before = resolveGuildRaidExactReadiness({
      bossUnitSetId: "Boss1",
      meta: meta(),
      roster: { ownedCharacterIds: new Set(), ownedMowIds: new Set() },
    })
    const after = resolveGuildRaidExactReadiness({
      bossUnitSetId: "Boss1",
      meta: meta(),
      roster: {
        ownedCharacterIds: new Set([heroA, heroB, heroC, heroD, heroE]),
        ownedMowIds: new Set(),
      },
    })

    expect(before.status).toBe("populated")
    expect(after.status).toBe("populated")
    if (before.status !== "populated" || after.status !== "populated") return
    expect(before.recommendations[0]!.classification).toBe("unavailable")
    expect(after.recommendations[0]!.classification).toBe("ready")
  })

  it("preserves authored recommendation order across multiple recommendations", () => {
    const multi = meta({
      bosses: [
        {
          bossUnitSetId: "Boss1",
          primeUnitSetIds: [],
          recommendations: [
            {
              id: "Boss1-meta",
              kind: "meta",
              heroSlots: heroSlots([heroA, heroB, heroC, heroD, heroE]),
              mowId: "mowX",
              mowReplacementIds: [],
              compIds: [],
              efficiency: 1,
            },
            {
              id: "Boss1-alternate",
              kind: "alternate",
              heroSlots: heroSlots([heroE, heroD, heroC, heroB, heroA]),
              mowId: "mowY",
              mowReplacementIds: [],
              compIds: [],
              efficiency: 1,
            },
          ],
        },
      ],
    })

    const result = resolveGuildRaidExactReadiness({
      bossUnitSetId: "Boss1",
      meta: multi,
      roster: { ownedCharacterIds: new Set(), ownedMowIds: new Set() },
    })

    expect(result.status).toBe("populated")
    if (result.status !== "populated") return
    expect(
      result.recommendations.map((entry) => entry.recommendation.kind)
    ).toEqual(["meta", "alternate"])
  })
})
