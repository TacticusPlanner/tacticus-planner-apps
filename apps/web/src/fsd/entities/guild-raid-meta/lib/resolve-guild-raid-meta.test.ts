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
      recommendations: [
        {
          kind: "meta" as const,
          heroIds: [
            "admecActus",
            "missingHero",
            "missingHero2",
            "missingHero3",
            "missingHero4",
          ],
          mowId: "mowBiovore",
          compIds: ["admech", "missingComp"],
        },
      ],
    },
  ],
}

function resolver() {
  return createGuildRaidMetaPresentationResolver({
    meta,
    charactersById: new Map([
      ["admecActus", { id: "admecActus", name: "Actus" }],
    ]),
    mowsById: new Map([["mowBiovore", { id: "mowBiovore", name: "Biovore" }]]),
    bossName: (_id, fallback) => `Boss: ${fallback}`,
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
