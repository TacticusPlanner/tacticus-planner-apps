import { describe, expect, it } from "vitest"

import {
  resolveFieldNpcName,
  resolvePrimeName,
  unitDisplayName,
} from "./unit-name"

describe("unitDisplayName", () => {
  it("drops the GuildBoss<n><type><m> prefix and the faction token, then splits words", () => {
    expect(unitDisplayName("GuildBoss1Npc1TyranTermagantLeviathan")).toBe(
      "Termagant Leviathan"
    )
    expect(unitDisplayName("GuildBoss4Boss1OrksGhazghkull")).toBe("Ghazghkull")
    expect(unitDisplayName("GuildBoss10MiniBoss1AdmecMarshall")).toBe(
      "Marshall"
    )
  })

  it("spaces an embedded lowercase connector word", () => {
    expect(unitDisplayName("GuildBoss6Npc1MawClawsofThyrax")).toBe(
      "Maw Claws of Thyrax"
    )
  })
})

describe("resolvePrimeName", () => {
  const roster = new Map([
    ["orksBigMek", { name: "Gibbascrapz" }],
    ["tauMarksman", { name: "Sho'syl" }],
  ])

  it("maps the prime token to its playable-character name", () => {
    expect(resolvePrimeName("GuildBoss4MiniBoss1OrksBigMek", roster)).toBe(
      "Gibbascrapz"
    )
    expect(resolvePrimeName("GuildBoss11MiniBoss1TauMarksman", roster)).toBe(
      "Sho'syl"
    )
  })

  it("returns undefined for a prime that is not a playable character", () => {
    expect(
      resolvePrimeName("GuildBoss1MiniBoss1TyranWarriorLeviathan", roster)
    ).toBeUndefined()
  })

  it("returns undefined for a non-prime id", () => {
    expect(
      resolvePrimeName("GuildBoss4Boss1OrksGhazghkull", roster)
    ).toBeUndefined()
  })
})

describe("resolveFieldNpcName", () => {
  const npcs = [
    { id: "tyranNpc3Termagant", name: "Termagant" },
    { id: "tyranNpc3TermagantGorgon", name: "Termagant" },
    { id: "orksNpc1Grot", name: "Grot" },
    { id: "necroNpc1Warrior", name: "Necron Warrior" },
  ]

  it("fuzzy-matches the npc roster by faction abbreviation, dropping the fleet skin", () => {
    expect(
      resolveFieldNpcName(
        "GuildBoss1Npc1TyranTermagantLeviathan",
        "Tyranids",
        npcs
      )
    ).toBe("Termagant")
    expect(resolveFieldNpcName("GuildBoss4Npc1OrksGrot", "Orks", npcs)).toBe(
      "Grot"
    )
    expect(
      resolveFieldNpcName("GuildBoss3Npc1NecroWarrior", "Necrons", npcs)
    ).toBe("Necron Warrior")
  })

  it("falls back to a humanized token when nothing resolves", () => {
    expect(
      resolveFieldNpcName("GuildBoss9Npc9TyranMysteryBug", "Tyranids", npcs)
    ).toBe("Mystery Bug")
  })
})
