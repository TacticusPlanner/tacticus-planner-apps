import Dexie from "dexie"
import { beforeEach, describe, expect, it } from "vitest"

import {
  catalogDbName,
  replaceGameCatalogDataset,
} from "./game-catalog-storage"
import {
  getCharacters,
  getGuildRaidMeta,
  getGuildRaidMetaForBoss,
  getGuildRaidMetaForPrime,
} from "./queries"

function resetDb() {
  return Dexie.delete(catalogDbName)
}

function metadata() {
  return {
    key: "guild-raid-meta" as const,
    hash: "guild-raid-meta-h1",
    catalogVersion: "dev-1",
    gameVersion: "1.42",
    schemaVersion: 2,
    updatedAt: new Date().toISOString(),
  }
}

const payload = {
  sourceId: "terminus-maximus-guild-raid-boss-meta",
  updatedOn: "2026-07-01",
  comps: [
    {
      id: "admech",
      signatureUnitId: "admecActus",
      coreCharacterIds: ["admecActus", "eldarEldryon"],
      flexCharacterIds: ["blackTemplarBellator"],
      mowIds: ["mowBiovore"],
    },
  ],
  bosses: [
    {
      bossUnitSetId: "GuildBoss1Boss1Tervigon",
      recommendations: [
        {
          kind: "meta" as const,
          heroIds: [
            "admecActus",
            "eldarEldryon",
            "blackTemplarBellator",
            "tauRevas",
            "orksGibbascrapz",
          ],
          mowId: "mowBiovore",
          compIds: ["admech"],
        },
      ],
    },
  ],
}

describe("guild-raid-meta queries", () => {
  beforeEach(async () => {
    await resetDb()
  })

  it("reports an absent dataset distinctly from a known boss without a group", async () => {
    expect(await getGuildRaidMeta()).toBeNull()
    expect(await getGuildRaidMetaForBoss("GuildBoss1Boss1Tervigon")).toBeNull()

    await replaceGameCatalogDataset("guild-raid-meta", payload, metadata())

    const missingBoss = await getGuildRaidMetaForBoss("GuildBoss9Boss1Unknown")
    expect(missingBoss?.meta.id).toBe("guild-raid-meta")
    expect(missingBoss?.boss).toBeNull()
  })

  it("preserves authored Comp and recommendation ordering in the fixed catalog row", async () => {
    await replaceGameCatalogDataset("guild-raid-meta", payload, metadata())

    const meta = await getGuildRaidMeta()
    const boss = await getGuildRaidMetaForBoss("GuildBoss1Boss1Tervigon")

    expect(meta?.id).toBe("guild-raid-meta")
    expect(meta?.comps[0]).toMatchObject({
      id: "admech",
      coreCharacterIds: ["admecActus", "eldarEldryon"],
      flexCharacterIds: ["blackTemplarBellator"],
      mowIds: ["mowBiovore"],
    })
    expect(boss?.boss?.recommendations[0]).toMatchObject({
      kind: "meta",
      heroIds: [
        "admecActus",
        "eldarEldryon",
        "blackTemplarBellator",
        "tauRevas",
        "orksGibbascrapz",
      ],
      mowId: "mowBiovore",
    })
  })

  it("keeps an older cached recommendation's exact fields readable while reporting its rules unavailable, then replaces it atomically after sync without disturbing unrelated datasets", async () => {
    const character = {
      id: "admecActus",
      name: "Actus",
      faction: "Adeptus Mechanicus",
      alliance: "Imperial",
    }
    await replaceGameCatalogDataset("characters", [character], {
      key: "characters",
      hash: "characters-h1",
      catalogVersion: "dev-1",
      gameVersion: "1.42",
      schemaVersion: 2,
      updatedAt: new Date().toISOString(),
    })

    // `payload` (above) predates variant rules: no recommendation carries id/heroSlots/mowReplacementIds.
    await replaceGameCatalogDataset("guild-raid-meta", payload, metadata())

    const stale = await getGuildRaidMetaForBoss("GuildBoss1Boss1Tervigon")
    const staleRecommendation = stale?.boss?.recommendations[0]
    expect(staleRecommendation).toMatchObject({
      kind: "meta",
      mowId: "mowBiovore",
    })
    expect(staleRecommendation?.heroSlots).toBeUndefined()

    const currentPayload = {
      ...payload,
      bosses: [
        {
          bossUnitSetId: "GuildBoss1Boss1Tervigon",
          recommendations: [
            {
              ...payload.bosses[0]!.recommendations[0],
              id: "GuildBoss1Boss1Tervigon-meta",
              heroSlots: payload.bosses[0]!.recommendations[0]!.heroIds.map(
                (heroId) => ({
                  heroId,
                  roleId: "flex",
                  essential: false,
                  replacementCharacterIds: [],
                })
              ),
              mowReplacementIds: [],
              efficiency: 1,
            },
          ],
        },
      ],
    }

    await replaceGameCatalogDataset(
      "guild-raid-meta",
      currentPayload,
      metadata()
    )

    const current = await getGuildRaidMetaForBoss("GuildBoss1Boss1Tervigon")
    const currentRecommendation = current?.boss?.recommendations[0]
    expect(currentRecommendation?.heroSlots).toBeDefined()

    // The unrelated `characters` store was untouched by either guild-raid-meta replacement.
    expect(await getCharacters()).toEqual([character])
  })

  it("preserves authored heroSlot/replacement/mowReplacement order and never derives replacements from Comp membership", async () => {
    const rulesPayload = {
      sourceId: "terminus-maximus-guild-raid-boss-meta",
      updatedOn: "2026-07-01",
      comps: [
        {
          id: "admech",
          signatureUnitId: "admecActus",
          coreCharacterIds: ["admecActus"],
          // Deliberately disjoint from the authored replacements below: if a query ever derived
          // replacements from Comp membership instead of the explicit rule, this id would leak in.
          flexCharacterIds: ["comp-flex-should-not-appear"],
          mowIds: ["comp-mow-should-not-appear"],
        },
      ],
      bosses: [
        {
          bossUnitSetId: "GuildBoss1Boss1Tervigon",
          recommendations: [
            {
              id: "GuildBoss1Boss1Tervigon-meta",
              kind: "meta" as const,
              heroSlots: [
                {
                  heroId: "admecActus",
                  roleId: "signature",
                  essential: true,
                  replacementCharacterIds: [],
                },
                {
                  heroId: "eldarEldryon",
                  roleId: "flex",
                  essential: false,
                  // Authored order is significant and must round-trip unchanged.
                  replacementCharacterIds: [
                    "explicit-second",
                    "explicit-first",
                  ],
                },
                {
                  heroId: "blackTemplarBellator",
                  roleId: "flex",
                  essential: false,
                  replacementCharacterIds: [],
                },
                {
                  heroId: "tauRevas",
                  roleId: "flex",
                  essential: false,
                  replacementCharacterIds: [],
                },
                {
                  heroId: "orksGibbascrapz",
                  roleId: "flex",
                  essential: false,
                  replacementCharacterIds: [],
                },
              ],
              mowId: "mowBiovore",
              mowReplacementIds: ["mow-second", "mow-first"],
              compIds: ["admech"],
            },
          ],
        },
      ],
    }

    await replaceGameCatalogDataset("guild-raid-meta", rulesPayload, metadata())

    const boss = await getGuildRaidMetaForBoss("GuildBoss1Boss1Tervigon")
    const recommendation = boss?.boss?.recommendations[0]

    expect(recommendation?.mowReplacementIds).toEqual([
      "mow-second",
      "mow-first",
    ])
    expect(recommendation?.heroSlots.map((slot) => slot.heroId)).toEqual([
      "admecActus",
      "eldarEldryon",
      "blackTemplarBellator",
      "tauRevas",
      "orksGibbascrapz",
    ])
    expect(
      recommendation?.heroSlots.find((slot) => slot.heroId === "eldarEldryon")
        ?.replacementCharacterIds
    ).toEqual(["explicit-second", "explicit-first"])
  })

  it("preserves efficiency/primeUnitSetIds/primes[] and multi-recommendation boss order through sync/replace", async () => {
    function recommendation(id: string, kind: string, efficiency: number) {
      return {
        id,
        kind,
        heroSlots: [
          {
            heroId: "admecActus",
            roleId: "signature",
            essential: true,
            replacementCharacterIds: [],
          },
          {
            heroId: "eldarEldryon",
            roleId: "flex",
            essential: false,
            replacementCharacterIds: [],
          },
          {
            heroId: "blackTemplarBellator",
            roleId: "flex",
            essential: false,
            replacementCharacterIds: [],
          },
          {
            heroId: "tauRevas",
            roleId: "flex",
            essential: false,
            replacementCharacterIds: [],
          },
          {
            heroId: "orksGibbascrapz",
            roleId: "flex",
            essential: false,
            replacementCharacterIds: [],
          },
        ],
        mowId: "mowBiovore",
        mowReplacementIds: [],
        compIds: ["admech"],
        efficiency,
      }
    }

    const primesPayload = {
      sourceId: "terminus-maximus-and-cognitae-guild-raid-meta",
      updatedOn: "2026-09-14",
      comps: [
        {
          id: "admech",
          signatureUnitId: "admecActus",
          coreCharacterIds: ["admecActus"],
          flexCharacterIds: [],
          mowIds: ["mowBiovore"],
        },
      ],
      bosses: [
        {
          bossUnitSetId: "GuildBoss1Boss1Tervigon",
          primeUnitSetIds: [
            "GuildBoss1MiniBoss2Prime",
            "GuildBoss1MiniBoss1Prime",
          ],
          recommendations: [
            recommendation(
              "GuildBoss1Boss1Tervigon-lavistodes",
              "lavistodes",
              1.43
            ),
            recommendation("GuildBoss1Boss1Tervigon-neuro", "neuro", 1.14),
            recommendation(
              "GuildBoss1Boss1Tervigon-battlesuit",
              "battlesuit",
              1.0
            ),
          ],
        },
      ],
      primes: [
        {
          primeUnitSetId: "GuildBoss1MiniBoss2Prime",
          recommendations: [
            recommendation("GuildBoss1MiniBoss2Prime-admech", "admech", 1.0),
          ],
        },
      ],
    }

    await replaceGameCatalogDataset(
      "guild-raid-meta",
      primesPayload,
      metadata()
    )

    const boss = await getGuildRaidMetaForBoss("GuildBoss1Boss1Tervigon")
    expect(boss?.boss?.primeUnitSetIds).toEqual([
      "GuildBoss1MiniBoss2Prime",
      "GuildBoss1MiniBoss1Prime",
    ])
    expect(
      boss?.boss?.recommendations.map((recommendation) => recommendation.kind)
    ).toEqual(["lavistodes", "neuro", "battlesuit"])
    expect(
      boss?.boss?.recommendations.map(
        (recommendation) => recommendation.efficiency
      )
    ).toEqual([1.43, 1.14, 1.0])
  })

  describe("getGuildRaidMetaForPrime", () => {
    const primeUnitSetId = "GuildBoss1MiniBoss2Prime"

    function recommendation(id: string) {
      return {
        id,
        kind: "admech",
        heroSlots: [
          {
            heroId: "admecActus",
            roleId: "signature",
            essential: true,
            replacementCharacterIds: [],
          },
          {
            heroId: "eldarEldryon",
            roleId: "flex",
            essential: false,
            replacementCharacterIds: [],
          },
          {
            heroId: "blackTemplarBellator",
            roleId: "flex",
            essential: false,
            replacementCharacterIds: [],
          },
          {
            heroId: "tauRevas",
            roleId: "flex",
            essential: false,
            replacementCharacterIds: [],
          },
          {
            heroId: "orksGibbascrapz",
            roleId: "flex",
            essential: false,
            replacementCharacterIds: [],
          },
        ],
        mowId: "mowBiovore",
        mowReplacementIds: [],
        compIds: ["admech"],
        efficiency: 1,
      }
    }

    function primesPayload() {
      return {
        sourceId: "terminus-maximus-and-cognitae-guild-raid-meta",
        updatedOn: "2026-09-14",
        comps: [
          {
            id: "admech",
            signatureUnitId: "admecActus",
            coreCharacterIds: ["admecActus"],
            flexCharacterIds: [],
            mowIds: ["mowBiovore"],
          },
        ],
        bosses: [
          {
            bossUnitSetId: "GuildBoss1Boss1Tervigon",
            primeUnitSetIds: [
              primeUnitSetId,
              "GuildBoss1MiniBoss1PrimeWithNoComp",
            ],
            recommendations: [recommendation("GuildBoss1Boss1Tervigon-meta")],
          },
        ],
        primes: [
          {
            primeUnitSetId,
            recommendations: [
              recommendation("GuildBoss1MiniBoss2Prime-a"),
              {
                ...recommendation("GuildBoss1MiniBoss2Prime-b"),
                kind: "alternate",
              },
            ],
          },
        ],
      }
    }

    it("reports an absent dataset distinctly from a boss's prime with no curated comp", async () => {
      expect(await getGuildRaidMetaForPrime(primeUnitSetId)).toBeNull()

      await replaceGameCatalogDataset(
        "guild-raid-meta",
        primesPayload(),
        metadata()
      )

      const noComp = await getGuildRaidMetaForPrime(
        "GuildBoss1MiniBoss1PrimeWithNoComp"
      )
      expect(noComp?.meta.id).toBe("guild-raid-meta")
      expect(noComp?.prime).toBeNull()
    })

    it("preserves authored prime recommendation order through sync/replace", async () => {
      await replaceGameCatalogDataset(
        "guild-raid-meta",
        primesPayload(),
        metadata()
      )

      const result = await getGuildRaidMetaForPrime(primeUnitSetId)
      expect(
        result?.prime?.recommendations.map(
          (recommendation) => recommendation.id
        )
      ).toEqual(["GuildBoss1MiniBoss2Prime-a", "GuildBoss1MiniBoss2Prime-b"])
    })
  })
})
