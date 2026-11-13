import { describe, expect, it } from "vitest"
import { resolveEventDaySlots } from "@workspace/game-catalog"

import { classifyCart } from "./classify"
import { buildCoverage, rewardResources, toCoverageNeeds } from "./coverage"
import { entry, testEvent } from "./test-event.fixture"

const TODAY = 3 // Thu 29 Oct
const now = Date.parse("2026-10-29T12:00:00Z")
const slotsOnDay = (dayIndex: number) =>
  resolveEventDaySlots(testEvent, dayIndex, { now })
const xpPerBook = { Rare: 1_000, Legendary: 12_500, Mythic: 50_000 }

const coverage = (
  needs: [string, number][],
  cart = [] as ReturnType<typeof entry>[]
) =>
  buildCoverage({
    needs: new Map(needs),
    entries: classifyCart(testEvent, cart, TODAY).entries,
    todayIndex: TODAY,
    dayCount: testEvent.dayCount,
    slotsOnDay,
    xpPerBook,
  })

describe("coverage", () => {
  it("works the Yarrick example: planned 50, 60 still needed, 3 packs for 135", () => {
    const [row] = coverage(
      [["shards_astraYarrick", 110]],
      [
        entry("MON", 0, "shards_astraYarrick", 2, 2),
        entry("THU", 0, "shards_astraYarrick", 1, 0),
        entry("SUN", 0, "shards_astraYarrick", 1, 0),
      ]
    )

    expect(row).toEqual({
      resource: "shards_astraYarrick",
      group: "shards",
      rewardType: "shards_astraYarrick",
      need: 110,
      planned: 50,
      stillNeeded: 60,
      maxStillBuyable: 200,
      short: 0,
      estimate: { packs: 3, cost: 135 },
    })
  })

  it("works the badge example: 100 short, priced in full at 450", () => {
    const [row] = coverage([["badge:Imperial:Uncommon", 300]])

    expect(row).toMatchObject({
      need: 300,
      planned: 0,
      stillNeeded: 300,
      maxStillBuyable: 200,
      short: 100,
      estimate: { packs: 30, cost: 450 },
    })
  })

  it("routes a draft reward to its chosen alliance", () => {
    const rows = coverage(
      [
        ["orb:Xenos:Epic", 30],
        ["orb:Chaos:Epic", 30],
      ],
      [entry("THU", 5, "draft_ascensionOrbsEpic", 2, 0, "xenos")]
    )

    expect(rows.map((row) => [row.resource, row.planned])).toEqual([
      ["orb:Chaos:Epic", 0],
      ["orb:Xenos:Epic", 20],
    ])
  })

  it("converts XP books to raw XP", () => {
    expect(rewardResources("xpLegendary", null, xpPerBook)).toEqual([
      { resource: "xp", group: "xp", unitsPerQty: 12_500 },
    ])
  })

  it("skips resources the event doesn't sell and needs already met", () => {
    expect(
      coverage([
        ["gold", 400_000],
        ["badge:Imperial:Uncommon", 0],
      ])
    ).toEqual([])
  })

  it("sorts gold, XP, badges, orbs, components, forge, Mythic materials, shards", () => {
    const rows = coverage([
      ["shards_astraYarrick", 10],
      ["orb:Imperial:Epic", 10],
      ["badge:Imperial:Uncommon", 10],
    ])

    expect(rows.map((row) => row.group)).toEqual(["badges", "orbs", "shards"])
  })
})

describe("coverage needs", () => {
  it("maps shop needs and missing resources to coverage resources", () => {
    const needs = toCoverageNeeds(
      new Map([["shards_astraYarrick", { acquired: 40, required: 150 }]]),
      {
        abilityBadges: { Imperial: { Uncommon: 300 } },
        orbs: { Xenos: { Epic: 15 } },
        forgeBadges: { Rare: 4 },
        components: { Chaos: 6 },
        xp: 25_000,
        gold: 0,
      }
    )

    expect(Object.fromEntries(needs)).toEqual({
      shards_astraYarrick: 110,
      "badge:Imperial:Uncommon": 300,
      "orb:Xenos:Epic": 15,
      "forge:Rare": 4,
      "component:Chaos": 6,
      xp: 25_000,
    })
  })
})
