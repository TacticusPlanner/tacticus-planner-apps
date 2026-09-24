import { describe, expect, it } from "vitest"

import { buildNpcGroups, isVariationAvailable } from "./build-npc-groups"
import { makhotepRecords, npcRecord, statRow, zeroRow } from "./npc-fixtures"
import { npcSlug } from "./npc-slug"
import unitNames from "./npc-unit-names.fixture.json"

describe("buildNpcGroups", () => {
  it("groups the five Makhotep variations into one NPC with the base entry as default", () => {
    const groups = buildNpcGroups(makhotepRecords)

    expect(groups).toHaveLength(1)
    const [makhotep] = groups
    expect(makhotep.id).toBe("makhotep")
    expect(makhotep.name).toBe("Makhotep")
    expect(makhotep.factionId).toBe("Necrons")
    expect(makhotep.variations.map((v) => v.id)).toEqual([
      "necroNpcWarden",
      "necroBossWarden",
      "necroBossWardenLHE",
      "necroBossWardenLEG",
      "necroBossC1Warden",
    ])
    expect(makhotep.defaultVariationId).toBe("necroNpcWarden")
  })

  it("keeps each variation's ladder apart", () => {
    const [makhotep] = buildNpcGroups(makhotepRecords)
    const boss = makhotep.variations.find((v) => v.id === "necroBossWarden")!
    const lhe = makhotep.variations.find((v) => v.id === "necroBossWardenLHE")!

    expect(boss.stats.map((s) => s.health)).toEqual([160, 140, 1028])
    expect(lhe.stats.map((s) => s.health)).toEqual([200, 8000])
  })

  it("excludes Machines of War and loot objects by kind", () => {
    const groups = buildNpcGroups([
      npcRecord("deathNpcMoWCrawler", "Plagueburst Crawler", {
        kind: "machineOfWar",
        traits: ["MachineOfWar"],
      }),
      npcRecord("LootObj_AmmoBox", "Ammo Box", {
        kind: "object",
        factionId: "Objects",
      }),
      npcRecord("necroNpc1Warrior", "Necron Warrior"),
    ])

    expect(groups.map((g) => g.name)).toEqual(["Necron Warrior"])
  })

  it("hides an all-zero variation while keeping the NPC listed", () => {
    const groups = buildNpcGroups([
      npcRecord("necroNpc1TutWarriorFTUEtest", "Necron Warrior", {
        stats: [zeroRow, zeroRow],
      }),
      npcRecord("necroNpc1Warrior", "Necron Warrior", {
        stats: [statRow(0, 0, 30)],
      }),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0].variations.map((v) => v.id)).toEqual(["necroNpc1Warrior"])
    expect(groups[0].defaultVariationId).toBe("necroNpc1Warrior")
  })

  it("drops an NPC whose only variations are all-zero", () => {
    const groups = buildNpcGroups([
      npcRecord("genesDecoy", "Decoy", { kind: "unit", stats: [zeroRow] }),
      npcRecord("necroNpc1Warrior", "Necron Warrior"),
    ])

    expect(groups.map((g) => g.id)).toEqual(["necron-warrior"])
  })

  it("treats a row with any non-zero core stat as available", () => {
    expect(
      isVariationAvailable(
        npcRecord("x", "X", { stats: [zeroRow, { ...zeroRow, armour: 1 }] })
      )
    ).toBe(true)
    expect(
      isVariationAvailable(npcRecord("x", "X", { stats: [zeroRow] }))
    ).toBe(false)
  })

  it("picks the shortest available id as the default, ties by served order", () => {
    const groups = buildNpcGroups([
      npcRecord("admecBossDominusLHE", "Vitruvius"),
      npcRecord("admecBossDominusCE", "Vitruvius"),
      npcRecord("admecBossDominus", "Vitruvius"),
      npcRecord("admecBossDominusLEG", "Vitruvius"),
    ])
    expect(groups[0].defaultVariationId).toBe("admecBossDominus")

    const noBase = buildNpcGroups([
      npcRecord("astarBossCyrusSurv", "Cyrus"),
      npcRecord("astarCyrus_LHE", "Cyrus"),
    ])
    expect(noBase[0].defaultVariationId).toBe("astarCyrus_LHE")
  })
})

describe("npcSlug", () => {
  it("lower-cases and collapses non-alphanumerics", () => {
    expect(npcSlug("Makhotep")).toBe("makhotep")
    expect(npcSlug("Sy-gex")).toBe("sy-gex")
    expect(npcSlug("From Golden Light Power-up")).toBe(
      "from-golden-light-power-up"
    )
    expect(npcSlug("Tan Gi'da")).toBe("tan-gi-da")
    expect(npcSlug("E-COG")).toBe("e-cog")
  })

  it("is unique across every real unit name in the served catalog", () => {
    const slugs = unitNames.map(npcSlug)
    expect(unitNames.length).toBeGreaterThan(150)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(slugs.every((s) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s))).toBe(true)
  })
})
