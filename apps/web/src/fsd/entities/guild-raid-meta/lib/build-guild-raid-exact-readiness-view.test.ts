import { describe, expect, it } from "vitest"

import type { GameCatalogGuildRaidMeta } from "@workspace/game-catalog"

import {
  buildGuildRaidExactReadinessView,
  buildGuildRaidRosterInvestment,
} from "./build-guild-raid-exact-readiness-view"
import { createGuildRaidMetaPresentationResolver } from "./resolve-guild-raid-meta"

function heroSlots(heroIds: string[]) {
  return heroIds.map((heroId) => ({
    heroId,
    roleId: heroId === "heroA" ? "signature" : "flex",
    essential: heroId === "heroA",
    replacementCharacterIds: heroId === "heroB" ? ["heroZ"] : [],
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
          mowReplacementIds: ["mowY"],
          compIds: ["comp1"],
          efficiency: 1.3,
        },
        {
          id: "Boss1-alternate",
          kind: "alternate",
          heroSlots: heroSlots(["heroE", "heroD", "heroC", "heroB", "heroA"]),
          mowId: "mowX",
          mowReplacementIds: [],
          compIds: [],
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
      ["heroZ", { id: "heroZ", name: "Hero Z" }],
    ]),
    mowsById: new Map([
      ["mowX", { id: "mowX", name: "Mow X" }],
      ["mowY", { id: "mowY", name: "Mow Y" }],
    ]),
    bossName: (_id, fallback) => fallback,
    roleLabel: (_id, fallback) => fallback,
    kindLabel: (_id, fallback) => fallback,
  })
}

const investment = (rank: string, progression: string) => ({
  xpLevel: 50,
  rank: rank as never,
  progression: progression as never,
  activeAbilityLevel: 12,
  passiveAbilityLevel: 8,
})

const roster = {
  ownedCharacterIds: new Set(["heroA", "heroC", "heroZ"]),
  ownedMowIds: new Set(["mowY"]),
  investmentByCharacterId: new Map([
    ["heroA", investment("Gold2", "Rare:FourStars")],
    ["heroC", investment("Gold2", "Rare:FourStars")],
    ["heroZ", investment("Gold2", "Rare:FourStars")],
  ]),
  investmentByMowId: new Map([["mowY", investment("Stone1", "Common:None")]]),
}

const threshold = {
  progression: "Rare:FourStars" as never,
  requiredRank: "Gold2" as never,
  requiredRankIndex: 1,
  requiredProgressionIndex: 1,
  requiredAbilityLevel: 1,
}

describe("buildGuildRaidExactReadinessView", () => {
  it("separates an absent dataset from a boss without recommendations", () => {
    const base = { presentation: presentation(), roster, threshold }

    expect(
      buildGuildRaidExactReadinessView({
        ...base,
        bossUnitSetId: "Boss1",
        meta: null,
      })
    ).toEqual({ status: "absentMeta" })
    expect(
      buildGuildRaidExactReadinessView({
        ...base,
        bossUnitSetId: "Unknown",
        meta,
      })
    ).toEqual({ status: "noBossRecommendation" })
  })

  it("shows ideal lineups with every authored option but no ownership when the roster is missing", () => {
    const view = buildGuildRaidExactReadinessView({
      bossUnitSetId: "Boss1",
      meta,
      presentation: presentation(),
      roster: undefined,
      threshold,
    })

    expect(view.status).toBe("missingRoster")
    if (view.status !== "missingRoster") return
    expect(view.source).toEqual({
      sourceId: meta.sourceId,
      name: "Terminus Maximus",
      url: expect.any(String),
    })
    expect(view.updatedOn).toBe(meta.updatedOn)
    expect(view.threshold).toBeNull()

    const [recommendation] = view.recommendations
    expect(recommendation).toMatchObject({
      kind: { id: "meta", label: "meta" },
      efficiency: 1.3,
    })
    expect(recommendation!.status).toBeUndefined()
    expect(recommendation!.teamReadiness).toBeUndefined()
    expect(recommendation!.slots.map((slot) => slot.ideal.id)).toEqual([
      "heroA",
      "heroB",
      "heroC",
      "heroD",
      "heroE",
      "mowX",
    ])
    expect(recommendation!.slots.every((slot) => slot.picked === null)).toBe(
      true
    )
    expect(
      recommendation!.slots[1]!.options.map((option) => [
        option.unit.name,
        option.isIdeal,
        option.state,
      ])
    ).toEqual([
      ["Hero B", true, undefined],
      ["Hero Z", false, undefined],
    ])
    expect(
      recommendation!.slots[5]!.options.map((option) => option.unit.id)
    ).toEqual(["mowX", "mowY"])
  })

  it("resolves picks, substitutes, names and investment for every slot", () => {
    const view = buildGuildRaidExactReadinessView({
      bossUnitSetId: "Boss1",
      meta,
      presentation: presentation(),
      roster,
      threshold,
    })

    expect(view.status).toBe("populated")
    if (view.status !== "populated") return
    expect(view.threshold).toBe(threshold)
    // Authored order survives; nothing is ranked by readiness.
    expect(view.recommendations.map((r) => r.id)).toEqual([
      "Boss1-meta",
      "Boss1-alternate",
    ])

    const [recommendation] = view.recommendations
    expect(recommendation!.status).toBe("substitutes")
    expect(recommendation!.teamReadiness).toBeGreaterThan(0)
    expect(
      recommendation!.slots.map((slot) => [
        slot.role?.id,
        slot.essential,
        slot.picked?.id ?? null,
        slot.isSubstitute,
      ])
    ).toEqual([
      ["signature", true, "heroA", false],
      ["flex", false, "heroZ", true],
      ["flex", false, "heroC", false],
      ["flex", false, null, false],
      ["flex", false, null, false],
      [undefined, false, "mowY", true],
    ])

    const substituteSlot = recommendation!.slots[1]!
    expect(substituteSlot.ideal).toMatchObject({ name: "Hero B", owned: false })
    expect(substituteSlot.options[1]).toMatchObject({
      unit: {
        id: "heroZ",
        owned: true,
        investment: expect.objectContaining({ rank: "Gold2" }),
      },
      state: "picked",
      readiness: expect.any(Number),
    })
    expect(recommendation!.comps).toEqual([
      { id: "comp1", signature: expect.objectContaining({ id: "heroA" }) },
    ])
  })

  it("keeps picks and status but withholds percentages without a threshold", () => {
    const view = buildGuildRaidExactReadinessView({
      bossUnitSetId: "Boss1",
      meta,
      presentation: presentation(),
      roster,
      threshold: null,
    })

    if (view.status !== "populated") throw new Error(view.status)
    const [recommendation] = view.recommendations
    expect(view.threshold).toBeNull()
    expect(recommendation!.status).toBe("substitutes")
    expect(recommendation!.teamReadiness).toBeUndefined()
    expect(recommendation!.slots[1]!.picked?.id).toBe("heroZ")
    expect(recommendation!.slots[1]!.readiness).toBeUndefined()
  })
})

describe("buildGuildRaidRosterInvestment", () => {
  it("carries progressionIndex/activeAbilityLevel/passiveAbilityLevel through from the roster query's fields, defaulting a missing ability track to level 1", () => {
    const result = buildGuildRaidRosterInvestment({
      characters: [
        {
          unitId: "heroA",
          xpLevel: 42,
          rank: "Gold2",
          progressionIndex: "Rare:FourStars",
          abilities: [{ level: 12 }, { level: 8 }],
        },
        {
          unitId: "heroB",
          xpLevel: 1,
          rank: "Stone1",
          progressionIndex: "Common:None",
          // A newly-unlocked character may have no ability records yet.
          abilities: [],
        },
      ],
      mows: [
        {
          unitId: "mowX",
          xpLevel: 5,
          progressionIndex: "Uncommon:TwoStars",
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
