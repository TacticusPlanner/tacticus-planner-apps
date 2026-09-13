import { describe, expect, it } from "vitest"

import type { GameCatalogGuildRaidMeta } from "@workspace/game-catalog"

import { buildGuildRaidExactReadinessView } from "./build-guild-raid-exact-readiness-view"
import { createGuildRaidMetaPresentationResolver } from "./resolve-guild-raid-meta"
import { resolveGuildRaidExactReadiness } from "./resolve-guild-raid-exact-readiness"

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
      recommendations: [
        {
          kind: "meta",
          heroIds: ["heroA", "heroB", "heroC", "heroD", "heroE"],
          mowId: "mowX",
          compIds: ["comp1"],
        },
      ],
    },
  ],
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
        ["heroA", { xpLevel: 50, rank: "Gold2" as never }],
      ]),
      investmentByMowId: new Map([["mowX", { xpLevel: 10 }]]),
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
    })
    expect(recommendation!.heroes[2]!.investment).toBeUndefined()
    expect(recommendation!.mow).toMatchObject({
      id: "mowX",
      owned: true,
      investment: { xpLevel: 10 },
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
          recommendations: [
            meta.bosses[0]!.recommendations[0]!,
            {
              kind: "alternate",
              heroIds: ["heroE", "heroD", "heroC", "heroB", "heroA"],
              mowId: "mowX",
              compIds: [],
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
