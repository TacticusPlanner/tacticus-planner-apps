import { describe, expect, it } from "vitest"
import { selectTopEventLocations } from "./home-screen-event-locations"

const battle = (
  id: string,
  energyCost: number,
  campaignGroupId = "campaign1"
) => ({ id, campaignGroupId, energyCost })
const select = (
  overrides: Partial<Parameters<typeof selectTopEventLocations>[0]> & {
    points: Record<string, number>
  }
) => {
  const { points, ...rest } = overrides
  return selectTopEventLocations({
    battles: [battle("a", 5), battle("b", 10), battle("c", 5), battle("d", 5)],
    pointsByBattleId: new Map(Object.entries(points)),
    raidedToday: new Set(),
    passesFilter: () => true,
    ...rest,
  }).map((location) => location.battleId)
}

describe("selectTopEventLocations", () => {
  it("ranks by points per energy, then points per raid, then lower energy", () => {
    // a: 10/5 = 2, b: 20/10 = 2 (more points per raid wins), c: 4/5, d: 3/5 = 0.6
    expect(select({ points: { a: 10, b: 20, c: 4, d: 3 } })).toEqual([
      "b",
      "a",
      "c",
      "d",
    ])
  })

  it("caps the list at 10 and lists fewer when fewer qualify", () => {
    const many = Array.from({ length: 14 }, (_, i) => battle(`n${i}`, 5))
    const points = Object.fromEntries(many.map((b, i) => [b.id, i + 1]))
    expect(select({ battles: many, points }).length).toBe(10)
    expect(select({ points: { a: 5, c: 5 } })).toEqual(["a", "c"])
  })

  it("leaves out locations raided today, filtered out, zero-scoring or locked", () => {
    const points = { a: 50, b: 40, c: 30, d: 0 }
    expect(
      select({
        points,
        raidedToday: new Set(["a"]),
        passesFilter: (id) => id !== "b",
      })
    ).toEqual(["c"])
    // "locked" battles are simply not part of the eligible set.
    expect(select({ battles: [battle("c", 5)], points })).toEqual(["c"])
  })

  it("yields an empty list when the filter excludes everything", () => {
    expect(
      select({ points: { a: 5, b: 5, c: 5 }, passesFilter: () => false })
    ).toEqual([])
  })

  it("restricts to the active campaign event's battles", () => {
    const battles = [
      battle("std", 5),
      battle("ev1", 5, "event1"),
      battle("ev2", 10, "event2"),
    ]
    const points = { std: 9, ev1: 5, ev2: 20 }
    expect(select({ battles, points })).toEqual(["ev2", "std", "ev1"])
    expect(select({ battles, points, campaignGroupId: "event1" })).toEqual([
      "ev1",
    ])
  })
})
