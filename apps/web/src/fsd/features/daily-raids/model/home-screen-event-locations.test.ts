import { describe, expect, it } from "vitest"
import { selectEventLocations } from "./home-screen-event-locations"

const battle = (
  id: string,
  energyCost: number,
  drops: Record<string, number> = {},
  dailyAttempts = 3
) => ({
  id,
  energyCost,
  dailyAttempts,
  dropRates: new Map(Object.entries(drops)),
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

  it("energy order keeps only the cheapest location per item of a material", () => {
    const battles = [
      // Both drop m1: x costs 10 energy per item, y 6 (cheapest), z 6 at a higher cost per battle.
      battle("x", 5, { m1: 0.5 }),
      battle("y", 6, { m1: 1 }),
      battle("z", 12, { m1: 2 }),
    ]
    const points = { x: 50, y: 6, z: 12 }
    expect(ids(select({ battles, points, order: "points" }))).toEqual([
      "x",
      "z",
      "y",
    ])
    expect(ids(select({ battles, points, order: "energy" }))).toEqual([
      "z",
      "y",
    ])
    expect(
      ids(select({ battles, points, order: "energy", fewerRaids: true }))
    ).toEqual(["z"])
  })
})
