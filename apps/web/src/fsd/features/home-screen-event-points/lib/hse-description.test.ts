import { describe, expect, it } from "vitest"

import { hseVariant } from "@/test/fixtures/home-screen-event-scoring"

import { hseDescriptionLines, type HseText } from "./hse-description"

const keys = (lines: HseText[]) =>
  lines.map((line) => line.key.replace("dailies:hse.details.", ""))

describe("hseDescriptionLines", () => {
  it("builds Psyker Boost's XP, stat and points lines in that order", () => {
    const lines = hseDescriptionLines(hseVariant("hse-trait-boost-psyker"))

    expect(keys(lines)).toEqual(["lines.xp", "lines.stat", "lines.killWith"])
    expect(lines[0]?.values).toMatchObject({
      multiplier: 3,
      units: {
        key: "dailies:hse.details.phrase.charactersOf",
        values: { filter: { list: [{ key: "traits:Psyker" }], join: "space" } },
      },
      modes: {
        key: "dailies:hse.details.phrase.modesIn",
        values: {
          // Canonical order, not the data's Arena, SalvageRun, Onslaught.
          modes: {
            list: [
              { key: "dailies:hse.details.modes.Arena" },
              { key: "dailies:hse.details.modes.Onslaught" },
              { key: "dailies:hse.details.modes.SalvageRun" },
            ],
          },
        },
      },
    })
    expect(lines[1]?.values).toMatchObject({
      health: 20,
      damage: 20,
      armour: 20,
    })
    expect(lines[2]?.values).toMatchObject({
      count: 1,
      enemy: {
        key: "dailies:hse.details.phrase.excluding",
        values: {
          noun: { key: "dailies:hse.details.phrase.enemy" },
          excluded: { list: [{ key: "dailies:hse.details.tags.Summon" }] },
        },
      },
      player: {
        key: "dailies:hse.details.phrase.unitsOf",
        values: { filter: { list: [{ key: "traits:Psyker" }] } },
      },
    })
  })

  it("names Faction Boost's alliance and faction trackers as characters (Machines of War excluded)", () => {
    const lines = hseDescriptionLines(
      hseVariant("hse-faction-boost", "DarkAngels")
    )

    expect(keys(lines)).toEqual([
      "lines.xpTeam",
      "lines.stat",
      "lines.killWith",
      "lines.killWith",
    ])
    expect(lines[1]?.values?.units).toMatchObject({
      key: "dailies:hse.details.phrase.charactersOf",
      values: { filter: { list: [{ key: "factions:DarkAngels" }] } },
    })
    expect(lines[2]?.values).toMatchObject({
      count: 2,
      player: {
        key: "dailies:hse.details.phrase.charactersOf",
        values: { filter: { list: [{ key: "common:alliances.Imperial" }] } },
      },
    })
    expect(lines[3]?.values).toMatchObject({
      count: 1,
      player: {
        key: "dailies:hse.details.phrase.charactersOf",
        values: { filter: { list: [{ key: "factions:DarkAngels" }] } },
      },
    })
  })

  it("states For the Emperor's enemy restriction", () => {
    const [line] = hseDescriptionLines(hseVariant("hse-for-the-emperor"))
    expect(line?.values?.enemy).toMatchObject({
      key: "dailies:hse.details.phrase.excluding",
      values: {
        excluded: {
          list: [
            { key: "common:alliances.Imperial" },
            { key: "dailies:hse.details.tags.Summon" },
          ],
        },
      },
    })
  })

  it("names Squig Smash's enemy by unit id, in every listed mode", () => {
    const [line] = hseDescriptionLines(hseVariant("hse-squig-smash"))
    expect(line?.key).toBe("dailies:hse.details.lines.kill")
    expect(line?.values?.enemy).toEqual({
      key: "dailies:hse.details.phrase.named",
      values: {
        names: {
          list: [{ key: "npcs:orksNpc7Squig", fallback: "Orks Npc7 Squig" }],
          join: "or",
        },
      },
    })
  })

  it("describes rarity XP, waves, battles, guild trackers and excluded modes", () => {
    expect(keys(hseDescriptionLines(hseVariant("hse-training-rush")))).toEqual([
      "lines.xpByRarity",
      "lines.kill",
      "lines.kill",
    ])
    const [, everyModeBut] = hseDescriptionLines(
      hseVariant("hse-training-rush")
    )
    expect(everyModeBut?.values?.modes).toMatchObject({
      key: "dailies:hse.details.phrase.modesExcept",
    })
    expect(keys(hseDescriptionLines(hseVariant("hse-defeat-waves")))).toEqual([
      "lines.waves",
    ])
    expect(
      keys(hseDescriptionLines(hseVariant("hse-faction-focus", "october-2026")))
    ).toEqual([
      "lines.xpTeam",
      "lines.factionMajority",
      "lines.factionMajority",
      "lines.fullLineUp",
      "lines.fullLineUp",
    ])
    expect(keys(hseDescriptionLines(hseVariant("hse-arsenal-of-war")))).toEqual(
      ["lines.donateUpgradeByRarity", "lines.donateIntel"]
    )
  })

  it("renders no line for an unknown tracker kind", () => {
    const variant = hseVariant("hse-trait-boost-psyker")
    const lines = hseDescriptionLines({
      modifiers: [],
      trackers: [{ ...variant.trackers[0]!, kind: "CaptureRelics" }],
    })
    expect(lines).toEqual([])
  })
})
