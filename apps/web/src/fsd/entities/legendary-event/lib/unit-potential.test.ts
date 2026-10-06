import { describe, expect, it } from "vitest"

import {
  fixtureCharacter,
  legendaryEventCharacters,
} from "@/test/fixtures/legendary-event-characters"
import { lysanderEvent } from "@/test/fixtures/legendary-events"

import type {
  LegendaryEventRosterUnit,
  LegendaryEventUnit,
} from "../model/types"
import {
  buildLaneLeaderboard,
  sortLeaderboard,
  unitLanePotential,
  type LeaderboardRow,
} from "./unit-potential"

const alpha = lysanderEvent.alpha
const dante = fixtureCharacter("bloodDante")

describe("unitLanePotential", () => {
  it("reproduces Dante on Lysander Alpha: 32 + 80 (Flying) + 40 (No Resilient) = 152, 2 slots", () => {
    expect(unitLanePotential(dante, alpha)).toEqual({
      points: 152,
      slots: 2,
      satisfied: [2, 4],
    })
  })

  it("gives a unit the lane does not allow 0 points and 0 slots", () => {
    const farsight = fixtureCharacter("tauFarsight")
    expect(unitLanePotential(farsight, alpha)).toEqual({
      points: 0,
      slots: 0,
      satisfied: [],
    })
    const rows = buildLaneLeaderboard(alpha, legendaryEventCharacters, [])
    expect(rows.map((row) => row.unit.id)).not.toContain("tauFarsight")
    expect(rows).toHaveLength(alpha.availableUnitIds.length)
  })
})

describe("buildLaneLeaderboard", () => {
  // Synthetic Imperial units built on Dante's catalog record.
  const unit = (
    id: string,
    traits: string[],
    meleeDamage = "Piercing"
  ): LegendaryEventUnit => ({
    ...dante,
    id: id as LegendaryEventUnit["id"],
    name: id,
    traits,
    meleeDamage,
    activeAbilityDamage: [],
  })
  // A: Flying + No Resilient = 32 + 80 + 40 = 152, 2 slots.
  const a = unit("A", ["Flying"])
  // The spec's default-order example (152 / 2, 152 / 3, 207 / 2) is not reachable with Lysander
  // Alpha's real scores, so these rows carry the example's points and slots directly.
  const rows: LeaderboardRow[] = [
    { unit: a, ownership: "owned", points: 152, slots: 2, objectives: [] },
    {
      unit: unit("B", []),
      ownership: "owned",
      points: 152,
      slots: 3,
      objectives: [],
    },
    {
      unit: unit("C", []),
      ownership: "owned",
      points: 207,
      slots: 2,
      objectives: [],
    },
  ]

  it("orders by points, then slots, then name: C, B, A", () => {
    const sorted = sortLeaderboard(
      rows,
      { key: "points", direction: "desc" },
      (row) => row.unit.name
    )
    expect(sorted.map((row) => row.unit.name)).toEqual(["C", "B", "A"])
  })

  it("sorts the built leaderboard in the default order", () => {
    // Real units: A = Dante-like (152, 2), C = Eviscerate + Flying + No Resilient (227, 3).
    const c = unit("C", ["Flying"], "Eviscerate")
    const built = buildLaneLeaderboard(alpha, [a, c, dante], undefined)
    expect(built.map((row) => [row.unit.name, row.points, row.slots])).toEqual([
      ["C", 227, 3],
      ["A", 152, 2],
      ["Dante", 152, 2],
    ])
  })

  it("sorts by slots or name in either direction", () => {
    const name = (row: LeaderboardRow) => row.unit.name
    expect(
      sortLeaderboard(rows, { key: "slots", direction: "desc" }, name).map(name)
    ).toEqual(["B", "C", "A"])
    expect(
      sortLeaderboard(rows, { key: "name", direction: "asc" }, name).map(name)
    ).toEqual(["A", "B", "C"])
    expect(
      sortLeaderboard(rows, { key: "points", direction: "asc" }, name).map(name)
    ).toEqual(["B", "A", "C"])
  })

  it("marks owned units with rarity and rank, the rest locked", () => {
    const roster: LegendaryEventRosterUnit[] = [
      {
        unitId: "bloodDante" as LegendaryEventRosterUnit["unitId"],
        rank: "Diamond1" as LegendaryEventRosterUnit["rank"],
        progressionIndex:
          "Legendary:RedFiveStars" as LegendaryEventRosterUnit["progressionIndex"],
      },
    ]
    const built = buildLaneLeaderboard(
      alpha,
      [dante, fixtureCharacter("astarLysander")],
      roster
    )
    const byId = new Map(built.map((row) => [row.unit.id as string, row]))
    expect(byId.get("bloodDante")).toMatchObject({
      ownership: "owned",
      rarity: "Legendary",
      rank: "Diamond1",
      objectives: [false, false, true, false, true],
    })
    expect(byId.get("astarLysander")).toMatchObject({ ownership: "locked" })
    expect(byId.get("astarLysander")?.rank).toBeUndefined()
    expect(byId.get("astarLysander")?.rarity).toBeUndefined()
  })

  it("reports unknown ownership when the roster is undefined", () => {
    const built = buildLaneLeaderboard(alpha, [dante], undefined)
    expect(built[0]).toMatchObject({ ownership: "unknown" })
    expect(built[0]?.rank).toBeUndefined()
  })
})
