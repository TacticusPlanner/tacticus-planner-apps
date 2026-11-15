import { describe, expect, it } from "vitest"

import {
  buildNpcTierList,
  npcAdjustedBattlePower,
  npcEventIds,
  npcTierMultipliers,
  type NpcTierListRecord,
} from "./npc-tier-list"

const record: NpcTierListRecord = {
  tiers: [
    { tier: "S", multiplier: 2 },
    { tier: "A", multiplier: 1.5 },
    { tier: "D", multiplier: 1 },
  ],
  npcs: [
    { npcId: "hellblaster", tier: "A" },
    { npcId: "terminator", tier: "A", multiplier: 1.6 },
    { npcId: "guardian", tier: "D" },
    { npcId: "hellblaster", tier: "S" },
    { npcId: "mystery", tier: "Z", multiplier: 1.2 },
    { npcId: "nothing", tier: "Z" },
  ],
}

const battle = {
  power: 1000,
  waves: [
    {
      enemies: [
        { id: "guardian", ladderIndex: 1, count: 3 },
        { id: "hellblaster", ladderIndex: 2, count: 1 },
      ],
    },
  ],
}

describe("npcTierMultipliers", () => {
  it("resolves the first entry per NPC, its own multiplier over its tier's", () => {
    expect(Object.fromEntries(npcTierMultipliers(record))).toEqual({
      hellblaster: 1.5,
      terminator: 1.6,
      guardian: 1,
      mystery: 1.2,
    })
  })

  it("is empty without a record", () => {
    expect(npcTierMultipliers(null).size).toBe(0)
  })
})

describe("npcAdjustedBattlePower", () => {
  it("keeps the catalog power while every enemy is at 1.0", () => {
    const enemyPower = () => {
      throw new Error("not read")
    }
    expect(
      npcAdjustedBattlePower(battle, new Map([["guardian", 1]]), enemyPower)
    ).toBe(1000)
  })

  it("weights each enemy's multiplier by count × its power", () => {
    // guardians 3 × 100 at 1.0, one hellblaster 200 at 1.5: (300 + 300) / 500 = 1.2.
    const power = npcAdjustedBattlePower(
      battle,
      new Map([["hellblaster", 1.5]]),
      (npcId) => (npcId === "guardian" ? 100 : 200)
    )
    expect(power).toBeCloseTo(1200)
  })

  it("falls back to count weights when an enemy's power is unknown", () => {
    // 3 at 1.0, 1 at 1.5: 4.5 / 4 = 1.125.
    const power = npcAdjustedBattlePower(
      battle,
      new Map([["hellblaster", 1.5]]),
      (npcId) => (npcId === "guardian" ? 100 : null)
    )
    expect(power).toBeCloseTo(1125)
  })
})

describe("npcEventIds", () => {
  it("lists each NPC's events among the given ones", () => {
    const battles = [
      { lreId: "bile", waves: [{ enemies: [{ id: "a" }, { id: "b" }] }] },
      { lreId: "lysander", waves: [{ enemies: [{ id: "a" }] }] },
      { lreId: "old", waves: [{ enemies: [{ id: "c" }] }] },
    ]
    expect(
      Object.fromEntries(npcEventIds(battles, new Set(["bile", "lysander"])))
    ).toEqual({ a: ["bile", "lysander"], b: ["bile"] })
  })
})

describe("buildNpcTierList", () => {
  const npcEvents = new Map<string, readonly string[]>([
    ["hellblaster", ["bile"]],
    ["terminator", ["bile"]],
    ["guardian", ["bile", "lysander"]],
    ["mystery", ["lysander"]],
    ["grot", ["lysander"]],
    ["warboss", ["lysander"]],
  ])
  const nameOf = (npcId: string) => npcId

  it("places listed NPCs in their tier rows, multiplier first, then the unknown-tier ones; unlisted ones (bosses) are left out", () => {
    const list = buildNpcTierList(
      record,
      npcEvents,
      { query: "", eventId: "all" },
      nameOf
    )
    expect(list.rows.map((row) => row.tier)).toEqual(["S", "A", "D"])
    expect(list.rows[1]!.npcs).toEqual([
      { npcId: "terminator", multiplier: 1.6, overridden: true },
      { npcId: "hellblaster", multiplier: 1.5, overridden: false },
    ])
    expect(list.rows[2]!.npcs.map((tile) => tile.npcId)).toEqual(["guardian"])
    expect(list.untiered).toEqual([
      { npcId: "mystery", multiplier: 1.2, overridden: true },
    ])
  })

  it("filters by event and name", () => {
    const list = buildNpcTierList(
      record,
      npcEvents,
      { query: "gu", eventId: "lysander" },
      nameOf
    )
    expect(list.rows.flatMap((row) => row.npcs).map((t) => t.npcId)).toEqual([
      "guardian",
    ])
    expect(list.untiered).toEqual([])
  })

  it("is empty without a record", () => {
    const list = buildNpcTierList(
      null,
      npcEvents,
      { query: "", eventId: "all" },
      nameOf
    )
    expect(list.rows).toEqual([])
    expect(list.untiered).toEqual([])
  })
})
