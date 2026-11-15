import { describe, expect, it } from "vitest"
import type { BattleId } from "@workspace/game-domain"
import {
  battleIdSchema,
  campaignIdSchema,
  upgradeIdSchema,
} from "@workspace/game-domain/schemas"

import type { Battle } from "@/shared/lib"

import {
  buildLocationDrops,
  selectEventLocations,
} from "./home-screen-event-locations"

const battle = (id: string, energyCost: number, dailyAttempts = 3) => ({
  id,
  energyCost,
  dailyAttempts,
})
const select = (
  overrides: Partial<Parameters<typeof selectEventLocations>[0]> & {
    points: Record<string, number>
  }
) => {
  const { points, ...rest } = overrides
  return selectEventLocations({
    battles: [battle("a", 5), battle("b", 10), battle("c", 5), battle("d", 5)],
    pointsByBattleId: new Map(Object.entries(points)),
    attemptsLeftByBattle: new Map(),
    passesFilter: () => true,
    ...rest,
  })
}
const ids = (locations: ReturnType<typeof select>) =>
  locations.map((location) => location.battleId)

describe("selectEventLocations", () => {
  it("ranks by points per energy, then points per raid, then lower energy", () => {
    // a: 10/5 = 2, b: 20/10 = 2 (more points per raid wins), c: 4/5, d: 3/5 = 0.6
    expect(ids(select({ points: { a: 10, b: 20, c: 4, d: 3 } }))).toEqual([
      "b",
      "a",
      "c",
      "d",
    ])
  })

  it("lists every scoring location, uncapped by a top-N limit", () => {
    const many = Array.from({ length: 14 }, (_, i) => battle(`n${i}`, 5))
    const points = Object.fromEntries(many.map((b, i) => [b.id, i + 1]))
    expect(select({ battles: many, points })).toHaveLength(14)
  })

  it("gives each location its attempts left as raids, and leaves out exhausted ones", () => {
    const locations = select({
      points: { a: 10, b: 20 },
      attemptsLeftByBattle: new Map([
        ["a", 2],
        ["b", 0],
      ]),
    })
    expect(locations).toEqual([
      expect.objectContaining({ battleId: "a", raids: 2, points: 20 }),
    ])
  })

  it("leaves out zero-point and filtered locations", () => {
    expect(
      ids(
        select({
          points: { a: 10, b: 0, c: 5 },
          passesFilter: (id) => id !== "c",
        })
      )
    ).toEqual(["a"])
  })

  it("energy order ranks by drop efficiency first, unrated locations last", () => {
    const dropByBattleId = new Map([
      ["a", { energyPerItem: 10, efficiency: 1.8 }],
      ["b", { energyPerItem: 30, efficiency: 1 }],
      ["c", { energyPerItem: 5, efficiency: 1 }],
    ])
    const points = { a: 10, b: 10, c: 6, d: 20 }
    // c and b tie on efficiency: c earns more points per energy (1.2 vs 1), Fewer raids puts the
    // costlier b first.
    expect(ids(select({ points, dropByBattleId, order: "energy" }))).toEqual([
      "c",
      "b",
      "a",
      "d",
    ])
    expect(
      ids(select({ points, dropByBattleId, order: "energy", fewerRaids: true }))
    ).toEqual(["b", "c", "a", "d"])
    const [first] = select({ points, dropByBattleId, order: "energy" })
    expect(first).toMatchObject({ battleId: "c", energyPerItem: 5 })
    // The points order ignores the drops.
    expect(ids(select({ points, dropByBattleId }))[0]).toBe("d")
  })
})

describe("buildLocationDrops", () => {
  const node = (energyCost: number): Battle => ({
    campaignGroupId: campaignIdSchema.parse("CG1"),
    type: "Elite",
    challenge: false,
    nodeNumber: 1,
    battleIndex: 0,
    energyCost,
    dailyAttempts: 6,
  })
  const at = (battleId: string, rate: number) => ({
    battleId: battleIdSchema.parse(battleId),
    guaranteed: false,
    effectiveRate: rate,
    numerator: null,
    denominator: null,
    isMythic: false,
  })

  it("rates each location against the cheapest one for the same item", () => {
    const battles = new Map<BattleId, Battle>([
      [battleIdSchema.parse("ELITE"), node(10)],
      [battleIdSchema.parse("MIRROR"), node(10)],
      [battleIdSchema.parse("STANDARD"), node(6)],
    ])
    const drops = buildLocationDrops(
      [
        {
          id: upgradeIdSchema.parse("legendary"),
          farmLocations: [
            at("ELITE", 1 / 3),
            at("MIRROR", 1 / 3),
            at("STANDARD", 1 / 9),
          ],
        },
      ],
      battles
    )
    expect(drops.get(battleIdSchema.parse("ELITE"))).toEqual({
      energyPerItem: 30,
      efficiency: 1,
    })
    expect(drops.get(battleIdSchema.parse("MIRROR"))?.efficiency).toBe(1)
    expect(drops.get(battleIdSchema.parse("STANDARD"))).toEqual({
      energyPerItem: 54,
      efficiency: 1.8,
    })
  })
})
