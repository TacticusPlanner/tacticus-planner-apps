import Dexie from "dexie"
import { beforeEach, describe, expect, it } from "vitest"

import {
  catalogDbName,
  replaceGameCatalogDataset,
} from "./game-catalog-storage"
import { getGuildRaidMeta, getGuildRaidMetaForBoss } from "./queries"

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
          evidence: {
            replayCount: 7,
            averageDamage: 1770000,
            maximumDamage: 2190000,
          },
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
})
