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
import { buildLanePointsModel } from "./lane-points-model"
import { buildSyncedLaneProgress } from "./synced-lane-progress"
import {
  buildCrossLaneLeaderboard,
  buildLaneLeaderboard,
  crossLaneTotal,
  filterLeaderboard,
  objectiveFilterKey,
  remainingLanePoints,
  sortCrossLaneLeaderboard,
  sortLeaderboard,
  unitLanePotential,
  type CrossLaneLeaderboardRow,
  type LeaderboardRow,
} from "./unit-potential"

const alpha = lysanderEvent.alpha
const alphaModel = buildLanePointsModel(alpha)
const dante = fixtureCharacter("bloodDante")
const encounter = (objectivesCleared: number[]) => ({
  objectivesCleared,
  highScore: 0,
  encounterPoints: 0,
})
const flyingKey = objectiveFilterKey({
  kind: "Trait",
  target: "Flying",
  exclude: false,
})
const noResilientKey = objectiveFilterKey({
  kind: "Trait",
  target: "Resilient",
  exclude: true,
})

describe("unitLanePotential", () => {
  it("reproduces Dante on Lysander Alpha: 32 + 80 (Flying) + 40 (No Resilient) = 152, 2 objectives", () => {
    expect(unitLanePotential(dante, alpha)).toEqual({
      pointsPerBattle: 152,
      objectivesCount: 2,
      satisfied: [2, 4],
    })
  })

  it("gives a unit the lane does not allow 0 points and 0 objectives", () => {
    const farsight = fixtureCharacter("tauFarsight")
    expect(unitLanePotential(farsight, alpha)).toEqual({
      pointsPerBattle: 0,
      objectivesCount: 0,
      satisfied: [],
    })
    const rows = buildLaneLeaderboard(alpha, legendaryEventCharacters, [])
    expect(rows.map((row) => row.unit.id)).not.toContain("tauFarsight")
    expect(rows).toHaveLength(alpha.availableUnitIds.length)
  })
})

describe("remainingLanePoints", () => {
  const potential = unitLanePotential(dante, alpha)

  it("is points per battle × 18 on an untouched lane: 2,736", () => {
    expect(remainingLanePoints(potential, undefined, alpha)).toBe(2736)
    const untouched = buildSyncedLaneProgress(alphaModel, undefined)
    expect(remainingLanePoints(potential, untouched, alpha)).toBe(2736)
  })

  it("drops five fully cleared battles: 152 × 13 = 1,976", () => {
    const progress = buildSyncedLaneProgress(alphaModel, {
      encounters: Array.from({ length: 5 }, () =>
        encounter([0, 1, 2, 3, 4, 5])
      ),
    })
    expect(remainingLanePoints(potential, progress, alpha)).toBe(1976)
  })

  it("deducts only the cleared objectives of a partial battle: 40 + 152 × 17 = 2,624", () => {
    const progress = buildSyncedLaneProgress(alphaModel, {
      encounters: [encounter([0, 3])],
    })
    expect(remainingLanePoints(potential, progress, alpha)).toBe(2624)
  })

  it("is 0 for a unit the lane does not allow", () => {
    const farsight = unitLanePotential(fixtureCharacter("tauFarsight"), alpha)
    expect(remainingLanePoints(farsight, undefined, alpha)).toBe(0)
  })
})

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
const row = (
  name: string,
  pointsPerBattle: number,
  objectivesCount: number,
  extra: Partial<LeaderboardRow> = {}
): LeaderboardRow => ({
  unit: unit(name, []),
  ownership: "owned",
  satisfiedKeys: [],
  pointsPerBattle,
  remainingPoints: pointsPerBattle * 18,
  objectivesCount,
  objectives: [],
  ...extra,
})
const nameOf = (entry: { unit: LegendaryEventUnit }) => entry.unit.name

describe("buildLaneLeaderboard", () => {
  // The spec's default-order example (152 / 2, 152 / 3, 207 / 2).
  const rows = [row("A", 152, 2), row("B", 152, 3), row("C", 207, 2)]

  it("orders by remaining points, then objectives, then name: C (3,726), B, A (2,736)", () => {
    const sorted = sortLeaderboard(rows, "remaining", nameOf)
    expect(
      sorted.map((entry) => [entry.unit.name, entry.remainingPoints])
    ).toEqual([
      ["C", 3726],
      ["B", 2736],
      ["A", 2736],
    ])
  })

  it("orders by points per battle when that figure is shown", () => {
    const shuffled = [
      row("A", 100, 1, { remainingPoints: 900 }),
      row("B", 200, 1, { remainingPoints: 100 }),
    ]
    expect(sortLeaderboard(shuffled, "remaining", nameOf).map(nameOf)).toEqual([
      "A",
      "B",
    ])
    expect(sortLeaderboard(shuffled, "perBattle", nameOf).map(nameOf)).toEqual([
      "B",
      "A",
    ])
  })

  it("sorts the built leaderboard by remaining points and fills the row fields", () => {
    // Real units: A = Dante-like (152, 2), C = Eviscerate + Flying + No Resilient (227, 3).
    const a = unit("A", ["Flying"])
    const c = unit("C", ["Flying"], "Eviscerate")
    const progress = buildSyncedLaneProgress(alphaModel, {
      encounters: [encounter([0, 3])],
    })
    const built = buildLaneLeaderboard(
      alpha,
      [a, c, dante],
      undefined,
      progress
    )
    expect(
      built.map((entry) => [
        entry.unit.name,
        entry.pointsPerBattle,
        entry.remainingPoints,
        entry.objectivesCount,
      ])
    ).toEqual([
      ["C", 227, 227 * 17 + 115, 3],
      ["A", 152, 2624, 2],
      ["Dante", 152, 2624, 2],
    ])
    expect(built[2]).toMatchObject({
      objectives: [false, false, true, false, true],
      satisfiedKeys: [flyingKey, noResilientKey],
    })
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
    const byId = new Map(built.map((entry) => [entry.unit.id as string, entry]))
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

describe("filterLeaderboard", () => {
  const flyingOnly = row("FlyingOnly", 112, 1, { satisfiedKeys: [flyingKey] })
  const danteRow = row("Dante", 152, 2, {
    satisfiedKeys: [flyingKey, noResilientKey],
  })
  const locked = row("Locked", 300, 3, {
    ownership: "locked",
    satisfiedKeys: [flyingKey, noResilientKey],
  })
  const rows = [flyingOnly, danteRow, locked]

  it("keeps only units satisfying every selected objective", () => {
    const kept = filterLeaderboard(rows, {
      onlyUnlocked: false,
      objectiveKeys: new Set([flyingKey, noResilientKey]),
    })
    expect(kept.map(nameOf)).toEqual(["Dante", "Locked"])
  })

  it("removes locked units when only unlocked is on", () => {
    const kept = filterLeaderboard(rows, {
      onlyUnlocked: true,
      objectiveKeys: new Set(),
    })
    expect(kept.map(nameOf)).toEqual(["FlyingOnly", "Dante"])
  })

  it("returns no rows when no unit satisfies the selection", () => {
    const eviscerateKey = objectiveFilterKey({
      kind: "DamageType",
      target: "Eviscerate",
      exclude: false,
    })
    expect(
      filterLeaderboard(rows, {
        onlyUnlocked: false,
        objectiveKeys: new Set([eviscerateKey, flyingKey]),
      })
    ).toEqual([])
  })
})

describe("buildCrossLaneLeaderboard", () => {
  it("sums the shown figure over the lanes that allow the unit, with — elsewhere", () => {
    const danteRow: CrossLaneLeaderboardRow = {
      unit: dante,
      ownership: "owned",
      satisfiedKeys: [],
      lanes: {
        alpha: { pointsPerBattle: 152, remainingPoints: 2736 },
        beta: { pointsPerBattle: 100, remainingPoints: 1200 },
        gamma: undefined,
      },
    }
    const other: CrossLaneLeaderboardRow = {
      ...danteRow,
      unit: unit("Other", []),
      lanes: {
        alpha: { pointsPerBattle: 300, remainingPoints: 3000 },
        beta: undefined,
        gamma: undefined,
      },
    }
    expect(crossLaneTotal(danteRow, "remaining")).toBe(3936)
    expect(crossLaneTotal(danteRow, "perBattle")).toBe(252)
    expect(
      sortCrossLaneLeaderboard([other, danteRow], "remaining", nameOf).map(
        nameOf
      )
    ).toEqual(["Dante", "Other"])
    expect(
      sortCrossLaneLeaderboard([other, danteRow], "perBattle", nameOf).map(
        nameOf
      )
    ).toEqual(["Other", "Dante"])
  })

  it("builds one row per unit allowed on at least one lane with per-lane figures", () => {
    const rows = buildCrossLaneLeaderboard(
      lysanderEvent,
      [dante, fixtureCharacter("tauFarsight")],
      undefined,
      {}
    )
    // Farsight (Xenos) is allowed on Beta only, so both units are listed.
    expect(rows.map((entry) => entry.unit.id)).toEqual(
      expect.arrayContaining(["bloodDante", "tauFarsight"])
    )
    const danteRow = rows.find((entry) => entry.unit.id === "bloodDante")
    const farsightRow = rows.find((entry) => entry.unit.id === "tauFarsight")
    expect(farsightRow?.lanes.alpha).toBeUndefined()
    expect(farsightRow?.lanes.beta).toBeDefined()
    expect(danteRow?.lanes.alpha).toEqual({
      pointsPerBattle: 152,
      remainingPoints: 2736,
    })
    expect(danteRow?.lanes.beta).toBeUndefined()
    expect(danteRow?.lanes.gamma).toEqual({
      pointsPerBattle: unitLanePotential(dante, lysanderEvent.gamma)
        .pointsPerBattle,
      remainingPoints:
        unitLanePotential(dante, lysanderEvent.gamma).pointsPerBattle * 18,
    })
    expect(danteRow?.satisfiedKeys).toEqual(
      expect.arrayContaining([flyingKey, noResilientKey])
    )
  })
})
