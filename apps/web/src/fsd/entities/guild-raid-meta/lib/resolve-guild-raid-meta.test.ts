import { describe, expect, it } from "vitest"

import {
  createGuildRaidMetaPresentationResolver,
  guildRaidMetaSourceUrl,
} from "./resolve-guild-raid-meta"

const meta = {
  sourceId: "terminus-maximus-guild-raid-boss-meta",
  updatedOn: "2026-07-01",
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
      primeUnitSetIds: [],
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
              heroId: "missingHero",
              roleId: "flex",
              essential: false,
              replacementCharacterIds: ["missingHero5"],
            },
            {
              heroId: "missingHero2",
              roleId: "unknownRole",
              essential: false,
              replacementCharacterIds: [],
            },
            {
              heroId: "missingHero3",
              roleId: "flex",
              essential: false,
              replacementCharacterIds: [],
            },
            {
              heroId: "missingHero4",
              roleId: "flex",
              essential: false,
              replacementCharacterIds: [],
            },
          ],
          mowId: "mowBiovore",
          mowReplacementIds: ["missingMow"],
          compIds: ["admech", "missingComp"],
          efficiency: 1,
        },
      ],
    },
  ],
  primes: [],
}

function resolver() {
  return createGuildRaidMetaPresentationResolver({
    meta,
    charactersById: new Map([
      ["admecActus", { id: "admecActus", name: "Actus" }],
    ]),
    mowsById: new Map([["mowBiovore", { id: "mowBiovore", name: "Biovore" }]]),
    bossName: (_id, fallback) => `Boss: ${fallback}`,
    roleLabel: (roleId, fallback) =>
      roleId === "signature" ? "Signature" : fallback,
    kindLabel: (kind, fallback) => (kind === "meta" ? "Meta" : fallback),
  })
}

describe("Guild Raid Meta presentation", () => {
  it("resolves authored boss, character, MoW, and Comp signature ids", () => {
    const presentation = resolver()

    expect(presentation.resolveBoss("GuildBoss1Boss1Tervigon")).toMatchObject({
      boss: { bossUnitSetId: "GuildBoss1Boss1Tervigon" },
      name: "Boss: Guild Boss1 Boss1 Tervigon",
    })
    expect(presentation.resolveCharacter("admecActus")).toMatchObject({
      name: "Actus",
      kind: "character",
    })
    expect(presentation.resolveMow("mowBiovore")).toMatchObject({
      name: "Biovore",
      kind: "mow",
    })
    expect(presentation.resolveSignature("admecActus").name).toBe("Actus")

    const lineup = presentation.resolveRecommendation(
      meta.bosses[0].recommendations[0]
    )
    expect(lineup.heroes.map((hero) => hero.id)).toEqual([
      "admecActus",
      "missingHero",
      "missingHero2",
      "missingHero3",
      "missingHero4",
    ])
    expect(lineup.mow.name).toBe("Biovore")
    expect(lineup.mowReplacements).toEqual([
      { id: "missingMow", name: "missing Mow", kind: "unknown" },
    ])
    expect(lineup.comps).toEqual([
      { id: "admech", signature: expect.objectContaining({ name: "Actus" }) },
      {
        id: "missingComp",
        signature: { id: "missingComp", name: "missing Comp", kind: "unknown" },
      },
    ])
  })

  it("uses readable, non-image fallbacks for missing presentation assets", () => {
    const presentation = resolver()

    expect(presentation.resolveCharacter("missingHero")).toEqual({
      id: "missingHero",
      name: "missing Hero",
      kind: "unknown",
    })
    expect(presentation.resolveBoss("UnknownBoss")).toEqual({
      boss: null,
      name: "Boss: Unknown Boss",
    })
  })

  it("resolves a known role id to its localized label and an unknown one to a readable fallback", () => {
    const presentation = resolver()

    expect(presentation.resolveRole("signature")).toEqual({
      id: "signature",
      label: "Signature",
    })
    expect(presentation.resolveRole("unknownRole")).toEqual({
      id: "unknownRole",
      label: "unknown Role",
    })
  })

  it("resolves a known archetype kind to its localized label and an unknown one to a readable fallback", () => {
    const presentation = resolver()

    expect(presentation.resolveKind("meta")).toEqual({
      id: "meta",
      label: "Meta",
    })
    expect(presentation.resolveKind("lavistodes")).toEqual({
      id: "lavistodes",
      label: "lavistodes",
    })

    const lineup = presentation.resolveRecommendation(
      meta.bosses[0].recommendations[0]
    )
    expect(lineup.kind).toEqual({ id: "meta", label: "Meta" })
  })

  it("resolves each hero slot's role and replacement units, covering known and unknown ids", () => {
    const presentation = resolver()

    const lineup = presentation.resolveRecommendation(
      meta.bosses[0].recommendations[0]
    )

    expect(lineup.heroSlots[0]).toMatchObject({
      hero: { id: "admecActus", name: "Actus", kind: "character" },
      role: { id: "signature", label: "Signature" },
      replacements: [],
    })
    expect(lineup.heroSlots[1]).toMatchObject({
      hero: { id: "missingHero", kind: "unknown" },
      role: { id: "flex", label: "flex" },
      replacements: [
        { id: "missingHero5", name: "missing Hero5", kind: "unknown" },
      ],
    })
    expect(lineup.heroSlots[2].role).toEqual({
      id: "unknownRole",
      label: "unknown Role",
    })
  })

  it("tolerates a recommendation cached before variant rules existed, without heroSlots or mowReplacementIds", () => {
    const presentation = resolver()

    const legacyRecommendation = {
      kind: "meta" as const,
      mowId: "mowBiovore",
      compIds: ["admech"],
      // `id`, `heroSlots`, and `mowReplacementIds` are absent, as an older cached row would be.
    } as unknown as (typeof meta.bosses)[0]["recommendations"][0]

    const lineup = presentation.resolveRecommendation(legacyRecommendation)

    expect(lineup.heroSlots).toEqual([])
    expect(lineup.mowReplacements).toEqual([])
    expect(lineup.heroes).toEqual([])
  })

  it("links only the known Terminus Maximus source", () => {
    const presentation = resolver()

    expect(presentation.resolveSource(meta.sourceId)).toEqual({
      sourceId: meta.sourceId,
      name: "Terminus Maximus",
      url: guildRaidMetaSourceUrl,
    })
    expect(presentation.resolveSource("new-source")).toEqual({
      sourceId: "new-source",
      name: "new source",
    })
  })
})
